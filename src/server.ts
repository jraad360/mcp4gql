import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import zodToJsonSchema from "zod-to-json-schema";
import { z } from "zod";

// Import tool handlers and schemas
import {
  handleIntrospection,
  IntrospectSchemaInput,
} from "./tools/introspection";
import { handleExecution, ExecutorSchemaInput } from "./tools/executor";
import config from "./config"; // Load configuration (ensures validation runs early)

// MCP Server setup
const server = new Server(
  {
    name: "helm-graphql-mcp-server",
    version: "0.1.0", // TODO: Update version from package.json?
  },
  {
    capabilities: {
      tools: {}, // Indicate tool capability
    },
  }
);

// ListTools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("Handling ListTools request");
  try {
    // Convert Zod schemas to JSON Schemas
    const introspectionInputSchema = zodToJsonSchema(IntrospectSchemaInput);
    const executeInputSchema = zodToJsonSchema(ExecutorSchemaInput);

    return {
      tools: [
        {
          name: "introspectGraphQLSchema",
          description:
            "Fetches the schema of the target GraphQL API using introspection. Returns the schema in JSON format.",
          inputSchema: introspectionInputSchema,
        },
        {
          name: "executeGraphQLOperation",
          description:
            "Executes an arbitrary GraphQL query or mutation against the target API. Use introspectGraphQLSchema first to understand the available operations.",
          inputSchema: executeInputSchema,
        },
      ],
    };
  } catch (error) {
    console.error("Error generating tool schemas:", error);
    // If schema generation fails, it's an internal server error
    // TODO: Revisit ErrorCode mapping once SDK types are clarified.
    throw new McpError(
      ErrorCode.InternalError,
      "Failed to generate tool schemas"
    );
  }
});

// CallTool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`Handling CallTool request for tool: ${name}`);

  try {
    let result: any;

    switch (name) {
      case "introspectGraphQLSchema":
        // Validate arguments using the Zod schema
        IntrospectSchemaInput.parse(args);
        console.error(`Calling handler for ${name}`);
        result = await handleIntrospection();
        break;

      case "executeGraphQLOperation":
        // Validate arguments using the Zod schema
        const validatedArgs = ExecutorSchemaInput.parse(args);
        console.error(`Calling handler for ${name}`);
        result = await handleExecution(validatedArgs);
        break;

      default:
        console.warn(`Received request for unknown tool: ${name}`);
        // TODO: Revisit ErrorCode mapping once SDK types are clarified.
        throw new McpError(ErrorCode.InternalError, `Unknown tool: ${name}`); // Placeholder
    }

    console.error(`Tool ${name} executed successfully`);
    // Format result as JSON string within TextContent
    const responseContent: TextContent = {
      type: "text",
      text: JSON.stringify(result, null, 2), // Pretty print JSON
    };

    return {
      content: [responseContent],
    };
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    if (error instanceof McpError) {
      // Re-throw known MCP errors
      throw error;
    } else if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      console.error("Input validation failed:", error.errors);
      // TODO: Revisit ErrorCode mapping once SDK types are clarified.
      throw new McpError(
        ErrorCode.InternalError, // Placeholder for InvalidInput
        `Invalid input for tool ${name}: ${error.errors
          .map((e) => `${e.path.join(".")} - ${e.message}`)
          .join("; ")}`,
        { details: error.format() }
      );
    } else {
      // Wrap unexpected errors
      // TODO: Revisit ErrorCode mapping once SDK types are clarified.
      throw new McpError(
        ErrorCode.InternalError,
        `An unexpected error occurred while executing tool ${name}.`,
        { cause: error as Error }
      );
    }
  }
});

// Main function to start the server
async function main() {
  console.error(`Starting Helm MCP Server (Phase 1)...`);
  console.error(`Connecting to GraphQL Endpoint: ${config.graphqlEndpoint}`);
  if (!config.authToken) {
    console.warn(
      "Auth token is not set. Requests may fail if API requires authentication."
    );
  }

  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.error("Helm MCP Server connected and running via stdio.");
  } catch (error) {
    console.error("Failed to connect or start server:", error);
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  console.error("Fatal error during server execution:", error);
  process.exit(1);
});
