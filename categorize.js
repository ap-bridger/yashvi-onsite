const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const CATEGORIZED_PATH = path.join(
  __dirname,
  "sample_data/sample_categorized.csv",
);
const PENDING_PATH = path.join(
  __dirname,
  "sample_data/pending_transactions.csv",
);

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

const responseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      index: { type: SchemaType.NUMBER, description: "0-based row index" },
      fromTo: {
        type: SchemaType.STRING,
        description: "The From/To entity name",
      },
      category: {
        type: SchemaType.STRING,
        description:
          "The full category string, e.g. 'Added to:  Expense: Cost of Goods Sold 02/10/2026 $1,565.88'",
      },
    },
    required: ["index", "fromTo", "category"],
  },
};

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Set GEMINI_API_KEY environment variable");
    process.exit(1);
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

  // Print results
  console.log("Date,Bank description,Spent,Received,From/To,Match/Categorize");
  for (const item of allResults) {
    const row = pending[item.index];
    if (!row) continue;
    const fields = [
      row["Date"],
      row["Bank description"],
      row["Spent"],
      row["Received"],
      `"${item.fromTo}"`,
      `"${item.category}"`,
    ];
    console.log(fields.join(","));
  }
}

main().catch(console.error);
