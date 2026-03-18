import { approveTransaction, getTransactions } from "@/server/modules/txns/api";
import { createSchema, createYoga } from "graphql-yoga";

const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Transaction {
        id: String!
        clientId: String!
        qbId: String
        accountId: String
        amount: Float!
        createdAt: String!
        bankDesc: String!
        vendor: String
        categoryId: String
        confidenceCategory: Float
        confidenceVendor: Float
        reviewStatus: String!
      }

      type Query {
        getTransactions: [Transaction!]!
      }

      type Mutation {
        approveTransaction(id: String!, vendor: String, categoryId: String): Transaction!
      }
    `,
    resolvers: {
      Query: {
        getTransactions,
      },
      Mutation: {
        approveTransaction,
      },
    },
  }),

  // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
  graphqlEndpoint: "/api/graphql",

  // Yoga needs to know how to create a valid Next response
  fetchAPI: { Response },
});

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS,
};
