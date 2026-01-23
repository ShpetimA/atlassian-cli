import axios, { AxiosInstance } from "axios";
import type {
  BitbucketConfig,
  BitbucketPullRequest,
  BitbucketComment,
  BitbucketActivity,
  BitbucketDiffStat,
  BitbucketRepository,
  PaginatedResponse,
} from "./types.js";

const DEFAULT_PAGELEN = 10;
const MAX_PAGELEN = 100;

function normalizeUrl(url: string): { baseUrl: string; workspace?: string } {
  // Convert https://bitbucket.org/workspace to API URL
  const webMatch = url.match(/^https?:\/\/bitbucket\.org\/([^\/]+)\/?$/);
  if (webMatch) {
    return {
      baseUrl: "https://api.bitbucket.org/2.0",
      workspace: webMatch[1],
    };
  }

  // Ensure api.bitbucket.org has /2.0
  if (url.includes("api.bitbucket.org") && !url.includes("/2.0")) {
    return { baseUrl: url.replace(/\/?$/, "/2.0") };
  }

  return { baseUrl: url.replace(/\/$/, "") };
}

export class BitbucketClient {
  private api: AxiosInstance;
  private workspace?: string;

  constructor(config: BitbucketConfig) {
    const { baseUrl, workspace } = normalizeUrl(config.baseUrl);
    this.workspace = config.workspace || workspace;

    const headers: Record<string, string> = {};
    if (config.token) {
      headers.Authorization = `Bearer ${config.token}`;
    }

    this.api = axios.create({
      baseURL: baseUrl,
      headers,
      maxRedirects: 5,
      auth:
        config.username && config.password
          ? { username: config.username, password: config.password }
          : undefined,
    });
  }

  getWorkspace(): string | undefined {
    return this.workspace;
  }

  // Repository methods
  async listRepositories(
    workspace: string,
    options: { pagelen?: number; page?: number; name?: string } = {}
  ): Promise<PaginatedResponse<BitbucketRepository>> {
    const params: Record<string, any> = {
      pagelen: Math.min(options.pagelen || DEFAULT_PAGELEN, MAX_PAGELEN),
    };
    if (options.page) params.page = options.page;
    if (options.name) params.q = `name~"${options.name}"`;

    const response = await this.api.get(`/repositories/${workspace}`, { params });
    return response.data;
  }

  // Pull Request methods
  async listPullRequests(
    workspace: string,
    repoSlug: string,
    options: { state?: string; pagelen?: number; page?: number } = {}
  ): Promise<PaginatedResponse<BitbucketPullRequest>> {
    const params: Record<string, any> = {
      pagelen: Math.min(options.pagelen || DEFAULT_PAGELEN, MAX_PAGELEN),
    };
    if (options.page) params.page = options.page;
    if (options.state) params.state = options.state;

    const response = await this.api.get(
      `/repositories/${workspace}/${repoSlug}/pullrequests`,
      { params }
    );
    return response.data;
  }

  async getPullRequest(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<BitbucketPullRequest> {
    const response = await this.api.get(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`
    );
    return response.data;
  }

  async getPullRequestDiff(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<string> {
    // Get PR to extract commits
    const pr = await this.getPullRequest(workspace, repoSlug, prId);
    const sourceCommit = pr.source.commit.hash;
    const destCommit = pr.destination.commit.hash;

    const diffUrl = `/repositories/${workspace}/${repoSlug}/diff/${workspace}/${repoSlug}:${sourceCommit}%0D${destCommit}?from_pullrequest_id=${prId}&topic=true`;

    const response = await this.api.get(diffUrl, {
      headers: { Accept: "text/plain" },
      responseType: "text",
    });
    return response.data;
  }

  async getPullRequestDiffStat(
    workspace: string,
    repoSlug: string,
    prId: number,
    options: { pagelen?: number; page?: number } = {}
  ): Promise<PaginatedResponse<BitbucketDiffStat>> {
    const params: Record<string, any> = {
      pagelen: Math.min(options.pagelen || DEFAULT_PAGELEN, MAX_PAGELEN),
    };
    if (options.page) params.page = options.page;

    // Handle redirect manually - Bitbucket returns 302 for diffstat
    const response = await this.api.get(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/diffstat`,
      { params, maxRedirects: 0, validateStatus: () => true }
    );

    if (response.status === 302 && response.headers?.location) {
      const redirectUrl = response.headers.location;
      const redirectResponse = await this.api.get(redirectUrl, { params });
      return redirectResponse.data;
    }

    return response.data;
  }

  async getPullRequestComments(
    workspace: string,
    repoSlug: string,
    prId: number,
    options: { pagelen?: number; page?: number } = {}
  ): Promise<PaginatedResponse<BitbucketComment>> {
    const params: Record<string, any> = {
      pagelen: Math.min(options.pagelen || DEFAULT_PAGELEN, MAX_PAGELEN),
    };
    if (options.page) params.page = options.page;

    const response = await this.api.get(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments`,
      { params }
    );
    return response.data;
  }

  async getPullRequestActivity(
    workspace: string,
    repoSlug: string,
    prId: number,
    options: { pagelen?: number; page?: number } = {}
  ): Promise<PaginatedResponse<BitbucketActivity>> {
    const params: Record<string, any> = {
      pagelen: Math.min(options.pagelen || DEFAULT_PAGELEN, MAX_PAGELEN),
    };
    if (options.page) params.page = options.page;

    const response = await this.api.get(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/activity`,
      { params }
    );
    return response.data;
  }

  async getPullRequestCommits(
    workspace: string,
    repoSlug: string,
    prId: number,
    options: { pagelen?: number; page?: number } = {}
  ): Promise<PaginatedResponse<any>> {
    const params: Record<string, any> = {
      pagelen: Math.min(options.pagelen || DEFAULT_PAGELEN, MAX_PAGELEN),
    };
    if (options.page) params.page = options.page;

    const response = await this.api.get(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/commits`,
      { params }
    );
    return response.data;
  }

  async addPullRequestComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    content: string,
    inline?: { path: string; to?: number; from?: number },
    pending?: boolean
  ): Promise<BitbucketComment> {
    const body: Record<string, any> = { content: { raw: content } };
    if (inline) {
      body.inline = { path: inline.path };
      if (inline.to !== undefined) body.inline.to = inline.to;
      if (inline.from !== undefined) body.inline.from = inline.from;
    }
    if (pending !== undefined) {
      body.pending = pending;
    }
    const response = await this.api.post(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments`,
      body
    );
    return response.data;
  }

  async updatePullRequestComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    commentId: number,
    content: string,
    pending?: boolean
  ): Promise<BitbucketComment> {
    const body: Record<string, any> = { content: { raw: content } };
    if (pending !== undefined) {
      body.pending = pending;
    }
    const response = await this.api.put(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments/${commentId}`,
      body
    );
    return response.data;
  }

  async deletePullRequestComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    commentId: number
  ): Promise<void> {
    await this.api.delete(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments/${commentId}`
    );
  }

  async resolveComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    commentId: number,
    resolved: boolean
  ): Promise<BitbucketComment> {
    const response = await this.api.put(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments/${commentId}`,
      { resolved }
    );
    return response.data;
  }
}
