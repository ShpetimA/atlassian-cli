import type { Issue } from "./jira.js";

export interface Board {
  id: number;
  self: string;
  name: string;
  type: "scrum" | "kanban" | "simple";
  location?: {
    projectId: number;
    projectKey: string;
    projectName: string;
  };
}

export interface BoardsResponse {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: Board[];
}

export interface BoardConfiguration {
  id: number;
  name: string;
  type: string;
  self: string;
  filter?: {
    id: string;
    self: string;
  };
  columnConfig?: {
    columns: {
      name: string;
      statuses: { id: string; self: string }[];
    }[];
  };
  estimation?: {
    type: string;
    field?: {
      fieldId: string;
      displayName: string;
    };
  };
}

export interface Sprint {
  id: number;
  self: string;
  state: "future" | "active" | "closed";
  name: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
  originBoardId: number;
}

export interface SprintsResponse {
  maxResults: number;
  startAt: number;
  isLast: boolean;
  values: Sprint[];
}

export interface BoardIssuesResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: Issue[];
}

export interface CreateSprintRequest {
  name: string;
  originBoardId: number;
  startDate?: string;
  endDate?: string;
  goal?: string;
}

export interface UpdateSprintRequest {
  name?: string;
  state?: "active" | "closed";
  startDate?: string;
  endDate?: string;
  goal?: string;
  completeDate?: string;
}

export interface MoveIssuesToSprintRequest {
  issues: string[];
  rankBeforeIssue?: string;
  rankAfterIssue?: string;
}

// Epics
export interface Epic {
  id: number;
  key: string;
  self: string;
  name: string;
  summary: string;
  color?: {
    key: string;
  };
  done: boolean;
}

export interface EpicsResponse {
  maxResults: number;
  startAt: number;
  isLast: boolean;
  values: Epic[];
}

export interface MoveIssuesToEpicRequest {
  issues: string[];
}

// Backlog ranking
export interface RankIssuesRequest {
  issues: string[];
  rankBeforeIssue?: string;
  rankAfterIssue?: string;
}
