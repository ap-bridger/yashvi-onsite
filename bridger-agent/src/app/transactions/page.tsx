import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Transactions } from "@/components/Transactions/Transactions";

export default function TransactionsPage() {
  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)] bg-[#F6F7FB]">
      <Sidebar />
      <main className="flex-1 p-8 sm:p-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Transactions
        </h1>
        <div className="mt-6">
          <Transactions />
        </div>
      </main>
    </div>
  );
}

