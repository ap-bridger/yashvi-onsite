import { gql } from "@apollo/client";

export const GET_APPROVED_TRANSACTIONS = gql`
  query GetApprovedTransactions {
    getApprovedTransactions {
      id
      amount
      status
      date
    }
  }
`;