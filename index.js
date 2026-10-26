const deepmerge = require('deepmerge');
const express = require('express');
const { expressMiddleware } = require('@as-integrations/express4');
const cors = require('cors');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { useServer } = require('graphql-ws/lib/use/ws');
const { WebSocketServer } = require('ws');
const http = require('http');
const { ApolloServer } = require('@apollo/server');
const { gql } = require('graphql-tag');

const PORT = process.env.PORT || 4123;
const app = express();
const httpServer = http.createServer(app);
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql'
});

const typeDefs = gql`
    type Query {
        test: String
    }
`;

const dataSources = {
};

(async () => {

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {}
  });

  const serverCleanup = useServer({
    schema,
    context: (ctx) => {
      return {
        ...ctx,
        dataSources
      };
    }
  }, wsServer);

  const server = new ApolloServer({
    schema,
    dataSources: () => dataSources,
    playground: {
      settings: {
        "request.credentials": "include"
      }
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            }
          };
        }
      }
    ]
  });

  await server.start();

  const corsOptions = {
    origin: [
      'http://localhost:4200',
    ],
    credentials: true
  };

  app.use(
    '/graphql',
    cors(corsOptions),
    express.json(),
    expressMiddleware(server, {
      context: async () => {
        return {};
      }
    })
  );

  httpServer.listen(PORT, (err) => {
    if (err) {
      throw new Error(err)
    }

    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Subscriptions ready at ws://localhost:${PORT}${wsServer.options.path}`);
  });
})();

