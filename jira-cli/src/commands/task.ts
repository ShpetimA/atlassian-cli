import { Command } from "commander";
import { JiraClient } from "../clients/jira.js";
import { resolveJiraConfig, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types/jira.js";

export function createTaskCommand(): Command {
  const task = new Command("task").description("Async task operations");

  // Get task status
  task
    .command("get <taskId>")
    .description("Get async task status")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (taskId: string, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getTask(taskId);
      output(result, format, options.output);
    });

  // Cancel task
  task
    .command("cancel <taskId>")
    .description("Cancel a running async task")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (taskId: string, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      await client.cancelTask(taskId);
      output({ success: true, taskId, message: "Cancel requested" }, format);
    });

  return task;
}
