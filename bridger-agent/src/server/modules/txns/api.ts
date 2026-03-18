import { prisma } from "@/lib/db";

export const getTransactions = async () => {
  return prisma.transaction.findMany();
};
