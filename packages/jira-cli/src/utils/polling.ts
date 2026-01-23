import type { JiraClient } from "../clients/jira.js";
import type { TaskResult, TaskStatus } from "../types/jira.js";

export interface PollOptions {
  intervalMs?: number;
  maxWaitMs?: number;
  onProgress?: (task: TaskResult) => void;
}

const DEFAULT_POLL_OPTIONS: Required<Omit<PollOptions, "onProgress">> = {
  intervalMs: 2000,
  maxWaitMs: 300000, // 5 minutes
};

const TERMINAL_STATUSES: TaskStatus[] = ["COMPLETE", "FAILED", "CANCELLED", "DEAD"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll a Jira async task until completion or timeout.
 * Returns the final task result.
 */
export async function pollTask(
  client: JiraClient,
  taskId: string,
  options: PollOptions = {}
): Promise<TaskResult> {
  const { intervalMs, maxWaitMs } = { ...DEFAULT_POLL_OPTIONS, ...options };
  const startTime = Date.now();

  while (true) {
    const task = await client.getTask(taskId);

    // Call progress callback if provided
    if (options.onProgress) {
      options.onProgress(task);
    }

    // Check if task is complete
    if (TERMINAL_STATUSES.includes(task.status)) {
      return task;
    }

    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed >= maxWaitMs) {
      throw new Error(`Task ${taskId} timed out after ${maxWaitMs}ms. Status: ${task.status}`);
    }

    // Wait before next poll
    await sleep(intervalMs);
  }
}
