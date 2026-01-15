import { Command } from "commander";
import { BitbucketClient } from "../client.js";
import { output, filterDiffByFile, limitLines } from "../utils/output.js";
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

export function createPrCommand(): Command {
  const pr = new Command("pr").description("Pull request commands");

  pr.command("list <repo>")
    .description("List pull requests")
    .option("-s, --state <state>", "Filter by state (OPEN|MERGED|DECLINED)", "OPEN")
    .option("-l, --limit <n>", "Number of results", "10")
    .option("-p, --page <n>", "Page number")
    .action(async (repo: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.listPullRequests(workspace, repo, {
        state: opts.state,
        pagelen: parseInt(opts.limit),
        page: opts.page ? parseInt(opts.page) : undefined,
      });

      output(result.values, globalOpts.format, globalOpts.output);
    });

  pr.command("get <repo> <id>")
    .description("Get pull request details")
    .option("--fields <fields>", "Comma-separated fields to show")
    .action(async (repo: string, id: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.getPullRequest(workspace, repo, parseInt(id));

      if (opts.fields) {
        const fields = opts.fields.split(",").map((f: string) => f.trim());
        const filtered: Record<string, any> = {};
        for (const f of fields) {
          if (f in result) filtered[f] = (result as any)[f];
        }
        output(filtered, globalOpts.format, globalOpts.output);
      } else {
        output(result, globalOpts.format, globalOpts.output);
      }
    });

  pr.command("diff <repo> <id>")
    .description("Get pull request diff")
    .option("-f, --file <path>", "Filter diff to specific file")
    .option("-l, --lines <n>", "Limit output to N lines")
    .option("--stat-only", "Show only file change statistics")
    .action(async (repo: string, id: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);
      const prId = parseInt(id);

      if (opts.statOnly) {
        const result = await client.getPullRequestDiffStat(workspace, repo, prId, {
          pagelen: 100,
        });
        output(result.values, globalOpts.format, globalOpts.output);
        return;
      }

      let diff = await client.getPullRequestDiff(workspace, repo, prId);

      if (opts.file) {
        diff = filterDiffByFile(diff, opts.file);
      }

      if (opts.lines) {
        diff = limitLines(diff, parseInt(opts.lines));
      }

      if (globalOpts.output) {
        require("fs").writeFileSync(globalOpts.output, diff);
      } else {
        console.log(diff);
      }
    });

  pr.command("comments <repo> <id>")
    .description("Get pull request comments")
    .option("-l, --limit <n>", "Number of results", "20")
    .option("-p, --page <n>", "Page number")
    .option("--inline-only", "Show only inline comments")
    .action(async (repo: string, id: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.getPullRequestComments(workspace, repo, parseInt(id), {
        pagelen: parseInt(opts.limit),
        page: opts.page ? parseInt(opts.page) : undefined,
      });

      let comments = result.values;
      if (opts.inlineOnly) {
        comments = comments.filter((c) => c.inline);
      }

      output(comments, globalOpts.format, globalOpts.output);
    });

  pr.command("comment <repo> <id> <content>")
    .description("Add comment to pull request")
    .option("-f, --file <path>", "File path for inline comment")
    .option("-l, --line <n>", "Line number for inline comment")
    .action(async (repo: string, id: string, content: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const inline =
        opts.file && opts.line
          ? { path: opts.file, to: parseInt(opts.line) }
          : undefined;

      const result = await client.addPullRequestComment(
        workspace,
        repo,
        parseInt(id),
        content,
        inline
      );
      output(result, globalOpts.format, globalOpts.output);
    });

  pr.command("activity <repo> <id>")
    .description("Get pull request activity")
    .option("-l, --limit <n>", "Number of results", "20")
    .option("-p, --page <n>", "Page number")
    .option("-t, --type <type>", "Filter by type (approval|comment|update)")
    .action(async (repo: string, id: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.getPullRequestActivity(workspace, repo, parseInt(id), {
        pagelen: parseInt(opts.limit),
        page: opts.page ? parseInt(opts.page) : undefined,
      });

      let activities = result.values;
      if (opts.type) {
        activities = activities.filter((a) => {
          if (opts.type === "approval") return !!a.approval;
          if (opts.type === "comment") return !!a.comment;
          if (opts.type === "update") return !!a.update;
          return true;
        });
      }

      output(activities, globalOpts.format, globalOpts.output);
    });

  pr.command("commits <repo> <id>")
    .description("Get pull request commits")
    .option("-l, --limit <n>", "Number of results", "20")
    .action(async (repo: string, id: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.getPullRequestCommits(workspace, repo, parseInt(id), {
        pagelen: parseInt(opts.limit),
      });

      output(result.values, globalOpts.format, globalOpts.output);
    });

  pr.command("add-pending <repo> <id> <content>")
    .description("Add a pending (draft) comment to pull request")
    .option("-f, --file <path>", "File path for inline comment")
    .option("-l, --line <n>", "Line number for inline comment (new file)")
    .option("--from <n>", "Line number for inline comment (old file, deletions)")
    .action(async (repo: string, id: string, content: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const inline =
        opts.file
          ? {
              path: opts.file,
              ...(opts.line && { to: parseInt(opts.line) }),
              ...(opts.from && { from: parseInt(opts.from) }),
            }
          : undefined;

      const result = await client.addPullRequestComment(
        workspace,
        repo,
        parseInt(id),
        content,
        inline,
        true // pending
      );
      output(result, globalOpts.format, globalOpts.output);
    });

  pr.command("update-comment <repo> <pr-id> <comment-id> <content>")
    .description("Update an existing comment")
    .action(async (repo: string, prId: string, commentId: string, content: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.updatePullRequestComment(
        workspace,
        repo,
        parseInt(prId),
        parseInt(commentId),
        content
      );
      output(result, globalOpts.format, globalOpts.output);
    });

  pr.command("delete-comment <repo> <pr-id> <comment-id>")
    .description("Delete a comment")
    .action(async (repo: string, prId: string, commentId: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      await client.deletePullRequestComment(workspace, repo, parseInt(prId), parseInt(commentId));
      console.log(`Comment ${commentId} deleted`);
    });

  pr.command("resolve-comment <repo> <pr-id> <comment-id>")
    .description("Resolve a comment thread")
    .action(async (repo: string, prId: string, commentId: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.resolveComment(
        workspace,
        repo,
        parseInt(prId),
        parseInt(commentId),
        true
      );
      output(result, globalOpts.format, globalOpts.output);
    });

  pr.command("reopen-comment <repo> <pr-id> <comment-id>")
    .description("Reopen a resolved comment thread")
    .action(async (repo: string, prId: string, commentId: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      const client = getClient();
      const workspace = resolveWorkspace(globalOpts, client);

      const result = await client.resolveComment(
        workspace,
        repo,
        parseInt(prId),
        parseInt(commentId),
        false
      );
      output(result, globalOpts.format, globalOpts.output);
    });

  return pr;
}
