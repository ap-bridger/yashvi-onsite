const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const CATEGORIZED_PATH = path.join(
  __dirname,
  "sample_data/sample_categorized.csv",
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

function parseAmount(str) {
  if (!str) return null;
  return parseFloat(str.replace(/[$,]/g, ""));
}

function buildTransactionSummary(categorized) {
  // Group transactions by their From/To + category account path to show patterns
  const groups = new Map();
  for (const row of categorized) {
    const fromTo = row["From/To"];
    // Extract just the account path (strip date and amount from "Transaction Posted")
    const posted = row["Transaction Posted"] || "";
    const accountMatch = posted.match(
      /^(Added to|Matched to):\s+(.+?)\s+\d{2}\/\d{2}\/\d{4}/,
    );
    const account = accountMatch ? accountMatch[2].trim() : posted;
    const key = `${fromTo}|||${account}`;

    const amount = parseAmount(row["Spent"]) || parseAmount(row["Received"]);
    if (!groups.has(key)) {
      groups.set(key, {
        fromTo,
        account,
        descriptions: new Set(),
        amounts: [],
        isSpent: !!row["Spent"],
      });
    }
    const g = groups.get(key);
    g.descriptions.add(row["Bank description"]);
    if (amount) g.amounts.push(amount);
  }

  return [...groups.values()]
    .map((g) => {
      const minAmt = Math.min(...g.amounts);
      const maxAmt = Math.max(...g.amounts);
      return `From/To: ${g.fromTo} | Account: ${g.account} | Direction: ${g.isSpent ? "spent" : "received"} | Bank descriptions: ${[...g.descriptions].join(", ")} | Amount range: $${minAmt.toFixed(2)} - $${maxAmt.toFixed(2)} (${g.amounts.length} transactions)`;
    })
    .join("\n");
}

const responseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      name: {
        type: SchemaType.STRING,
        description: "Human-readable rule name",
      },
      keywords: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description:
          "Keywords that ALL must match (case-insensitive) against the bank description",
      },
      minAmountCents: {
        type: SchemaType.INTEGER,
        description:
          "Minimum transaction amount in cents (inclusive), e.g. 1050 for $10.50",
      },
      maxAmountCents: {
        type: SchemaType.INTEGER,
        description:
          "Maximum transaction amount in cents (inclusive), e.g. 1050 for $10.50",
      },
      direction: {
        type: SchemaType.STRING,
        description: "'spent' or 'received'",
      },
      fromTo: {
        type: SchemaType.STRING,
        description: "The entity name to assign",
      },
      category: {
        type: SchemaType.STRING,
        description:
          "The account path, e.g. 'Expense: Cost of Goods Sold' or 'Deposit: Restaurant Sales'",
      },
    },
    required: [
      "name",
      "keywords",
      "minAmountCents",
      "maxAmountCents",
      "direction",
      "fromTo",
      "category",
    ],
  },
};

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Set GEMINI_API_KEY environment variable");
    process.exit(1);
  }

  const categorized = parseCSV(fs.readFileSync(CATEGORIZED_PATH, "utf-8"));
  const summary = buildTransactionSummary(categorized);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const prompt = `You are a bookkeeper analyzing categorized bank transactions for a restaurant business.

Below is a summary of transaction patterns grouped by entity and account category. Each group shows the From/To entity, the account it was posted to, the bank descriptions seen, and the amount range.

${summary}

Generate a set of categorization RULES that could be used to automatically categorize future transactions. Each rule should:

1. "keywords": an array of case-insensitive keywords that ALL must appear in the bank description to match. Use the minimum keywords needed to uniquely identify each transaction type. For example, ["adp", "wage", "pay"] not just ["adp"]. Keep keywords lowercase.
2. "minAmountCents" / "maxAmountCents": integer cents (e.g. $10.50 = 1050). Cover the observed range with ~20% padding on each side (rounded nicely). Use 0 as the floor.
3. "direction": "spent" if money goes out, "received" if money comes in.
4. "fromTo": the entity name to assign.
5. "category": just the account path (e.g. "Expense: Cost of Goods Sold"), not the full "Added to:" string.
6. "name": a short human-readable name for the rule.

IMPORTANT constraints:
- Only create rules for GENERALIZABLE patterns — recurring vendor names, payroll systems, delivery platforms, etc.
- Do NOT create rules for one-off transactions like checks ("Check 2510", "Check 2504"), Zelle payments to specific people, or other descriptions that contain unique identifiers (numbers, names) that won't repeat.
- Do not merge patterns that go to different accounts. If the same bank description maps to different accounts (e.g. "Toast" can be both an expense and a deposit), create separate rules distinguished by direction or amount range.`;

  console.error("Generating rules...");
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const rules = JSON.parse(text);

  // Match rules against categorized transactions and print with stats
  function matchesRule(rule, row) {
    const desc = row["Bank description"].toLowerCase();
    if (!rule.keywords.every((kw) => desc.includes(kw))) return false;
    const amount = parseAmount(row["Spent"]) || parseAmount(row["Received"]);
    if (amount === null) return false;
    const cents = Math.round(amount * 100);
    if (cents < rule.minAmountCents || cents > rule.maxAmountCents) return false;
    const dir = row["Spent"] ? "spent" : "received";
    if (dir !== rule.direction) return false;
    return true;
  }

  for (const rule of rules) {
    const matches = categorized.filter((row) => matchesRule(rule, row));
    rule._matchCount = matches.length;
    rule._firstMatch = matches[0]
      ? {
          date: matches[0]["date"],
          description: matches[0]["Bank description"],
          spent: matches[0]["Spent"],
          received: matches[0]["Received"],
          fromTo: matches[0]["From/To"],
          posted: matches[0]["Transaction Posted"],
        }
      : null;
  }

  console.log(JSON.stringify(rules, null, 2));
}

main().catch(console.error);
