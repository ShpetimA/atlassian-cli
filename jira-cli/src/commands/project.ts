import { Command } from "commander";
import { JiraClient } from "../clients/jira.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createProjectCommand(): Command {
  const project = new Command("project").description("Manage Jira projects");

  // List projects
  project
    .command("list")
    .description("List all projects")
    .option("-q, --query <text>", "Search by name or key")
    .option("--type <type>", "Filter by project type: software|business|service_desk")
    .option("--order-by <field>", "Order by: name|-name|key|-key|lastIssueUpdatedTime", "name")
    .option("--expand <fields>", "Expand: description,lead,issueTypes,url")
    .option("-l, --limit <n>", "Max results", "50")
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

      const result = await client.listProjects({
        startAt,
        maxResults: limit,
        query: options.query,
        typeKey: options.type,
        orderBy: options.orderBy,
        expand: options.expand?.split(","),
      });
      output(result, format, options.output);
    });

  // Get single project
  project
    .command("get <key>")
    .description("Get project details")
    .option("--expand <fields>", "Expand: description,lead,issueTypes,url,projectKeys")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getProject(key, options.expand?.split(","));
      output(result, format, options.output);
    });

  // Get project statuses
  project
    .command("statuses <key>")
    .description("List all statuses for a project (grouped by issue type)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getProjectStatuses(key);
      output(result, format, options.output);
    });

  // Get project components
  project
    .command("components <key>")
    .description("List all components for a project")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getProjectComponents(key);
      output(result, format, options.output);
    });

  // Get project versions
  project
    .command("versions <key>")
    .description("List all versions for a project")
    .option("--status <status>", "Filter: released|unreleased|archived")
    .option("--order-by <field>", "Order by: name|-name|releaseDate|-releaseDate|sequence|-sequence")
    .option("--expand <fields>", "Expand: issuesstatus,operations")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;

      const result = await client.getProjectVersions(key, {
        startAt,
        maxResults: limit,
        status: options.status,
        orderBy: options.orderBy,
        expand: options.expand?.split(","),
      });
      output(result, format, options.output);
    });

  return project;
}
