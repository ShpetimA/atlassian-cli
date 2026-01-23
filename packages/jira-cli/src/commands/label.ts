import { Command } from "commander";
import { JiraClient } from "../clients/jira.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createLabelCommand(): Command {
  const label = new Command("label").description("Manage Jira labels");

  // List all labels
  label
    .command("list")
    .description("List all labels in the Jira instance")
    .option("-l, --limit <n>", "Max results", "1000")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;

      const result = await client.listLabels({ startAt, maxResults: limit });
      output(result, format, options.output);
    });

  return label;
}
