// Initial empty file for the GraphQL client helper

import axios from "axios";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import config from "./config"; // Import the loaded configuration

interface GraphQLErrorResponse {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, any>;
}

interface GraphQLResponse<T = any> {
  data: T | null;
  errors?: GraphQLErrorResponse[];
}

/**
 * Executes a GraphQL query or mutation against the configured endpoint.
 *
 * @param query The GraphQL query or mutation string.
 * @param variables Optional variables object for the operation.
 * @param operationName Optional operation name for the operation.
 * @returns A promise resolving to the GraphQL response data.
 * @throws {McpError} If the request fails due to network issues, HTTP errors, or GraphQL errors.
 */
export async function executeGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>,
  operationName?: string
): Promise<GraphQLResponse<T>> {
  const { graphqlEndpoint, authToken } = config;

  if (!graphqlEndpoint) {
    // Use PascalCase for ErrorCode members
    throw new McpError(
      ErrorCode.InternalError,
      "GraphQL endpoint URL is not configured."
    );
  }
  // We check authToken existence in config.ts, assume it's present if needed or proceed if not.

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await axios.post<GraphQLResponse<T>>(
      graphqlEndpoint,
      {
        query,
        variables,
        ...(operationName && { operationName }),
      },
      {
        headers,
        timeout: 30000, // 30 second timeout
      }
    );

    // Axios considers 2xx successful, return the body directly
    // The caller should check for response.data.errors
    return response.data;
  } catch (error: any) {
    // Use the imported isAxiosError type guard
    if (error.response) {
      // Now variable 'error' is narrowed to AxiosError type
      const statusCode = error.response?.status;
      const responseData = error.response?.data as any;
      const errorMessageBase = `GraphQL request failed: ${error.message}`;
      let detailedMessage = errorMessageBase;
      if (responseData?.errors?.[0]?.message) {
        detailedMessage = `${errorMessageBase} - ${responseData.errors[0].message}`;
      }

      if (statusCode === 401) {
        // Use PascalCase for ErrorCode members
        throw new McpError(
          ErrorCode.InvalidRequest,
          "Authentication failed. Check your AUTH_TOKEN.",
          { cause: error }
        );
      }
      if (statusCode === 403) {
        // Use PascalCase for ErrorCode members
        throw new McpError(
          ErrorCode.InvalidRequest,
          "Permission denied for GraphQL operation.",
          { cause: error }
        );
      }
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        // Use PascalCase for ErrorCode members
        throw new McpError(ErrorCode.InvalidRequest, detailedMessage, {
          cause: error,
        });
      }
      // Includes 5xx errors and network errors (statusCode is undefined)
      // Use PascalCase for ErrorCode members
      throw new McpError(ErrorCode.InternalError, detailedMessage, {
        cause: error,
      });
    } else if (error instanceof Error) {
      console.error("Unexpected error during GraphQL request:", error);
      // Use PascalCase for ErrorCode members
      throw new McpError(
        ErrorCode.InternalError,
        `An unexpected error occurred: ${error.message}`,
        { cause: error }
      );
    } else {
      console.error(
        "Unexpected non-error thrown during GraphQL request:",
        error
      );
      throw new McpError(
        ErrorCode.InternalError,
        "An unexpected non-error value was thrown during the GraphQL request.",
        { cause: new Error(String(error)) }
      );
    }
  }
}
