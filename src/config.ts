/**
 * Application configuration.
 */
interface Config {
  graphqlEndpoint: string;
  authToken: string;
}

const config: Config = {
  graphqlEndpoint: process.env.GRAPHQL_ENDPOINT || "",
  authToken: process.env.AUTH_TOKEN || "",
};

// Validate essential configuration
if (!config.graphqlEndpoint) {
  console.error(
    "FATAL ERROR: GRAPHQL_ENDPOINT is not defined in the environment variables."
  );
  process.exit(1);
}

// Auth token might be optional depending on the API
if (!config.authToken) {
  console.warn(
    "WARNING: AUTH_TOKEN is not defined in the environment variables. GraphQL requests may fail if authentication is required."
  );
}

export default config;
