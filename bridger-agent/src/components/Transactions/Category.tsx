"use client";

import * as React from "react";

export type CategoryOption = {
  value: string;
  label: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "all", label: "All categories" },
  { value: "Transfer", label: "Transfer" },
  { value: "Drinks & dining", label: "Drinks & dining" },
  { value: "Groceries", label: "Groceries" },
  { value: "Auto & transport", label: "Auto & transport" },
  { value: "Uncategorized", label: "Uncategorized" },
];

type CategoryProps = {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

export const Category = ({ value, onChange, className }: CategoryProps) => {
  return (
    <div className={className}>
      <select
        value={value ?? "all"}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
      >
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Category;

