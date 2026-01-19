import { Command } from "commander";
import { JiraClient } from "../clients/jira.js";
import { resolveJiraConfig, getDefaultProject, getDefaultFormat } from "../config.js";
import { output } from "../utils/output.js";
import { pollTask } from "../utils/polling.js";
import type { OutputFormat, CreateIssueRequest, IssueLink } from "../types/jira.js";

export function createIssueCommand(): Command {
  const issue = new Command("issue").description("Manage Jira issues");

  // List issues via JQL
  issue
    .command("list")
    .description("List issues via JQL query")
    .option("-j, --jql <query>", "JQL query string")
    .option("--project <key>", "Filter by project key")
    .option("-l, --limit <n>", "Max results", "50")
    .option("-p, --page <n>", "Page number (1-based)", "1")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      let jql = options.jql || "";
      const project = options.project || getDefaultProject();
      if (project && !jql.toLowerCase().includes("project")) {
        jql = jql ? `project = ${project} AND (${jql})` : `project = ${project}`;
      }
      if (!jql) {
        jql = "ORDER BY updated DESC";
      }

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const startAt = (page - 1) * limit;

      const result = await client.searchIssues(jql, { startAt, maxResults: limit });
      output(result, format, options.output);
    });

  // Get single issue
  issue
    .command("get <key>")
    .description("Get issue details")
    .option("--expand <fields>", "Comma-separated fields to expand")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;
      const expand = options.expand?.split(",");

      const result = await client.getIssue(key, expand);
      output(result, format, options.output);
    });

  // Create issue
  issue
    .command("create")
    .description("Create a new issue")
    .requiredOption("--summary <text>", "Issue summary")
    .option("--project <key>", "Project key")
    .option("--type <name>", "Issue type", "Task")
    .option("--description <text>", "Issue description")
    .option("--priority <name>", "Priority name")
    .option("--labels <labels>", "Comma-separated labels")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const project = options.project || getDefaultProject();
      if (!project) {
        throw new Error("Project key required. Use --project or set JIRA_PROJECT env var");
      }

      const request: CreateIssueRequest = {
        fields: {
          project: { key: project },
          summary: options.summary,
          issuetype: { name: options.type },
        },
      };

      if (options.description) {
        request.fields.description = {
          type: "doc",
          version: 1,
          content: [{ type: "paragraph", content: [{ type: "text", text: options.description }] }],
        };
      }
      if (options.priority) {
        request.fields.priority = { name: options.priority };
      }
      if (options.labels) {
        request.fields.labels = options.labels.split(",").map((l: string) => l.trim());
      }

      const result = await client.createIssue(request);
      output(result, format, options.output);
    });

  // Edit issue
  issue
    .command("edit <key>")
    .description("Update an existing issue")
    .option("--summary <text>", "New summary")
    .option("--description <text>", "New description")
    .option("--priority <name>", "New priority")
    .option("--labels <labels>", "New labels (comma-separated)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const fields: Record<string, any> = {};
      if (options.summary) fields.summary = options.summary;
      if (options.description) {
        fields.description = {
          type: "doc",
          version: 1,
          content: [{ type: "paragraph", content: [{ type: "text", text: options.description }] }],
        };
      }
      if (options.priority) fields.priority = { name: options.priority };
      if (options.labels) fields.labels = options.labels.split(",").map((l: string) => l.trim());

      if (Object.keys(fields).length === 0) {
        throw new Error("No fields to update. Use --summary, --description, --priority, or --labels");
      }

      await client.updateIssue(key, { fields });
      output({ success: true, key, message: "Issue updated" }, format);
    });

  // Delete issue
  issue
    .command("delete <key>")
    .description("Delete an issue")
    .option("--subtasks", "Also delete subtasks")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      await client.deleteIssue(key, options.subtasks);
      output({ success: true, key, message: "Issue deleted" }, format);
    });

  // Assign issue
  issue
    .command("assign <key> [user]")
    .description("Assign issue to user (omit user to unassign)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, user, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      let accountId: string | null = null;
      if (user) {
        // Search for user by email or name
        const users = await client.searchUsers(user);
        if (users.length === 0) {
          throw new Error(`User not found: ${user}`);
        }
        accountId = users[0].accountId;
      }

      await client.assignIssue(key, accountId);
      output({
        success: true,
        key,
        message: user ? `Assigned to ${user}` : "Unassigned",
      }, format);
    });

  // List transitions
  issue
    .command("transitions <key>")
    .description("List available transitions for an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const transitions = await client.getTransitions(key);
      output(transitions, format, options.output);
    });

  // Transition issue
  issue
    .command("transition <key> <status>")
    .description("Transition issue to a new status")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, status, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      // Find transition by name
      const transitions = await client.getTransitions(key);
      const transition = transitions.find(
        (t) => t.name.toLowerCase() === status.toLowerCase() ||
               t.to.name.toLowerCase() === status.toLowerCase()
      );

      if (!transition) {
        const available = transitions.map((t) => t.name).join(", ");
        throw new Error(`Transition not found: ${status}. Available: ${available}`);
      }

      await client.transitionIssue(key, transition.id);
      output({
        success: true,
        key,
        message: `Transitioned to ${transition.to.name}`,
      }, format);
    });

  // List comments
  issue
    .command("comments <key>")
    .description("List comments on an issue")
    .option("-l, --limit <n>", "Max results", "50")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getComments(key, { maxResults: parseInt(options.limit, 10) });
      output(result, format, options.output);
    });

  // Add comment
  issue
    .command("comment <key> <text>")
    .description("Add a comment to an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, text, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.addComment(key, text);
      output(result, format, options.output);
    });

  // List link types
  issue
    .command("link-types")
    .description("List available issue link types")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const linkTypes = await client.getIssueLinkTypes();
      output(linkTypes, format, options.output);
    });

  // Get issue links (from issue fields)
  issue
    .command("links <key>")
    .description("List links for an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const issueData = await client.getIssue(key, ["names"]);
      const links: IssueLink[] = issueData.fields.issuelinks || [];
      output(links, format, options.output);
    });

  // Create issue link
  issue
    .command("link <key1> <key2> <type>")
    .description("Create a link between two issues (key1 is outward, key2 is inward)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key1, key2, typeName, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      // Validate link type exists
      const linkTypes = await client.getIssueLinkTypes();
      const linkType = linkTypes.find(
        (t) => t.name.toLowerCase() === typeName.toLowerCase()
      );
      if (!linkType) {
        const available = linkTypes.map((t) => t.name).join(", ");
        throw new Error(`Link type not found: ${typeName}. Available: ${available}`);
      }

      await client.createIssueLink({
        type: { name: linkType.name },
        outwardIssue: { key: key1 },
        inwardIssue: { key: key2 },
      });

      output({
        success: true,
        message: `Linked ${key1} ${linkType.outward} ${key2}`,
        outwardIssue: key1,
        inwardIssue: key2,
        linkType: linkType.name,
      }, format);
    });

  // Delete issue link
  issue
    .command("unlink <linkId>")
    .description("Delete an issue link by ID")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (linkId, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      await client.deleteIssueLink(linkId);
      output({ success: true, message: `Link ${linkId} deleted` }, format);
    });

  // Add label to issue
  issue
    .command("add-label <key> <label>")
    .description("Add a label to an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, label, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      // Get current labels
      const issueData = await client.getIssue(key);
      const currentLabels: string[] = issueData.fields.labels || [];

      if (currentLabels.includes(label)) {
        output({ success: true, key, message: `Label "${label}" already exists` }, format);
        return;
      }

      // Add label via update
      await client.updateIssue(key, {
        fields: { labels: [...currentLabels, label] },
      });

      output({ success: true, key, message: `Added label "${label}"` }, format);
    });

  // Remove label from issue
  issue
    .command("remove-label <key> <label>")
    .description("Remove a label from an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, label, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      // Get current labels
      const issueData = await client.getIssue(key);
      const currentLabels: string[] = issueData.fields.labels || [];

      if (!currentLabels.includes(label)) {
        output({ success: true, key, message: `Label "${label}" not found on issue` }, format);
        return;
      }

      // Remove label via update
      await client.updateIssue(key, {
        fields: { labels: currentLabels.filter((l) => l !== label) },
      });

      output({ success: true, key, message: `Removed label "${label}"` }, format);
    });

  // List worklogs
  issue
    .command("worklogs <key>")
    .description("List worklogs on an issue")
    .option("-l, --limit <n>", "Max results", "50")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.getWorklogs(key, { maxResults: parseInt(options.limit, 10) });
      output(result, format, options.output);
    });

  // Add worklog
  issue
    .command("worklog <key>")
    .description("Add a worklog to an issue")
    .requiredOption("-t, --time <duration>", "Time spent (e.g., 1h, 30m, 1h 30m, 1d)")
    .option("-c, --comment <text>", "Worklog comment")
    .option("-s, --started <datetime>", "Start time (ISO format, defaults to now)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const request: { timeSpent: string; comment?: string; started?: string } = {
        timeSpent: options.time,
      };
      if (options.comment) request.comment = options.comment;
      if (options.started) request.started = options.started;

      const result = await client.addWorklog(key, request);
      output(result, format, options.output);
    });

  // Update worklog
  issue
    .command("worklog-edit <key> <worklogId>")
    .description("Update a worklog on an issue")
    .option("-t, --time <duration>", "New time spent (e.g., 1h, 30m)")
    .option("-c, --comment <text>", "New worklog comment")
    .option("-s, --started <datetime>", "New start time (ISO format)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, worklogId, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const request: { timeSpent?: string; comment?: string; started?: string } = {};
      if (options.time) request.timeSpent = options.time;
      if (options.comment) request.comment = options.comment;
      if (options.started) request.started = options.started;

      if (Object.keys(request).length === 0) {
        throw new Error("No fields to update. Use --time, --comment, or --started");
      }

      const result = await client.updateWorklog(key, worklogId, request);
      output(result, format, options.output);
    });

  // Delete worklog
  issue
    .command("worklog-delete <key> <worklogId>")
    .description("Delete a worklog from an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, worklogId, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      await client.deleteWorklog(key, worklogId);
      output({ success: true, key, worklogId, message: "Worklog deleted" }, format);
    });

  // List attachments
  issue
    .command("attachments <key>")
    .description("List attachments on an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const attachments = await client.getAttachments(key);
      output(attachments, format, options.output);
    });

  // Add attachment
  issue
    .command("attach <key> <file>")
    .description("Attach a file to an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, file, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const result = await client.addAttachment(key, file);
      output(result, format, options.output);
    });

  // Delete attachment
  issue
    .command("attachment-delete <attachmentId>")
    .description("Delete an attachment by ID")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (attachmentId, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      await client.deleteAttachment(attachmentId);
      output({ success: true, attachmentId, message: "Attachment deleted" }, format);
    });

  // List watchers
  issue
    .command("watchers <key>")
    .description("List watchers on an issue")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      const watchers = await client.getWatchers(key);
      output(watchers, format, options.output);
    });

  // Watch issue (add current user as watcher)
  issue
    .command("watch <key>")
    .description("Watch an issue (add yourself as watcher)")
    .option("--user <accountId>", "User account ID to add (defaults to self)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      let accountId = options.user;
      if (!accountId) {
        const me = await client.getCurrentUser();
        accountId = me.accountId;
      }

      await client.addWatcher(key, accountId);
      output({ success: true, key, message: "Now watching issue" }, format);
    });

  // Unwatch issue (remove current user as watcher)
  issue
    .command("unwatch <key>")
    .description("Unwatch an issue (remove yourself as watcher)")
    .option("--user <accountId>", "User account ID to remove (defaults to self)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .action(async (key, options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      let accountId = options.user;
      if (!accountId) {
        const me = await client.getCurrentUser();
        accountId = me.accountId;
      }

      await client.removeWatcher(key, accountId);
      output({ success: true, key, message: "Stopped watching issue" }, format);
    });

  // Archive issues (async operation)
  issue
    .command("archive")
    .description("Archive issues (async operation)")
    .option("-j, --jql <query>", "JQL query to select issues to archive")
    .option("--issues <keys>", "Comma-separated issue keys to archive")
    .option("--wait", "Wait for operation to complete (poll task)")
    .option("--format <format>", "Output format: json|plain|minimal")
    .option("-o, --output <file>", "Output to file")
    .action(async (options) => {
      const config = resolveJiraConfig({});
      const client = new JiraClient(config);
      const format = (options.format || getDefaultFormat()) as OutputFormat;

      if (!options.jql && !options.issues) {
        throw new Error("Either --jql or --issues is required");
      }

      let taskId: string;

      if (options.jql) {
        // Archive by JQL
        taskId = await client.archiveIssuesByJql(options.jql);
      } else {
        // Archive by issue keys
        const issueKeys = options.issues.split(",").map((k: string) => k.trim());
        const response = await client.archiveIssues(issueKeys);
        taskId = response.taskId;
      }

      if (options.wait) {
        // Poll until complete
        const result = await pollTask(client, taskId, {
          onProgress: (task) => {
            if (format === "json") return;
            const pct = task.progress.percent;
            process.stderr.write(`\rProgress: ${pct}% (${task.progress.succeeded}/${task.progress.total})`);
          },
        });
        if (format !== "json") process.stderr.write("\n");
        output(result, format, options.output);
      } else {
        // Return task ID immediately
        output({ taskId, status: "ENQUEUED", message: "Use 'jc task get' to check status" }, format, options.output);
      }
    });

  return issue;
}
