import { Command } from "commander";
import { BitbucketClient } from "../client.js";
import { output } from "../utils/output.js";
import type { OutputFormat } from "../types.js";

interface GlobalOptions {
  format: OutputFormat;
  output?: string;
  workspace?: string;
}

function getClient(): BitbucketClient {
  const config = {
    baseUrl: process.env.BITBUCKET_URL || "https://api.bitbucket.org/2.0",
    token: process.env.BITBUCKET_TOKEN,
    username: process.env.BITBUCKET_USERNAME,
    password: process.env.BITBUCKET_PASSWORD,
    workspace: process.env.BITBUCKET_WORKSPACE,
  };

  if (!config.token && !(config.username && config.password)) {
    console.error("Error: BITBUCKET_TOKEN or BITBUCKET_USERNAME/PASSWORD required");
    process.exit(1);
  }

  return new BitbucketClient(config);
}

function resolveWorkspace(opts: GlobalOptions, client: BitbucketClient): string {
  const ws = opts.workspace || client.getWorkspace();
  if (!ws) {
    console.error("Error: workspace required (--workspace or BITBUCKET_WORKSPACE)");
    process.exit(1);
  }
  return ws;
}

export function createRepoCommand(): Command {
  const repo = new Command("repo").description("Repository commands");

  repo.command("list")
    .description("List repositories")
    .option("-l, --limit <n>", "Number of results", "10")
    .option("-p, --page <n>", "Page number")
    .option("-n, --name <name>", "Filter by name")
    .action(async (opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.listRepositories(workspace, {
        pagelen: parseInt(opts.limit),
        page: opts.page ? parseInt(opts.page) : undefined,
        name: opts.name,
      });

      // Simplify output - just show name and slug
      const simplified = result.values.map(r => ({
        slug: r.slug,
        name: r.name,
        full_name: r.full_name,
      }));

      output(simplified, globalOpts.format, globalOpts.output);
    });

  return repo;
}
