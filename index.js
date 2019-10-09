const express = require('express');
const http = require('http');
const { ApolloServer, gql} = require('apollo-server-express');

const PORT = process.env.PORT || 4123;
const app = express();
const httpServer = http.createServer(app);

const typeDefs = gql`
    type Query {
        test: String
    }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers: {},
  playground: {
    settings: {
      "request.credentials": "include"
    }
  }
});

server.applyMiddleware({
  app,
  cors: {
    origin: [
      'http://localhost:4200'
    ],
    credentials: true
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  console.log(`Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`);
});
