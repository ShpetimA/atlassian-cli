import { Command } from "commander";
import * as fs from "fs";
import { ConfluenceClient } from "../clients/confluence.js";
import { resolveJiraConfig, getDefaultFormat, loadConfig } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

function getDefaultSpace(): string | undefined {
  const envSpace = process.env.CONFLUENCE_SPACE;
  if (envSpace) return envSpace;
  const config = loadConfig();
  return config?.defaults.space;
}

export function createPageCommand(): Command {
  const page = new Command("page").description("Manage Confluence pages");

  // List pages
  page
    .command("list")
    .description("List pages in a space")
    .option("--space <id>", "Space ID (required)")
    .option("--status <status>", "Page status: current|draft|trashed|archived")
    .option("--sort <sort>", "Sort: id|title|created-date|modified-date")
    .option("-l, --limit <n>", "Max results", "25")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const spaceId = options.space || getDefaultSpace();
      if (!spaceId) {
        throw new Error("Space ID required. Use --space or set CONFLUENCE_SPACE env var");
      }

      const result = await client.listPages({
        spaceId,
        limit: parseInt(options.limit, 10),
        status: options.status,
        sort: options.sort,
      });
      output(result, format, options.output);
    });

  // Get page
  page
    .command("get <id>")
    .description("Get page by ID")
    .option("--body <format>", "Body format: storage|atlas_doc_format|view")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getPage(id, options.body);
      output(result, format, options.output);
    });

  // Create page
  page
    .command("create")
    .description("Create a new page")
    .requiredOption("--space <id>", "Space ID")
    .requiredOption("--title <title>", "Page title")
    .option("--parent <id>", "Parent page ID")
    .option("--body <content>", "Page body (storage format HTML)")
    .option("--body-file <path>", "Read body from file")
    .option("--status <status>", "Page status: current|draft", "current")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      let bodyContent = options.body || "";
      if (options.bodyFile) {
        bodyContent = fs.readFileSync(options.bodyFile, "utf-8");
      }

      const result = await client.createPage({
        spaceId: options.space,
        title: options.title,
        parentId: options.parent,
        status: options.status,
        body: bodyContent
          ? { representation: "storage", value: bodyContent }
          : undefined,
      });
      output(result, format, options.output);
    });

  // Update page
  page
    .command("update <id>")
    .description("Update an existing page")
    .requiredOption("--title <title>", "Page title")
    .option("--body <content>", "Page body (storage format HTML)")
    .option("--body-file <path>", "Read body from file")
    .option("--message <msg>", "Version message")
    .option("--status <status>", "Page status: current|draft", "current")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      // First get current version
      const existing = await client.getPage(id);
      const currentVersion = existing.version?.number || 0;

      let bodyContent = options.body;
      if (options.bodyFile) {
        bodyContent = fs.readFileSync(options.bodyFile, "utf-8");
      }

      const result = await client.updatePage(id, {
        id,
        title: options.title,
        status: options.status,
        body: bodyContent
          ? { representation: "storage", value: bodyContent }
          : undefined,
        version: {
          number: currentVersion + 1,
          message: options.message,
        },
      });
      output(result, format, options.output);
    });

  // Delete page
  page
    .command("delete <id>")
    .description("Delete a page")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      await client.deletePage(id);
      output({ success: true, deleted: id }, format);
    });

  // List child pages
  page
    .command("children <id>")
    .description("List child pages")
    .option("-l, --limit <n>", "Max results", "25")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getPageChildren(id, {
        limit: parseInt(options.limit, 10),
      });
      output(result, format, options.output);
    });

  // List page comments
  page
    .command("comments <id>")
    .description("List page footer comments")
    .option("-l, --limit <n>", "Max results", "25")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getPageComments(id, {
        limit: parseInt(options.limit, 10),
      });
      output(result, format, options.output);
    });

  // Add comment
  page
    .command("comment <id> <text>")
    .description("Add a footer comment to a page")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, text, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      // Wrap text in simple paragraph storage format
      const storageValue = `<p>${text}</p>`;
      const result = await client.createFooterComment({
        pageId: id,
        body: { representation: "storage", value: storageValue },
      });
      output(result, format, options.output);
    });

  // List page labels
  page
    .command("labels <id>")
    .description("List page labels")
    .option("-l, --limit <n>", "Max results", "25")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getPageLabels(id, {
        limit: parseInt(options.limit, 10),
      });
      output(result, format, options.output);
    });

  // Add label
  page
    .command("add-label <id> <label>")
    .description("Add a label to a page")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, label, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.addPageLabel(id, label);
      output(result, format, options.output);
    });

  return page;
}
