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

export interface ApproximateCountResponse {
  count: number;
}

// Project-related types
export interface ProjectFull {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  lead?: User;
  url?: string;
  avatarUrls?: Record<string, string>;
  issueTypes?: IssueType[];
  projectCategory?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface ProjectSearchResult {
  self: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: ProjectFull[];
}

export interface ProjectStatus {
  id: string;
  name: string;
  description?: string;
  self: string;
  statuses: IssueStatus[];
}

export interface ProjectComponent {
  id: string;
  name: string;
  description?: string;
  lead?: User;
  assigneeType?: string;
  assignee?: User;
  realAssigneeType?: string;
  realAssignee?: User;
  project: string;
  projectId: number;
}

export interface ProjectVersion {
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  releaseDate?: string;
  startDate?: string;
  overdue?: boolean;
  projectId: number;
}

// Issue Link types
export interface IssueLinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
  self: string;
}

export interface IssueLinkTypesResponse {
  issueLinkTypes: IssueLinkType[];
}

export interface LinkedIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: IssueStatus;
    priority: IssuePriority;
    issuetype: IssueType;
  };
}

export interface IssueLink {
  id: string;
  self: string;
  type: IssueLinkType;
  inwardIssue?: LinkedIssue;
  outwardIssue?: LinkedIssue;
}

export interface CreateIssueLinkRequest {
  type: { name: string };
  inwardIssue: { key: string };
  outwardIssue: { key: string };
}

// Label types
export interface Label {
  label: string;
  total: number;
}

export interface LabelsResponse {
  values: Label[];
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
}

// Field types
export interface JiraField {
  id: string;
  key: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
  schema?: {
    type: string;
    items?: string;
    system?: string;
    custom?: string;
    customId?: number;
  };
}

// Filter types
export interface FilterOwner {
  accountId: string;
  displayName: string;
  active: boolean;
}

export interface Filter {
  id: string;
  self: string;
  name: string;
  description?: string;
  owner: FilterOwner;
  jql: string;
  viewUrl: string;
  searchUrl: string;
  favourite: boolean;
  favouritedCount: number;
  sharePermissions: FilterSharePermission[];
  editPermissions: FilterSharePermission[];
}

export interface FilterSharePermission {
  id: number;
  type: "global" | "project" | "group" | "user" | "projectRole" | "loggedin" | "authenticated";
  project?: Project;
  group?: { name: string };
  user?: User;
}

export interface FilterSearchResult {
  self: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: Filter[];
}

export interface CreateFilterRequest {
  name: string;
  description?: string;
  jql: string;
  favourite?: boolean;
  sharePermissions?: Omit<FilterSharePermission, "id">[];
}

export interface UpdateFilterRequest {
  name?: string;
  description?: string;
  jql?: string;
  favourite?: boolean;
  sharePermissions?: Omit<FilterSharePermission, "id">[];
}

// Worklog types
export interface Worklog {
  id: string;
  self: string;
  author: User;
  updateAuthor: User;
  comment?: ADF;
  created: string;
  updated: string;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  issueId: string;
}

export interface WorklogsResponse {
  startAt: number;
  maxResults: number;
  total: number;
  worklogs: Worklog[];
}

export interface CreateWorklogRequest {
  timeSpentSeconds?: number;
  timeSpent?: string;
  started?: string;
  comment?: ADF | string;
}

export interface UpdateWorklogRequest {
  timeSpentSeconds?: number;
  timeSpent?: string;
  started?: string;
  comment?: ADF | string;
}
