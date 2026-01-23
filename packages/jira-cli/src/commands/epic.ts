import { Command } from "commander";
import { JiraAgileClient } from "../clients/jira-agile.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createEpicCommand(): Command {
  const epic = new Command("epic").description("Manage Jira epics (Agile)");

  // List epics for a board
  epic
    .command("list <board-id>")
    .description("List epics for a board")
    .option("--done", "Include done epics")
    .option("--not-done", "Only show not-done epics")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (boardId, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;

      let done: boolean | undefined;
      if (options.done) done = true;
      if (options.notDone) done = false;

      const result = await client.listEpics(parseInt(boardId, 10), {
        startAt,
        maxResults: limit,
        done,
      });
      output(result, format, options.output);
    });

  // Get single epic
  epic
    .command("get <key>")
    .description("Get epic details")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getEpic(key);
      output(result, format, options.output);
    });

  // Get epic issues
  epic
    .command("issues <key>")
    .description("List issues in an epic")
    .option("-j, --jql <query>", "Additional JQL filter")
    .option("--fields <fields>", "Comma-separated fields to return")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;
      const fields = options.fields?.split(",");

      const result = await client.getEpicIssues(key, {
        startAt,
        maxResults: limit,
        jql: options.jql,
        fields,
      });
      output(result, format, options.output);
    });

  // Move issues to epic
  epic
    .command("move-issues <key>")
    .description("Move issues to an epic")
    .requiredOption("--issues <keys>", "Comma-separated issue keys (e.g., PROJ-1,PROJ-2)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const issues = options.issues.split(",").map((k: string) => k.trim());
      await client.moveIssuesToEpic(key, issues);
      output({
        success: true,
        epic: key,
        issues,
        message: `Moved ${issues.length} issue(s) to epic ${key}`,
      }, format);
    });

  // Remove issues from epic
  epic
    .command("remove-issues")
    .description("Remove issues from their epic")
    .requiredOption("--issues <keys>", "Comma-separated issue keys")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const issues = options.issues.split(",").map((k: string) => k.trim());
      await client.removeIssuesFromEpic(issues);
      output({
        success: true,
        issues,
        message: `Removed ${issues.length} issue(s) from their epic`,
      }, format);
    });

  // Rank issues (backlog ordering)
  epic
    .command("rank")
    .description("Rank/reorder issues in the backlog")
    .requiredOption("--issues <keys>", "Comma-separated issue keys to rank")
    .option("--before <key>", "Rank issues before this issue")
    .option("--after <key>", "Rank issues after this issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      if (!options.before && !options.after) {
        console.error("Error: Must specify --before or --after");
        process.exit(1);
      }

      const issues = options.issues.split(",").map((k: string) => k.trim());
      await client.rankIssues(issues, {
        rankBeforeIssue: options.before,
        rankAfterIssue: options.after,
      });
      output({
        success: true,
        issues,
        rankBefore: options.before,
        rankAfter: options.after,
        message: `Ranked ${issues.length} issue(s)`,
      }, format);
    });

  return epic;
}
