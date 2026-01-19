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
  ProjectFull,
  ProjectSearchResult,
  ProjectStatus,
  ProjectComponent,
  ProjectVersion,
  IssueLinkType,
  IssueLinkTypesResponse,
  CreateIssueLinkRequest,
  LabelsResponse,
  JiraField,
  Filter,
  FilterSearchResult,
  CreateFilterRequest,
  UpdateFilterRequest,
  Worklog,
  WorklogsResponse,
  CreateWorklogRequest,
  UpdateWorklogRequest,
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
  async listProjects(options: {
    startAt?: number;
    maxResults?: number;
    expand?: string[];
    query?: string;
    typeKey?: string;
    orderBy?: string;
  } = {}): Promise<ProjectSearchResult> {
    try {
      const params: Record<string, any> = {
        startAt: options.startAt || 0,
        maxResults: options.maxResults || 50,
      };
      if (options.expand?.length) params.expand = options.expand.join(",");
      if (options.query) params.query = options.query;
      if (options.typeKey) params.typeKey = options.typeKey;
      if (options.orderBy) params.orderBy = options.orderBy;

      const response = await this.client.get<ProjectSearchResult>("/project/search", { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getProject(projectKeyOrId: string, expand?: string[]): Promise<ProjectFull> {
    try {
      const params: Record<string, string> = {};
      if (expand?.length) params.expand = expand.join(",");
      const response = await this.client.get<ProjectFull>(`/project/${projectKeyOrId}`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getProjectStatuses(projectKeyOrId: string): Promise<ProjectStatus[]> {
    try {
      const response = await this.client.get<ProjectStatus[]>(`/project/${projectKeyOrId}/statuses`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getProjectComponents(projectKeyOrId: string): Promise<ProjectComponent[]> {
    try {
      const response = await this.client.get<ProjectComponent[]>(`/project/${projectKeyOrId}/components`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getProjectVersions(projectKeyOrId: string, options: {
    startAt?: number;
    maxResults?: number;
    orderBy?: string;
    status?: string;
    expand?: string[];
  } = {}): Promise<{ values: ProjectVersion[]; startAt: number; maxResults: number; total: number; isLast: boolean }> {
    try {
      const params: Record<string, any> = {
        startAt: options.startAt || 0,
        maxResults: options.maxResults || 50,
      };
      if (options.orderBy) params.orderBy = options.orderBy;
      if (options.status) params.status = options.status;
      if (options.expand?.length) params.expand = options.expand.join(",");

      const response = await this.client.get(`/project/${projectKeyOrId}/version`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Issue Links
  async getIssueLinkTypes(): Promise<IssueLinkType[]> {
    try {
      const response = await this.client.get<IssueLinkTypesResponse>("/issueLinkType");
      return response.data.issueLinkTypes;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async createIssueLink(request: CreateIssueLinkRequest): Promise<void> {
    try {
      await this.client.post("/issueLink", request);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async deleteIssueLink(linkId: string): Promise<void> {
    try {
      await this.client.delete(`/issueLink/${linkId}`);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Labels
  async listLabels(options: {
    startAt?: number;
    maxResults?: number;
  } = {}): Promise<LabelsResponse> {
    try {
      const params: Record<string, any> = {
        startAt: options.startAt || 0,
        maxResults: options.maxResults || 1000,
      };
      const response = await this.client.get<LabelsResponse>("/label", { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Fields
  async listFields(): Promise<JiraField[]> {
    try {
      const response = await this.client.get<JiraField[]>("/field");
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Filters
  async searchFilters(options: {
    filterName?: string;
    accountId?: string;
    owner?: string;
    groupname?: string;
    projectId?: number;
    orderBy?: string;
    startAt?: number;
    maxResults?: number;
    expand?: string[];
    favourites?: boolean;
  } = {}): Promise<FilterSearchResult> {
    try {
      const params: Record<string, any> = {
        startAt: options.startAt || 0,
        maxResults: options.maxResults || 50,
      };
      if (options.filterName) params.filterName = options.filterName;
      if (options.accountId) params.accountId = options.accountId;
      if (options.owner) params.owner = options.owner;
      if (options.groupname) params.groupname = options.groupname;
      if (options.projectId) params.projectId = options.projectId;
      if (options.orderBy) params.orderBy = options.orderBy;
      if (options.expand?.length) params.expand = options.expand.join(",");

      const endpoint = options.favourites ? "/filter/favourite" : "/filter/search";
      const response = await this.client.get<FilterSearchResult>(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getFilter(filterId: string, expand?: string[]): Promise<Filter> {
    try {
      const params: Record<string, string> = {};
      if (expand?.length) params.expand = expand.join(",");
      const response = await this.client.get<Filter>(`/filter/${filterId}`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async createFilter(request: CreateFilterRequest): Promise<Filter> {
    try {
      const response = await this.client.post<Filter>("/filter", request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateFilter(filterId: string, request: UpdateFilterRequest): Promise<Filter> {
    try {
      const response = await this.client.put<Filter>(`/filter/${filterId}`, request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async deleteFilter(filterId: string): Promise<void> {
    try {
      await this.client.delete(`/filter/${filterId}`);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Worklogs
  async getWorklogs(issueKey: string, options: {
    startAt?: number;
    maxResults?: number;
  } = {}): Promise<WorklogsResponse> {
    try {
      const params: Record<string, any> = {
        startAt: options.startAt || 0,
        maxResults: options.maxResults || 1048576, // Jira default max
      };
      const response = await this.client.get<WorklogsResponse>(
        `/issue/${issueKey}/worklog`,
        { params }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getWorklog(issueKey: string, worklogId: string): Promise<Worklog> {
    try {
      const response = await this.client.get<Worklog>(
        `/issue/${issueKey}/worklog/${worklogId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async addWorklog(issueKey: string, request: CreateWorklogRequest): Promise<Worklog> {
    try {
      const body: Record<string, any> = {};
      if (request.timeSpentSeconds) body.timeSpentSeconds = request.timeSpentSeconds;
      if (request.timeSpent) body.timeSpent = request.timeSpent;
      if (request.started) body.started = request.started;
      if (request.comment) {
        body.comment = typeof request.comment === "string"
          ? { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: request.comment }] }] }
          : request.comment;
      }
      const response = await this.client.post<Worklog>(
        `/issue/${issueKey}/worklog`,
        body
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateWorklog(issueKey: string, worklogId: string, request: UpdateWorklogRequest): Promise<Worklog> {
    try {
      const body: Record<string, any> = {};
      if (request.timeSpentSeconds) body.timeSpentSeconds = request.timeSpentSeconds;
      if (request.timeSpent) body.timeSpent = request.timeSpent;
      if (request.started) body.started = request.started;
      if (request.comment) {
        body.comment = typeof request.comment === "string"
          ? { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: request.comment }] }] }
          : request.comment;
      }
      const response = await this.client.put<Worklog>(
        `/issue/${issueKey}/worklog/${worklogId}`,
        body
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async deleteWorklog(issueKey: string, worklogId: string): Promise<void> {
    try {
      await this.client.delete(`/issue/${issueKey}/worklog/${worklogId}`);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}
