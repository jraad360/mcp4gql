import { z } from "zod";
import { executeGraphQL } from "../graphqlClient";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// Define the Zod schema for the input parameters
export const ExecutorSchemaInput = z.object({
  query: z.string().describe("The GraphQL query string to execute."),
  variables: z
    .record(z.unknown())
    .optional()
    .describe("An optional object containing variables for the query."),
  operationName: z
    .string()
    .optional()
    .describe(
      "An optional name for the operation, if the query contains multiple operations."
    ),
});

// Define the Zod schema for the output (general GraphQL response structure)
// We expect the result of executeGraphQL which includes data and errors
export const ExecutorSchemaOutput = z.object({
  data: z
    .record(z.unknown())
    .nullable()
    .optional()
    .describe("The data returned by the GraphQL server."),
  errors: z
    .array(z.object({ message: z.string() /* ... other optional fields */ }))
    .optional()
    .describe("Any errors encountered during query execution."),
});

/**
 * Handler function for the executeGraphQLQuery tool.
 * Executes a given GraphQL query against the configured endpoint.
 *
 * @param input The validated input parameters matching ExecutorSchemaInput.
 * @returns The result of the GraphQL query execution.
 * @throws {McpError} If the query execution fails.
 */
export async function handleExecution(
  input: z.infer<typeof ExecutorSchemaInput>
): Promise<z.infer<typeof ExecutorSchemaOutput>> {
  const { query, variables, operationName } = input;

  try {
    console.error(`Executing GraphQL query: ${operationName || "unnamed"}...`);

    const response = await executeGraphQL<z.infer<typeof ExecutorSchemaOutput>>(
      query,
      variables,
      operationName
    );

    // GraphQL endpoints often return 200 OK even if there are query errors.
    // These are included in the 'errors' array in the response body.
    if (response.errors && response.errors.length > 0) {
      const errorMessages = response.errors.map((e) => e.message).join("; ");
      console.error(
        `GraphQL query ${
          operationName || "unnamed"
        } returned errors: ${errorMessages}`,
        response.errors
      );
      // We return the full response including data and errors as per the MCP flow
      // The client consuming the MCP tool will decide how to handle the errors field.
      // No McpError is thrown here unless the request itself failed (handled in executeGraphQL)
    }

    console.error(`GraphQL query ${operationName || "unnamed"} executed.`);
    return response; // Return the full response { data?: ..., errors?: ... }
  } catch (error) {
    // This catches errors thrown by executeGraphQL (network, HTTP errors, etc.)
    console.error(
      `Error executing GraphQL query ${operationName || "unnamed"}:`,
      error
    );
    if (error instanceof McpError) {
      // Re-throw McpErrors directly
      throw error;
    }
    // Wrap unexpected errors
    throw new McpError(
      ErrorCode.InternalError,
      `An unexpected error occurred while executing the GraphQL query '${
        operationName || "unnamed"
      }'.`,
      { cause: error as Error }
    );
  }
}
