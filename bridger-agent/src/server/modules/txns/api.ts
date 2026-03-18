import { prisma } from "@/lib/db";
import { TransactionReviewStatus } from "./types";

export const getTransactions = async (
  _: unknown,
  args: { clientId: string }
) => {
  return prisma.transaction.findMany({
    where: { clientId: args.clientId },
  });
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

export const getCategories = async (
  _: unknown,
  args: { clientId: string }
) => {
  const clientCategories = await prisma.clientCategory.findMany({
    where: { clientId: args.clientId },
    include: { category: true },
  });
  return clientCategories.map((cc) => cc.category);
};
