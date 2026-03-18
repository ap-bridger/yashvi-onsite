const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const CATEGORIZED_PATH = path.join(
  __dirname,
  "../sample_data/sample_categorized.csv",
);
const PENDING_PATH = path.join(
  __dirname,
  "../sample_data/pending_transactions.csv",
);

const CLIENT_ID =
  process.env.CLIENT_ID || "00000000-0000-0000-0000-000000000001";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h.trim()] = (values[i] || "").trim()));
    return row;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[$,]/g, ""));
}

function buildExamplesBlock(categorized) {
  const seen = new Map();
  for (const row of categorized) {
    const key = row["Bank description"];
    if (!seen.has(key)) {
      seen.set(key, row);
    }
  }
  return [...seen.values()]
    .map(
      (r) =>
        `Bank description: ${r["Bank description"]} | Spent: ${r["Spent"]} | Received: ${r["Received"]} → From/To: ${r["From/To"]} | Category: ${r["Transaction Posted"]}`,
    )
    .join("\n");
}

// Extract account path from the full "Transaction Posted" / category string
// e.g. "Added to:  Expense: Cost of Goods Sold 02/10/2026 $1,565.88"
//   -> "Expense: Cost of Goods Sold"
function extractAccountPath(categoryStr) {
  const match = categoryStr.match(
    /^(?:Added to|Matched to):\s+(.+?)\s+\d{2}\/\d{2}\/\d{4}/,
  );
  return match ? match[1].trim() : categoryStr;
}

const responseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      index: { type: SchemaType.NUMBER, description: "0-based row index" },
      fromTo: {
        type: SchemaType.STRING,
        description:
          "The From/To entity name, or empty string if unknown",
        nullable: true,
      },
      category: {
        type: SchemaType.STRING,
        description:
          "The full category string, e.g. 'Added to:  Expense: Cost of Goods Sold 02/10/2026 $1,565.88', or empty string if unknown",
        nullable: true,
      },
      confidenceCategory: {
        type: SchemaType.NUMBER,
        description:
          "Confidence score 0-1 for the category prediction. Use 0 if category is null.",
      },
      confidenceVendor: {
        type: SchemaType.NUMBER,
        description:
          "Confidence score 0-1 for the vendor/fromTo prediction. Use 0 if fromTo is null.",
      },
    },
    required: [
      "index",
      "confidenceCategory",
      "confidenceVendor",
    ],
  },
};

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Set GEMINI_API_KEY environment variable");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // Ensure the client exists
    let client = await prisma.client.findUnique({ where: { id: CLIENT_ID } });
    if (!client) {
      client = await prisma.client.create({
        data: {
          id: CLIENT_ID,
          name: "Default Client",
          confidenceThreshold: 0.8,
        },
      });
      console.error(`Created default client: ${client.id}`);
    }

    const categorized = parseCSV(fs.readFileSync(CATEGORIZED_PATH, "utf-8"));
    const pending = parseCSV(fs.readFileSync(PENDING_PATH, "utf-8"));
    const examples = buildExamplesBlock(categorized);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    // Process in batches to stay within context limits
    const BATCH_SIZE = 25;
    const allResults = [];

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      const batchDesc = batch
        .map(
          (r, j) =>
            `[${i + j}] Date: ${r["Date"]} | Bank description: ${r["Bank description"]} | Spent: ${r["Spent"]} | Received: ${r["Received"]}`,
        )
        .join("\n");

      const prompt = `You are a bookkeeper categorizing bank transactions for a restaurant business.

Below are examples of previously categorized transactions (Bank description → From/To and Category):

${examples}

Now categorize these pending transactions. For each, predict:
1. "fromTo": the entity name (match the style from examples exactly)
2. "category": the full category string including "Added to:" or "Matched to:" prefix, the account path, the date, and the dollar amount (match the format from examples exactly)
3. "confidenceCategory": how confident you are in the category (0-1)
4. "confidenceVendor": how confident you are in the vendor/fromTo (0-1)

IMPORANT: Do not make up categories, only use ones that are in the categorized examples.
- Only predict a category if it is clearly correct, you do not need to generate predictions for examples like "Check 1234" where it isn't clear

Pending transactions:
${batchDesc}`;

      console.error(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pending.length / BATCH_SIZE)}...`,
      );
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      allResults.push(...parsed);
    }

    // Build a cache of category name -> Category record
    const categoryCache = new Map();

    async function getOrCreateCategory(accountPath) {
      if (categoryCache.has(accountPath)) {
        return categoryCache.get(accountPath);
      }
      let category = await prisma.category.findFirst({
        where: { name: accountPath },
      });
      if (!category) {
        category = await prisma.category.create({
          data: { name: accountPath },
        });
        // Also link to client
        await prisma.clientCategory.create({
          data: { clientId: CLIENT_ID, categoryId: category.id },
        });
        console.error(`Created category: ${accountPath}`);
      }
      categoryCache.set(accountPath, category);
      return category;
    }

    // Write transactions to database
    let created = 0;
    for (const item of allResults) {
      const row = pending[item.index];
      if (!row) continue;

      const spent = parseAmount(row["Spent"]);
      const received = parseAmount(row["Received"]);
      // Negative for money out, positive for money in
      const amount = received > 0 ? received : -spent;

      const hasCategory = item.category && item.category.length > 0;
      const hasVendor = item.fromTo && item.fromTo.length > 0;

      let categoryId = null;
      if (hasCategory) {
        const accountPath = extractAccountPath(item.category);
        const category = await getOrCreateCategory(accountPath);
        categoryId = category.id;
      }

      await prisma.transaction.create({
        data: {
          clientId: CLIENT_ID,
          amount,
          bankDesc: row["Bank description"],
          vendor: hasVendor ? item.fromTo : null,
          categoryId,
          confidenceCategory: item.confidenceCategory ?? 0,
          confidenceVendor: item.confidenceVendor ?? 0,
          reviewStatus: hasCategory ? "PENDING_REVIEW" : "NEEDS_REVIEW",
        },
      });
      created++;
    }

    console.error(`\nCreated ${created} transactions in database.`);

    // Also print CSV summary to stdout
    console.log(
      "Date,Bank description,Spent,Received,From/To,Category,Confidence",
    );
    for (const item of allResults) {
      const row = pending[item.index];
      if (!row) continue;
      const fields = [
        row["Date"],
        row["Bank description"],
        row["Spent"],
        row["Received"],
        item.fromTo ? `"${item.fromTo}"` : "",
        item.category ? `"${extractAccountPath(item.category)}"` : "",
        (item.confidenceCategory ?? 0).toFixed(2),
      ];
      console.log(fields.join(","));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
