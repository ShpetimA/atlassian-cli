import type { OutputFormat, BitbucketPullRequest, BitbucketComment, BitbucketDiffStat, BitbucketActivity } from "../types.js";
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

  // PR format
  if ("title" in item && "state" in item && "author" in item) {
    const pr = item as BitbucketPullRequest;
    return [
      `#${pr.id} ${pr.title}`,
      `State: ${pr.state}`,
      `Author: ${pr.author.display_name}`,
      `Branch: ${pr.source.branch.name} → ${pr.destination.branch.name}`,
      `Comments: ${pr.comment_count} | Tasks: ${pr.task_count}`,
      pr.description ? `\n${pr.description}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Comment format
  if ("content" in item && "user" in item && !("approval" in item)) {
    const c = item as BitbucketComment;
    const location = c.inline ? ` [${c.inline.path}:${c.inline.to || c.inline.from}]` : "";
    return `${c.user.display_name}${location}: ${c.content.raw}`;
  }

  // DiffStat format
  if ("lines_added" in item && "lines_removed" in item) {
    const d = item as BitbucketDiffStat;
    const path = d.new?.path || d.old?.path || "unknown";
    return `${d.status.padEnd(8)} +${d.lines_added}/-${d.lines_removed} ${path}`;
  }

  // Activity format
  if ("comment" in item || "approval" in item || "update" in item) {
    const a = item as BitbucketActivity;
    if (a.approval) return `APPROVED by ${a.approval.user.display_name}`;
    if (a.update) return `${a.update.state} by ${a.update.author.display_name}`;
    if (a.comment) return `COMMENT by ${a.comment.user.display_name}: ${a.comment.content.raw.slice(0, 100)}`;
    return JSON.stringify(item);
  }

  // Default: key-value
  return Object.entries(item)
    .filter(([_, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("\n");
}

export function filterDiffByFile(diff: string, filePath: string): string {
  const lines = diff.split("\n");
  const result: string[] = [];
  let inTargetFile = false;

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      inTargetFile = line.includes(filePath);
    }
    if (inTargetFile) {
      result.push(line);
    }
  }

  return result.join("\n");
}

export function limitLines(text: string, maxLines: number): string {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join("\n") + `\n... (${lines.length - maxLines} more lines)`;
}
