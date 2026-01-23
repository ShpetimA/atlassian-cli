import { Command } from "commander";
import { JiraClient } from "../clients/jira.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createSearchCommand(): Command {
  const search = new Command("search").description("Search Jira issues");

  search
    .command("query")
    .argument("<jql>", "JQL query string")
    .description("Search issues using JQL")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--fields <fields>", "Comma-separated fields to return")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (jql, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;

      const searchOptions: any = { startAt, maxResults: limit };
      if (options.fields) {
        searchOptions.fields = options.fields.split(",").map((f: string) => f.trim());
      }

      const result = await client.searchIssues(jql, searchOptions);
      output(result, format, options.output);
    });

  search
    .command("count")
    .argument("<jql>", "JQL query string")
    .description("Get approximate count of issues matching JQL")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (jql, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getApproximateCount(jql);
      output(result, format, options.output);
    });

  // Keep backwards compatibility: `jc search <jql>` still works as default
  search
    .argument("[jql]", "JQL query string (shorthand for 'jc search query')")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--fields <fields>", "Comma-separated fields to return")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (jql, options) => {
      if (!jql) return; // Subcommand handled it
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;

      const searchOptions: any = { startAt, maxResults: limit };
      if (options.fields) {
        searchOptions.fields = options.fields.split(",").map((f: string) => f.trim());
      }

      const result = await client.searchIssues(jql, searchOptions);
      output(result, format, options.output);
    });

  return search;
}
