import { Command } from "commander";
import { JiraAgileClient } from "../clients/jira-agile.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createSprintCommand(): Command {
  const sprint = new Command("sprint").description("Manage Jira sprints (Agile)");

  // List sprints for a board
  sprint
    .command("list <board-id>")
    .description("List sprints for a board")
    .option("--state <state>", "Filter by state: future|active|closed")
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

      const result = await client.listSprints(parseInt(boardId, 10), {
        startAt,
        maxResults: limit,
        state: options.state,
      });
      output(result, format, options.output);
    });

  // Get single sprint
  sprint
    .command("get <id>")
    .description("Get sprint details")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getSprint(parseInt(id, 10));
      output(result, format, options.output);
    });

  // Get sprint issues
  sprint
    .command("issues <id>")
    .description("List issues in a sprint")
    .option("-j, --jql <query>", "Additional JQL filter")
    .option("--fields <fields>", "Comma-separated fields to return")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;
      const fields = options.fields?.split(",");

      const result = await client.getSprintIssues(parseInt(id, 10), {
        startAt,
        maxResults: limit,
        jql: options.jql,
        fields,
      });
      output(result, format, options.output);
    });

  // Create sprint
  sprint
    .command("create <board-id>")
    .description("Create a new sprint")
    .requiredOption("--name <name>", "Sprint name")
    .option("--start-date <date>", "Start date (ISO 8601)")
    .option("--end-date <date>", "End date (ISO 8601)")
    .option("--goal <text>", "Sprint goal")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (boardId, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.createSprint({
        name: options.name,
        originBoardId: parseInt(boardId, 10),
        startDate: options.startDate,
        endDate: options.endDate,
        goal: options.goal,
      });
      output(result, format, options.output);
    });

  // Start sprint
  sprint
    .command("start <id>")
    .description("Start a sprint")
    .requiredOption("--start-date <date>", "Start date (ISO 8601)")
    .requiredOption("--end-date <date>", "End date (ISO 8601)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.startSprint(
        parseInt(id, 10),
        options.startDate,
        options.endDate
      );
      output(result, format, options.output);
    });

  // Close sprint
  sprint
    .command("close <id>")
    .description("Close a sprint")
    .option("--complete-date <date>", "Completion date (ISO 8601, defaults to now)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.closeSprint(parseInt(id, 10), options.completeDate);
      output(result, format, options.output);
    });

  // Move issues to sprint
  sprint
    .command("move-issues <id>")
    .description("Move issues to a sprint")
    .requiredOption("--issues <keys>", "Comma-separated issue keys (e.g., PROJ-1,PROJ-2)")
    .option("--rank-before <key>", "Rank moved issues before this issue")
    .option("--rank-after <key>", "Rank moved issues after this issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const issues = options.issues.split(",").map((k: string) => k.trim());
      await client.moveIssuesToSprint(parseInt(id, 10), issues, {
        rankBeforeIssue: options.rankBefore,
        rankAfterIssue: options.rankAfter,
      });
      output({
        success: true,
        sprintId: parseInt(id, 10),
        issues,
        message: `Moved ${issues.length} issue(s) to sprint`,
      }, format);
    });

  // Move issues to backlog
  sprint
    .command("to-backlog")
    .description("Move issues to backlog (remove from sprint)")
    .requiredOption("--issues <keys>", "Comma-separated issue keys")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const issues = options.issues.split(",").map((k: string) => k.trim());
      await client.moveIssuesToBacklog(issues);
      output({
        success: true,
        issues,
        message: `Moved ${issues.length} issue(s) to backlog`,
      }, format);
    });

  return sprint;
}
