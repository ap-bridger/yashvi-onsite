import { gql } from "@apollo/client";

export const GET_TRANSACTIONS = gql`
  query GetTransactions($clientId: String!) {
    getTransactions(clientId: $clientId) {
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

export const GET_CATEGORIES = gql`
  query GetCategories($clientId: String!) {
    getCategories(clientId: $clientId) {
      id
      name
      description
    }
  }
`;