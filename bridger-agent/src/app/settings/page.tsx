import { Sidebar } from "@/components/Sidebar/Sidebar";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)] bg-[#F6F7FB]">
      <Sidebar />
      <main className="flex-1 p-8 sm:p-10">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Coming soon</p>
      </main>
    </div>
  );
}

