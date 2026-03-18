"use client";

import { apolloClient } from "@/client/graphql/apollo-client";
import { ApolloProvider, useQuery } from "@apollo/client";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { useParams } from "next/navigation";
import { GET_CATEGORIES } from "@/app/txns/api/txns.api";
import { Transactions } from "@/components/Transactions/Transactions";

function CategoriesList({ clientId }: { clientId: string }) {
  const { data, loading, error } = useQuery(GET_CATEGORIES, {
    variables: { clientId },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

function TxnsContent() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)] bg-[#F6F7FB]">
      <Sidebar />
      <main className="flex-1 p-8 sm:p-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Transactions
        </h1>

        <div className="mt-6">
          <Transactions clientId={clientId} />
        </div>

        <h1 className="mt-10 text-2xl font-semibold text-slate-900">
          Categories
        </h1>

        <div className="mt-6">
          <CategoriesList clientId={clientId} />
        </div>
      </main>
    </div>
  );
}

export default function TxnsPage() {
  return (
    <ApolloProvider client={apolloClient}>
      <TxnsContent />
    </ApolloProvider>
  );
}

