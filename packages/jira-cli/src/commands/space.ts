import { Command } from "commander";
import { ConfluenceClient } from "../clients/confluence.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createSpaceCommand(): Command {
  const space = new Command("space").description("Manage Confluence spaces");

  // List spaces
  space
    .command("list")
    .description("List all spaces")
    .option("--type <type>", "Space type: global|personal")
    .option("--status <status>", "Space status: current|archived")
    .option("-l, --limit <n>", "Max results", "25")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.listSpaces({
        limit: parseInt(options.limit, 10),
        type: options.type,
        status: options.status,
      });
      output(result, format, options.output);
    });

  // Get space by ID
  space
    .command("get <id-or-key>")
    .description("Get space by ID or key")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (idOrKey, options) => {
      const config = resolveJiraConfig({});
      const client = new ConfluenceClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      // If numeric, treat as ID; otherwise lookup by key
      let result;
      if (/^\d+$/.test(idOrKey)) {
        result = await client.getSpace(idOrKey);
      } else {
        result = await client.getSpaceByKey(idOrKey);
      }
      output(result, format, options.output);
    });

  return space;
}
