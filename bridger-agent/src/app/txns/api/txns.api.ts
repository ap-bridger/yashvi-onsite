import { gql } from "@apollo/client";

export const GET_TRANSACTIONS = gql`
  query GetTransactions {
    getTransactions {
      id
      amount
      status
      date
    }
  }
`;