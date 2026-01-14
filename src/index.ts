#!/usr/bin/env node
import { Command } from "commander";
import { createPrCommand } from "./commands/pr.js";
import { createRepoCommand } from "./commands/repo.js";

const program = new Command();

program
  .name("bb")
  .description("Bitbucket CLI for AI agents")
  .version("1.0.0")
  .option("-f, --format <format>", "Output format (json|plain|minimal)", "plain")
  .option("-o, --output <file>", "Write output to file")
  .option("-w, --workspace <workspace>", "Bitbucket workspace");

program.addCommand(createPrCommand());
program.addCommand(createRepoCommand());

program.parseAsync(process.argv).catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
