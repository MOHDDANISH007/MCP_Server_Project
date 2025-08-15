import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { chromium } from "playwright";

// Import CommonJS tools
import pkg from "../server/mcp.tool.js";
const { createPost, fetchNews } = pkg;

import { z } from "zod";


// -------- Tools --------

// Tool 1: Add two numbers
const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
});

const app = express();

// Tool 1: Add two numbers
server.tool(
  "addTwoNumbers",
  "Add two numbers",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `The sum of ${a} and ${b} is ${a + b}` }],
  })
);

// Tool 2: Create a Twitter/X post
server.tool(
  "createPost",
  "Create a post on X (formerly Twitter)",
  { status: z.string() },
  async ({ status }) => {
    const message = await createPost(status);
    return { content: [{ type: "text", text: message }] };
  }
);

// Tool 3: Playwright MCP tool
server.tool(
  "playwrightMCP",
  "Interact with web applications using Playwright MCP",
  { url: z.string() },
  async ({ url }) => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const content = await page.content();
    await browser.close();

    return {
      content: [
        { type: "text", text: `Fetched content from ${url}: ${content.slice(0, 3000)}...` },
      ],
    };
  }
);

// Tool 4: Fetch news
server.tool(
  "fetchNews",
  "Fetch top news articles",
  { query: z.string().optional() },
  async ({ query }) => {
    const news = await fetchNews({ query });
    return { content: [{ type: "text", text: news }] };
  }
);

// Keep track of active SSE connections
const transports = {};

// SSE connection for MCP client
app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;

  res.on("close", () => {
    delete transports[transport.sessionId];
  });

  await server.connect(transport);
});

// Endpoint to handle POST messages from MCP client
app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];

  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.listen(3001, () => {
  console.log("MCP server running at http://localhost:3001");
});
