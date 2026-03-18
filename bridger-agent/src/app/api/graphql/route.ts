import { greetings } from "@/server/modules/greet/api";
import { getApprovedTransactions } from "@/server/modules/txns/api";
import { createSchema, createYoga } from "graphql-yoga";

const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type ApprovedTransaction {
        id: String!
        amount: Float!
        status: String!
        date: String!
      }

      type Query {
        greetings: String
        getApprovedTransactions: [ApprovedTransaction!]!
      }
    `,
    resolvers: {
      Query: {
        greetings,
        getApprovedTransactions,
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
