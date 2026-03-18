import { gql } from "@apollo/client";

export const GET_TRANSACTIONS = gql`
  query GetTransactions {
    getTransactions {
      id
      clientId
      qbId
      accountId
      amount
      createdAt
      bankDesc
      vendor
      categoryId
      confidenceCategory
      confidenceVendor
      reviewStatus
    }
  }
`;