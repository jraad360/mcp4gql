// Initial empty file for custom error handling

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

// TODO: Implement detailed GraphQL error parsing and mapping to McpError

/**
 * Placeholder function for handling GraphQL errors.
 * This should be expanded to parse the error structure and map to specific McpError codes.
 *
 * @param errors The errors array from a GraphQL response.
 * @param defaultMessage A default message if no specific mapping is found.
 * @returns An McpError instance.
 */
export function mapGraphQLErrorToMcpError(
  errors: any[],
  defaultMessage: string = "GraphQL operation failed"
): McpError {
  // Basic implementation: just take the first message
  const message = errors[0]?.message || defaultMessage;
  console.error("GraphQL Errors Encountered:", errors);

  // TODO: Revisit ErrorCode mapping once SDK types are clarified.
  // Using InternalError as a generic placeholder for now.
  return new McpError(
    ErrorCode.InternalError, // Placeholder
    message,
    { details: { graphqlErrors: errors } } // Include original errors
  );
}

// Example usage (will be used in tool handlers later):
// if (response.errors) {
//   throw mapGraphQLErrorsToMcpError(response.errors);
// }
