export const getApprovedTransactions = async () => {
  return [
    {
      id: "txn_001",
      amount: 15000.0,
      status: "approved",
      date: "2026-03-15",
    },
    {
      id: "txn_002",
      amount: 7500.5,
      status: "approved",
      date: "2026-03-16",
    },
    {
      id: "txn_003",
      amount: 32000.0,
      status: "approved",
      date: "2026-03-17",
    },
    {
      id: "txn_004",
      amount: 4200.75,
      status: "approved",
      date: "2026-03-18",
    },
  ];
};
