export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
}

export interface ConfigProfile {
  domain: string;
  email: string;
  apiToken: string;
}

export interface ConfigFile {
  profiles: Record<string, ConfigProfile>;
  defaults: {
    profile: string;
    project?: string;
    space?: string;
    format: OutputFormat;
  };
}

export type OutputFormat = "json" | "plain" | "minimal";

export interface User {
  accountId: string;
  emailAddress?: string;
  displayName: string;
  active: boolean;
  avatarUrls?: Record<string, string>;
}

export interface IssueStatus {
  id: string;
  name: string;
  statusCategory?: {
    id: number;
    key: string;
    name: string;
  };
}

export interface IssuePriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface IssueType {
  id: string;
  name: string;
  description?: string;
  subtask: boolean;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey?: string;
  lead?: User;
}

export interface ADF {
  type: "doc";
  version: 1;
  content: any[];
}

export interface IssueFields {
  summary: string;
  description: ADF | null;
  status: IssueStatus;
  priority: IssuePriority;
  issuetype: IssueType;
  project: Project;
  assignee: User | null;
  reporter: User;
  labels: string[];
  created: string;
  updated: string;
  resolution: { name: string } | null;
  [key: string]: any; // Custom fields
}

export interface Issue {
  id: string;
  key: string;
  self: string;
  fields: IssueFields;
}

export interface IssueSearchResult {
  startAt: number;
  maxResults: number;
  total: number;
  issues: Issue[];
}

export interface Transition {
  id: string;
  name: string;
  to: IssueStatus;
}

export interface TransitionsResponse {
  transitions: Transition[];
}

export interface Comment {
  id: string;
  author: User;
  body: ADF;
  created: string;
  updated: string;
}

export interface CommentsResponse {
  startAt: number;
  maxResults: number;
  total: number;
  comments: Comment[];
}

export interface CreateIssueRequest {
  fields: {
    project: { key: string };
    summary: string;
    description?: ADF;
    issuetype: { name: string };
    priority?: { name: string };
    assignee?: { accountId: string };
    labels?: string[];
    [key: string]: any;
  };
}

export interface UpdateIssueRequest {
  fields: Partial<CreateIssueRequest["fields"]>;
}
