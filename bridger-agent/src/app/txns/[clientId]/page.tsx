import { redirect } from "next/navigation";

export default function TxnsRedirect({
  params,
}: {
  params: { clientId: string };
}) {
  redirect(`/${params.clientId}/transactions`);
}
