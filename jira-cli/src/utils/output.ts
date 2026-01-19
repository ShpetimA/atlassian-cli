import type { OutputFormat, Issue, Comment } from "../types/jira.js";
import * as fs from "fs";

export function output(data: any, format: OutputFormat, file?: string): void {
  let text: string;

  if (format === "json") {
    text = JSON.stringify(data, null, 2);
  } else if (format === "minimal") {
    text = JSON.stringify(data);
  } else {
    text = formatPlain(data);
  }

  if (file) {
    fs.writeFileSync(file, text);
  } else {
    console.log(text);
  }
}

function formatPlain(data: any): string {
  if (Array.isArray(data)) {
    return data.map(formatItem).join("\n---\n");
  }
  return formatItem(data);
}

function formatItem(item: any): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return String(item);

  // Issue format
  if ("key" in item && "fields" in item) {
    const issue = item as Issue;
    const f = issue.fields;
    return [
      `${issue.key} ${f.summary}`,
      `Status: ${f.status.name} | Priority: ${f.priority?.name || "None"} | Type: ${f.issuetype.name}`,
      `Project: ${f.project.key}`,
      `Assignee: ${f.assignee?.displayName || "Unassigned"}`,
      `Reporter: ${f.reporter?.displayName || "Unknown"}`,
      f.labels?.length ? `Labels: ${f.labels.join(", ")}` : "",
      `Created: ${f.created} | Updated: ${f.updated}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Comment format
  if ("author" in item && "body" in item && "created" in item) {
    const c = item as Comment;
    const bodyText = extractTextFromADF(c.body);
    return `${c.author.displayName} (${c.created}):\n${bodyText}`;
  }

  // Search result format
  if ("issues" in item && "total" in item) {
    const result = item as { issues: Issue[]; total: number; startAt: number; maxResults: number };
    const header = `Showing ${result.issues.length} of ${result.total} issues`;
    const issues = result.issues.map(formatItem).join("\n---\n");
    return `${header}\n\n${issues}`;
  }

  // Default: key-value
  return Object.entries(item)
    .filter(([_, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("\n");
}

function extractTextFromADF(adf: any): string {
  if (!adf || typeof adf !== "object") return "";
  if (adf.type === "text") return adf.text || "";
  if (Array.isArray(adf.content)) {
    return adf.content.map(extractTextFromADF).join("");
  }
  return "";
}
