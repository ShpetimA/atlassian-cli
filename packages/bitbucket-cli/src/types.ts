// Bitbucket API Types

export interface BitbucketConfig {
  baseUrl: string;
  token?: string;
  username?: string;
  password?: string;
  workspace?: string;
}

export interface BitbucketAccount {
  uuid: string;
  display_name: string;
  account_id: string;
  nickname?: string;
  type: "user" | "team";
}

export interface BitbucketBranch {
  name: string;
  type: "branch";
}

export interface BitbucketLink {
  href: string;
  name?: string;
}

export interface BitbucketRepository {
  uuid: string;
  name: string;
  full_name: string;
  description: string;
  is_private: boolean;
  slug: string;
}

export interface BitbucketBranchReference {
  branch: { name: string };
  commit: { hash: string };
  repository: BitbucketRepository;
}

export interface BitbucketParticipant {
  user: BitbucketAccount;
  role: "PARTICIPANT" | "REVIEWER";
  approved: boolean;
  state?: "approved" | "changes_requested" | null;
  participated_on: string;
}

export interface BitbucketPullRequest {
  id: number;
  title: string;
  description: string;
  state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED";
  author: BitbucketAccount;
  source: BitbucketBranchReference;
  destination: BitbucketBranchReference;
  created_on: string;
  updated_on: string;
  closed_on?: string;
  comment_count: number;
  task_count: number;
  close_source_branch: boolean;
  reviewers: BitbucketAccount[];
  participants: BitbucketParticipant[];
  links: Record<string, BitbucketLink[]>;
  summary?: {
    raw: string;
    markup: string;
    html: string;
  };
}

export interface BitbucketComment {
  id: number;
  content: { raw: string; markup: string; html: string };
  user: BitbucketAccount;
  created_on: string;
  updated_on: string;
  deleted: boolean;
  inline?: {
    path: string;
    from?: number;
    to?: number;
  };
  parent?: { id: number };
}

export interface BitbucketActivity {
  comment?: BitbucketComment;
  approval?: { user: BitbucketAccount; date: string };
  update?: { state: string; date: string; author: BitbucketAccount };
}

export interface BitbucketDiffStat {
  status: string;
  old?: { path: string };
  new?: { path: string };
  lines_added: number;
  lines_removed: number;
}

export interface PaginatedResponse<T> {
  values: T[];
  page?: number;
  pagelen: number;
  next?: string;
  previous?: string;
  size?: number;
}

export type OutputFormat = "json" | "plain" | "minimal";
