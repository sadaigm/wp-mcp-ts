/**
 * WordPress MCP Server - Main Entry Point
 * Exports the server factory and provides CLI functionality
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWordPressServer } from "./server.js";
import { createWriteStream } from "node:fs";
import { join } from "node:path";

/**
 * Get the WordPress MCP Server instance
 */
export function getServer() {
  return createWordPressServer();
}

/**
 * Setup logging to file (only if explicitly enabled)
 */
function setupLogging() {
  // Only enable logging if explicitly requested via environment variable
  if (process.env.MCP_SERVER_LOGGING === "true") {
    const logDir = join(
      process.env.HOME || process.env.USERPROFILE || ".",
      ".wordpress-mcp-logs",
    );
    const logFile = join(logDir, `server-${Date.now()}.log`);

    // Create write stream
    const logStream = createWriteStream(logFile, { flags: "a" });

    // Custom logging function that doesn't interfere with stdout
    const logToFile = (level: string, ...args: unknown[]) => {
      const timestamp = new Date().toISOString();
      const message = args
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join(" ");
      logStream.write(`[${level}] ${timestamp} ${message}\n`);
    };

    // Save original console methods
    const originalError = console.error;

    // Override console methods to write ONLY to file
    console.log = (...args: unknown[]) => {
      logToFile("LOG", ...args);
    };

    console.error = (...args: unknown[]) => {
      logToFile("ERROR", ...args);
      // Write to stderr for critical errors only
      if (args.some((arg) => arg instanceof Error)) {
        originalError(...args);
      }
    };

    console.warn = (...args: unknown[]) => {
      logToFile("WARN", ...args);
    };

    // Log startup info
    logToFile("LOG", `WordPress MCP Server logging to: ${logFile}`);
    logToFile("LOG", `Node version: ${process.version}`);
    logToFile("LOG", `Working directory: ${process.cwd()}`);
    logToFile("LOG", `WP_URL: ${process.env.WP_URL ? "✓ Set" : "✗ Not set"}`);
    logToFile(
      "LOG",
      `WP_USERNAME: ${process.env.WP_USERNAME ? "✓ Set" : "✗ Not set"}`,
    );
    logToFile(
      "LOG",
      `WP_APP_PASSWORD: ${process.env.WP_APP_PASSWORD ? "✓ Set" : "✗ Not set"}`,
    );

    return logStream;
  }

  // Return a no-op stream when not logging
  return {
    write: () => {},
    end: () => {},
  } as unknown as ReturnType<typeof createWriteStream>;
}

/**
 * Main CLI entry point
 * Runs the server with stdio transport
 */
async function main() {
  const logStream = setupLogging();

  // Validate environment variables before starting server
  const wpUrl = process.env.WP_URL;
  const wpUsername = process.env.WP_USERNAME;
  const wpAppPassword = process.env.WP_APP_PASSWORD;

  if (!wpUrl || !wpUsername || !wpAppPassword) {
    console.error("Error: Missing required environment variables");
    console.error("Please set: WP_URL, WP_USERNAME, WP_APP_PASSWORD");
    logStream.end();
    process.exit(1);
  }

  // Log environment info (without sensitive data) - only when logging enabled
  if (process.env.MCP_SERVER_LOGGING === "true") {
    console.log("WordPress MCP Server starting...");
    console.log(`Node version: ${process.version}`);
    console.log(`Working directory: ${process.cwd()}`);
    console.log(`WP_URL: ${wpUrl ? "✓ Set" : "✗ Not set"}`);
    console.log(`WP_USERNAME: ${wpUsername ? "✓ Set" : "✗ Not set"}`);
    console.log(`WP_APP_PASSWORD: ${wpAppPassword ? "✓ Set" : "✗ Not set"}`);
  }

  const server = getServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (process.env.MCP_SERVER_LOGGING === "true") {
    console.log("Server connected successfully via stdio");
  }

  // Keep the process running
  process.on("SIGINT", async () => {
    if (process.env.MCP_SERVER_LOGGING === "true") {
      console.log("Received SIGINT, shutting down...");
    }
    await server.close();
    logStream.end();
    process.exit(0);
  });

  // Handle process termination
  process.on("SIGTERM", async () => {
    if (process.env.MCP_SERVER_LOGGING === "true") {
      console.log("Received SIGTERM, shutting down...");
    }
    await server.close();
    logStream.end();
    process.exit(0);
  });
}

console.log("calling main()");
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { createWordPressServer };
