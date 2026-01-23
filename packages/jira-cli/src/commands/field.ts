import { Command } from "commander";
import { JiraClient } from "../clients/jira.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createFieldCommand(): Command {
  const field = new Command("field").description("Manage Jira fields");

  // List all fields
  field
    .command("list")
    .description("List all fields in the Jira instance")
    .option("--custom", "Only show custom fields")
    .option("--system", "Only show system fields")
    .option("--searchable", "Only show searchable fields")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      let fields = await client.listFields();

      // Apply filters
      if (options.custom) {
        fields = fields.filter((f) => f.custom);
      } else if (options.system) {
        fields = fields.filter((f) => !f.custom);
      }
      if (options.searchable) {
        fields = fields.filter((f) => f.searchable);
      }

      output(fields, format, options.output);
    });

  return field;
}
