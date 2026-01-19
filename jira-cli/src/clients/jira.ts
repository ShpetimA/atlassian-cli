import axios, { type AxiosInstance, type AxiosError } from "axios";
import type {
  JiraConfig,
  Issue,
  IssueSearchResult,
  Transition,
  TransitionsResponse,
  Comment,
  CommentsResponse,
  CreateIssueRequest,
  UpdateIssueRequest,
  ApproximateCountResponse,
} from "../types/jira.js";

export class JiraClient {
  private client: AxiosInstance;
  private domain: string;

  constructor(config: JiraConfig) {
    this.domain = config.domain;
    const baseURL = `https://${config.domain}.atlassian.net/rest/api/3`;
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const data = error.response.data as any;
      const message = data?.errorMessages?.join(", ") || data?.message || error.message;
      throw new Error(`Jira API error (${error.response.status}): ${message}`);
    }
    throw error;
  }

  // Issue operations
  async getIssue(issueKey: string, expand?: string[]): Promise<Issue> {
    try {
      const params: Record<string, string> = {};
      if (expand?.length) {
        params.expand = expand.join(",");
      }
      const response = await this.client.get<Issue>(`/issue/${issueKey}`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async searchIssues(jql: string, options: {
    startAt?: number;
    maxResults?: number;
    fields?: string[];
    expand?: string[];
  } = {}): Promise<IssueSearchResult> {
    try {
      const response = await this.client.post<IssueSearchResult>("/search/jql", {
        jql,
        startAt: options.startAt || 0,
        maxResults: options.maxResults || 50,
        fields: options.fields || ["summary", "status", "priority", "issuetype", "project", "assignee", "reporter", "labels", "created", "updated"],
        expand: options.expand,
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getApproximateCount(jql: string): Promise<ApproximateCountResponse> {
    try {
      const response = await this.client.post<ApproximateCountResponse>("/search/approximate-count", {
        jql,
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async createIssue(request: CreateIssueRequest): Promise<Issue> {
    try {
      const response = await this.client.post<Issue>("/issue", request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateIssue(issueKey: string, request: UpdateIssueRequest): Promise<void> {
    try {
      await this.client.put(`/issue/${issueKey}`, request);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async deleteIssue(issueKey: string, deleteSubtasks = false): Promise<void> {
    try {
      await this.client.delete(`/issue/${issueKey}`, {
        params: { deleteSubtasks: deleteSubtasks ? "true" : "false" },
      });
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async assignIssue(issueKey: string, accountId: string | null): Promise<void> {
    try {
      await this.client.put(`/issue/${issueKey}/assignee`, {
        accountId,
      });
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Transitions
  async getTransitions(issueKey: string): Promise<Transition[]> {
    try {
      const response = await this.client.get<TransitionsResponse>(
        `/issue/${issueKey}/transitions`
      );
      return response.data.transitions;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transitionId },
      });
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Comments
  async getComments(issueKey: string, options: {
    startAt?: number;
    maxResults?: number;
  } = {}): Promise<CommentsResponse> {
    try {
      const response = await this.client.get<CommentsResponse>(
        `/issue/${issueKey}/comment`,
        {
          params: {
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
          },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async addComment(issueKey: string, body: string | object): Promise<Comment> {
    try {
      const bodyContent = typeof body === "string"
        ? { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: body }] }] }
        : body;
      const response = await this.client.post<Comment>(
        `/issue/${issueKey}/comment`,
        { body: bodyContent }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // User search
  async searchUsers(query: string): Promise<{ accountId: string; displayName: string; emailAddress?: string }[]> {
    try {
      const response = await this.client.get("/user/search", {
        params: { query, maxResults: 10 },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Projects
  async getProjects(options: {
    startAt?: number;
    maxResults?: number;
  } = {}): Promise<{ values: any[]; total: number }> {
    try {
      const response = await this.client.get("/project/search", {
        params: {
          startAt: options.startAt || 0,
          maxResults: options.maxResults || 50,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}
