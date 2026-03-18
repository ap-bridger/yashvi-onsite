"use client";

import { apolloClient } from "@/client/graphql/apollo-client";
import { ApolloProvider, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { GET_CATEGORIES, GET_TRANSACTIONS } from "../api/txns.api";
import { Transactions } from "@/components/Transactions/Transactions";

function TransactionsList({ clientId }: { clientId: string }) {
  const { data, loading, error } = useQuery(GET_TRANSACTIONS, {
    variables: { clientId },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1>Transactions</h1>
        <Transactions clientId={clientId} />
        <h1>Categories</h1>
        <CategoriesList clientId={clientId} />
      </main>
    </div>
  );
}

export default function Txns() {
  return (
    <ApolloProvider client={apolloClient}>
      <TxnsContent />
    </ApolloProvider>
  );
}
