# GraphQL MCP Server

This project is a Node.js/TypeScript server that implements the Model Context Protocol (MCP). It acts as a bridge, allowing MCP clients (like Cursor) to interact with a target GraphQL API.

## Features

- **MCP Server:** Implements the MCP `Server` class from `@modelcontextprotocol/sdk`.
- **Stdio Transport:** Communicates with clients via standard input/output.
- **GraphQL Client:** Uses `axios` to send requests to the configured GraphQL endpoint.
- **Generic GraphQL Tools:** Exposes the following tools to MCP clients:
  - `introspectGraphQLSchema`: Fetches the target GraphQL API schema using introspection.
  - `executeGraphQLOperation`: Executes arbitrary GraphQL queries or mutations against the target API, taking `query`, optional `variables`, and optional `operationName` as input.

## Configuration

The server requires the following environment variables:

- `GRAPHQL_ENDPOINT`: The URL of the target GraphQL API.
- `AUTH_TOKEN`: A bearer token for authenticating with the GraphQL API (if required).

## Installation

TODO
