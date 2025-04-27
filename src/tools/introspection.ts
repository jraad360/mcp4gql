import { z } from "zod";
import { executeGraphQL } from "../graphqlClient";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { getIntrospectionQuery } from "graphql"; // Import the helper

// Define the Zod schema for the input (no parameters needed)
export const IntrospectSchemaInput = z.object({});

// Define the expected output type (simplified, actual introspection result is complex)
// We expect the result of executeGraphQL which includes data and errors
interface IntrospectionResult {
  __schema: Record<string, any>; // Simplified representation
}

/**
 * Handler function for the introspectGraphQLSchema tool.
 * Fetches the GraphQL schema using introspection.
 *
 * @returns The GraphQL schema JSON.
 * @throws {McpError} If the introspection query fails.
 */
export async function handleIntrospection(): Promise<IntrospectionResult> {
  const introspectionQuery = getIntrospectionQuery(); // Get the standard query

  try {
    console.error("Executing GraphQL introspection query...");
    const response = await executeGraphQL<IntrospectionResult>(
      introspectionQuery
    );

    // Check for GraphQL errors returned in the response body
    if (response.errors && response.errors.length > 0) {
      const errorMessages = response.errors.map((e) => e.message).join("; ");
      console.error(
        `GraphQL introspection query returned errors: ${errorMessages}`,
        response.errors
      );
      // Using InternalError as a placeholder.
      throw new McpError(
        ErrorCode.InternalError,
        `Introspection query failed: ${errorMessages}`,
        { details: response.errors } // Include original errors in details
      );
    }

    if (!response.data || !response.data.__schema) {
      console.error(
        "Introspection query did not return a valid __schema object.",
        response.data
      );
      // TODO: Revisit ErrorCode mapping once SDK types are clarified.
      // Using InternalError as a placeholder.
      throw new McpError(
        ErrorCode.InternalError,
        "Introspection query did not return a valid schema."
      );
    }

    console.error("GraphQL introspection query successful.");
    return response.data; // Return the { data: { __schema: ... } } part
  } catch (error) {
    // Catch errors thrown by executeGraphQL (network, HTTP errors) or our own McpErrors
    console.error("Error executing introspection query:", error);
    if (error instanceof McpError) {
      // Re-throw McpErrors directly
      throw error;
    }
    // Wrap unexpected errors (using PascalCase)
    throw new McpError(
      ErrorCode.InternalError,
      "An unexpected error occurred during schema introspection.",
      { cause: error as Error }
    );
  }
}
