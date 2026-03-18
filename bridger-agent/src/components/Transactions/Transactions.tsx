"use client";

import * as React from "react";
import { useQuery } from "@apollo/client";
import { GET_CATEGORIES, GET_TRANSACTIONS } from "@/app/txns/api/txns.api";

type Transaction = {
  id: string;
  amount: number;
  createdAt: string; // ISO string or YYYY-MM-DD
  bankDesc: string;
  vendor: string | null;
  categoryId: string | null;
  reviewStatus: string;
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
};

type Category = {
  id: string;
  name: string;
  description: string | null;
};

const categoryLabel = (
  categoryId: string | null,
  categoryMap: Map<string, string>
) => {
  if (!categoryId) return "Uncategorized";
  return categoryMap.get(categoryId) ?? categoryId;
};

const categoryChipClasses = (category: string) => {
  switch (category) {
    case "Drinks & dining":
      return {
        pill: "bg-amber-50 border-amber-200 text-amber-700",
        dot: "bg-amber-400",
      };
    case "Groceries":
      return {
        pill: "bg-emerald-50 border-emerald-200 text-emerald-700",
        dot: "bg-emerald-400",
      };
    case "Auto & transport":
      return {
        pill: "bg-indigo-50 border-indigo-200 text-indigo-700",
        dot: "bg-indigo-400",
      };
    case "Transfer":
      return {
        pill: "bg-slate-50 border-slate-200 text-slate-700",
        dot: "bg-slate-400",
      };
    default:
      return {
        pill: "bg-slate-50 border-slate-200 text-slate-700",
        dot: "bg-slate-400",
      };
  }
};

function TransactionsTable({ clientId }: { clientId: string }) {
  const { data, loading, error } = useQuery(GET_TRANSACTIONS, {
    variables: { clientId },
  });
  const {data: categoriesData, loading: categoriesLoading, error: categoriesError} = useQuery(GET_CATEGORIES, { variables: { clientId } });
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  if (loading || categoriesLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
        Loading transactions...
      </div>
    );
  }

  if (error || categoriesError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-rose-600">
        Error: {error?.message || categoriesError?.message}
      </div>
    );
  }

  const categories = (categoriesData?.getCategories ?? []) as Category[];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const txns = (data?.getTransactions ?? []) as Transaction[];
  const filteredTxns = txns.filter((t) => {
    const cat = categoryLabel(t.categoryId, categoryMap);
    return categoryFilter === "all" || cat === categoryFilter;
  });

  const approvedTxns = filteredTxns.filter(
    (t) => t.reviewStatus === "APPROVED",
  );
  const pendingTxns = filteredTxns.filter((t) => t.reviewStatus !== "APPROVED");

  const TransactionsSection = ({
    title,
    sectionTxns,
    emptyMessage,
  }: {
    title: string;
    sectionTxns: Transaction[];
    emptyMessage: string;
  }) => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <span className="text-xs font-medium text-slate-500">
            {sectionTxns.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium">
                  Bank Description
                </th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Vendor</th>
              </tr>
            </thead>
            <tbody>
              {sectionTxns.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-600"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sectionTxns.map((txn) => {
                  const cat = categoryLabel(txn.categoryId, categoryMap);
                  const cls = categoryChipClasses(cat);

                  return (
                    <tr
                      key={txn.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div className="leading-snug">{txn.bankDesc}</div>
                        {txn.reviewStatus ? (
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            {txn.reviewStatus}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                        {formatAmount(txn.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {txn.createdAt}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <span
                          className={[
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                            cls.pill,
                          ].join(" ")}
                        >
                          <span
                            aria-hidden="true"
                            className={["h-2 w-2 rounded-full", cls.dot].join(
                              " ",
                            )}
                          />
                          {cat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium">
                          {txn.vendor ?? "Vendor"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <TransactionsSection
        title="Pending"
        sectionTxns={pendingTxns}
        emptyMessage="No pending transactions."
      />
      <TransactionsSection
        title="Approved"
        sectionTxns={approvedTxns}
        emptyMessage="No approved transactions."
      />
    </div>
  );
}

export const Transactions = ({ clientId }: { clientId: string }) => {
  return (
    <TransactionsTable clientId={clientId} />
  );
};
