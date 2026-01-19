import { Command } from "commander";
import { JiraClient } from "../clients/jira.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createFilterCommand(): Command {
  const filter = new Command("filter").description("Manage Jira saved filters");

  // List/search filters
  filter
    .command("list")
    .description("List and search filters")
    .option("-n, --name <name>", "Filter by name (contains)")
    .option("--owner <owner>", "Filter by owner account ID")
    .option("--project <id>", "Filter by project ID")
    .option("--favourites", "List only favourite filters")
    .option("--order-by <field>", "Order by: name, description, favourite_count, owner, id")
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

      const result = await client.searchFilters({
        filterName: options.name,
        owner: options.owner,
        projectId: options.project ? parseInt(options.project, 10) : undefined,
        favourites: options.favourites,
        orderBy: options.orderBy,
        startAt,
        maxResults: limit,
      });
      output(result, format, options.output);
    });

  // Get filter by ID
  filter
    .command("get <id>")
    .description("Get a filter by ID")
    .option("--expand <fields>", "Expand: sharedUsers, subscriptions")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const expand = options.expand?.split(",");
      const result = await client.getFilter(id, expand);
      output(result, format, options.output);
    });

  // Create filter
  filter
    .command("create")
    .description("Create a new filter")
    .requiredOption("--name <name>", "Filter name")
    .requiredOption("--jql <jql>", "JQL query for the filter")
    .option("--description <desc>", "Filter description")
    .option("--favourite", "Add to favourites")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.createFilter({
        name: options.name,
        jql: options.jql,
        description: options.description,
        favourite: options.favourite,
      });
      output(result, format, options.output);
    });

  // Update filter
  filter
    .command("update <id>")
    .description("Update a filter")
    .option("--name <name>", "New name")
    .option("--jql <jql>", "New JQL query")
    .option("--description <desc>", "New description")
    .option("--favourite", "Add to favourites")
    .option("--no-favourite", "Remove from favourites")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (id, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const request: Record<string, any> = {};
      if (options.name) request.name = options.name;
      if (options.jql) request.jql = options.jql;
      if (options.description !== undefined) request.description = options.description;
      if (options.favourite !== undefined) request.favourite = options.favourite;

      const result = await client.updateFilter(id, request);
      output(result, format, options.output);
    });

  // Delete filter
  filter
    .command("delete <id>")
    .description("Delete a filter")
    .action(async (id) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);

      await client.deleteFilter(id);
      console.log(`Filter ${id} deleted`);
    });

  return filter;
}
