import { prisma } from "@/lib/db";
import { TransactionReviewStatus } from "./types";

export const getTransactions = async () => {
  return prisma.transaction.findMany();
};

export const approveTransaction = async (
  _: unknown,
  args: { id: string; vendor: string | null; categoryId: string | null }
) => {
  const hasUpdates = args.vendor != null || args.categoryId != null;

  return prisma.transaction.update({
    where: { id: args.id },
    data: {
      ...(args.vendor != null && { vendor: args.vendor }),
      ...(args.categoryId != null && { categoryId: args.categoryId }),
      reviewStatus: hasUpdates
        ? TransactionReviewStatus.UPDATED
        : TransactionReviewStatus.APPROVED,
    },
  });
};
