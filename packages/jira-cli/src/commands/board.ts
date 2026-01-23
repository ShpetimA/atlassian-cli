import { Command } from "commander";
import { JiraAgileClient } from "../clients/jira-agile.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createBoardCommand(): Command {
  const board = new Command("board").description("Manage Jira boards (Agile)");

  // List boards
  board
    .command("list")
    .description("List all boards")
    .option("--type <type>", "Board type: scrum|kanban|simple")
    .option("--name <name>", "Filter by board name")
    .option("--project <key>", "Filter by project key or ID")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;

      const result = await client.listBoards({
        startAt,
        maxResults: limit,
        type: options.type,
        name: options.name,
        projectKeyOrId: options.project,
      });
      output(result, format, options.output);
    });

  // Get single board
  board
    .command("get <id>")
    .description("Get board details")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getBoard(parseInt(id, 10));
      output(result, format, options.output);
    });

  // Get board configuration
  board
    .command("config <id>")
    .description("Get board configuration")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraAgileClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getBoardConfiguration(parseInt(id, 10));
      output(result, format, options.output);
    });

  // Get board issues
  board
    .command("issues <id>")
    .description("List issues on a board")
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

      const result = await client.getBoardIssues(parseInt(id, 10), {
        startAt,
        maxResults: limit,
        jql: options.jql,
        fields,
      });
      output(result, format, options.output);
    });

  // Get backlog issues
  board
    .command("backlog <id>")
    .description("List backlog issues for a board")
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

      const result = await client.getBoardBacklog(parseInt(id, 10), {
        startAt,
        maxResults: limit,
        jql: options.jql,
        fields,
      });
      output(result, format, options.output);
    });

  return board;
}
