#!/usr/bin/env node

import { Command } from "commander";
import { createIssueCommand } from "./commands/issue.js";
import { createConfigCommand } from "./commands/config.js";
import { createSearchCommand } from "./commands/search.js";
import { createBoardCommand } from "./commands/board.js";
import { createSprintCommand } from "./commands/sprint.js";

const program = new Command();

program
  .name("jc")
  .description("Jira & Confluence CLI for AI agents")
  .version("1.0.0")
  .option("--format <format>", "Output format: json|plain|minimal", "json")
  .option("-o, --output <file>", "Write output to file")
  .option("--domain <domain>", "Jira domain override")
  .option("--profile <name>", "Config profile to use")
  .option("--debug", "Show HTTP request details");

// Register commands
program.addCommand(createIssueCommand());
program.addCommand(createConfigCommand());
program.addCommand(createSearchCommand());
program.addCommand(createBoardCommand());
program.addCommand(createSprintCommand());

program.parse();
