"use client";

import * as React from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  APPROVE_TRANSACTION,
  GET_CATEGORIES,
  GET_TRANSACTIONS,
} from "@/app/txns/api/txns.api";
import { Category, type CategoryOption } from "./Category";

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

const formatDate = (date: string) => {
  return date;
};

const categoryLabel = (categoryId: string | null) => {
  if (!categoryId) return "Uncategorized";

  const c = categoryId.toLowerCase();
  if (c.includes("dining") || c.includes("drink") || c.includes("restaurant")) {
    return "Drinks & dining";
  }
  if (c.includes("grocery") || c.includes("food")) return "Groceries";
  if (c.includes("transport") || c.includes("auto") || c.includes("commute")) {
    return "Auto & transport";
  }
  if (
    c.includes("transfer") ||
    c.includes("deposit") ||
    c.includes("payment")
  ) {
    return "Transfer";
  }

  return categoryId;
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
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    variables: { clientId },
  });
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useQuery(GET_CATEGORIES, { variables: { clientId } });

  type CategoryItem = { id: string; name: string; description?: string };
  const categories = (categoriesData?.getCategories ?? []) as CategoryItem[];

  const categoryNameById = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    return (
      categories.find((c) => c.id === categoryId)?.name ??
      categoryLabel(categoryId)
    );
  };

  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedTxn, setSelectedTxn] = React.useState<Transaction | null>(
    null,
  );
  const [draftCategoryId, setDraftCategoryId] = React.useState<string | null>(
    null,
  );
  const [draftVendor, setDraftVendor] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [drawerError, setDrawerError] = React.useState<string | null>(null);

  const [approveTransaction] = useMutation(APPROVE_TRANSACTION);

  const categoryFilterOptions: CategoryOption[] = [
    { value: "all", label: "All categories" },
    { value: "__uncategorized__", label: "Uncategorized" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const drawerCategoryOptions: CategoryOption[] = [
    { value: "__uncategorized__", label: "Uncategorized" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  React.useEffect(() => {
    if (!selectedTxn) return;
    setDrawerError(null);
    setDraftCategoryId(selectedTxn.categoryId);
    setDraftVendor(selectedTxn.vendor ?? "");
  }, [selectedTxn]);

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

  const txns = (data?.getTransactions ?? []) as Transaction[];
  const filteredTxns = txns.filter((t) => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "__uncategorized__") return t.categoryId == null;
    return t.categoryId === categoryFilter;
  });

  const approvedTxns = filteredTxns.filter(
    (t) => t.reviewStatus === "APPROVED",
  );
  const pendingTxns = filteredTxns.filter((t) => t.reviewStatus !== "APPROVED");

  const closeDrawer = async () => {
    if (!selectedTxn) {
      setDrawerOpen(false);
      return;
    }

    const nextVendor = draftVendor.trim() === "" ? null : draftVendor.trim();
    const nextCategoryId =
      draftCategoryId === "__uncategorized__" ? null : draftCategoryId;

    const vendorDirty = nextVendor !== selectedTxn.vendor;
    const categoryDirty = nextCategoryId !== selectedTxn.categoryId;
    const shouldUpdate = vendorDirty || categoryDirty;

    try {
      if (shouldUpdate) {
        setSaving(true);
        setDrawerError(null);

        await approveTransaction({
          variables: {
            id: selectedTxn.id,
            vendor: nextVendor,
            categoryId: nextCategoryId,
          },
        });

        await refetch();
      }
    } catch (e) {
      setDrawerError(
        e instanceof Error ? e.message : "Failed to update transaction",
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setDrawerOpen(false);
    setSelectedTxn(null);
  };

  const TransactionsSection = ({
    title,
    sectionTxns,
    emptyMessage,
    onRowClick,
  }: {
    title: string;
    sectionTxns: Transaction[];
    emptyMessage: string;
    onRowClick: (txn: Transaction) => void;
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
                  const catName = categoryNameById(txn.categoryId);
                  const cls = categoryChipClasses(catName);

                  return (
                    <tr
                      key={txn.id}
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => onRowClick(txn)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(txn);
                        }
                      }}
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
                          {catName}
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
    <>
      {drawerOpen && selectedTxn ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/20"
            onClick={() => void closeDrawer()}
          />
          <aside className="absolute right-0 top-0 h-full w-[440px] bg-white shadow-2xl border-l border-slate-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Transaction details
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedTxn.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void closeDrawer()}
                  disabled={saving}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">Bank</p>
                  <p className="text-sm text-slate-900">
                    {selectedTxn.bankDesc}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Amount</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatAmount(selectedTxn.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Date</p>
                    <p className="text-sm text-slate-900">
                      {formatDate(selectedTxn.createdAt)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <p className="text-sm text-slate-900">
                    {selectedTxn.reviewStatus}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Category
                  </p>
                  <Category
                    value={draftCategoryId ?? "__uncategorized__"}
                    onChange={(v) =>
                      setDraftCategoryId(v === "__uncategorized__" ? null : v)
                    }
                    options={drawerCategoryOptions}
                  />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Vendor
                  </p>
                  <input
                    value={draftVendor}
                    onChange={(e) => setDraftVendor(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                    placeholder="Enter vendor"
                  />
                </div>

                {drawerError ? (
                  <div className="text-sm text-rose-600">{drawerError}</div>
                ) : null}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => void closeDrawer()}
                  disabled={saving}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Close & update"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="flex items-center justify-end gap-3">
          <span className="text-sm font-medium text-slate-600">Category</span>
          <div className="w-56">
            <Category
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryFilterOptions}
            />
          </div>
        </div>

        <TransactionsSection
          title="Pending"
          sectionTxns={pendingTxns}
          emptyMessage="No pending transactions."
          onRowClick={(txn) => {
            setSelectedTxn(txn);
            setDrawerOpen(true);
          }}
        />
        <TransactionsSection
          title="Approved"
          sectionTxns={approvedTxns}
          emptyMessage="No approved transactions."
          onRowClick={(txn) => {
            setSelectedTxn(txn);
            setDrawerOpen(true);
          }}
        />
      </div>
    </>
  );
}

export const Transactions = ({ clientId }: { clientId: string }) => {
  return <TransactionsTable clientId={clientId} />;
};
