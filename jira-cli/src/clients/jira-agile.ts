import axios, { type AxiosInstance, type AxiosError } from "axios";
import type { JiraConfig } from "../types/jira.js";
import type {
  Board,
  BoardsResponse,
  BoardConfiguration,
  Sprint,
  SprintsResponse,
  BoardIssuesResponse,
  CreateSprintRequest,
  UpdateSprintRequest,
  MoveIssuesToSprintRequest,
  Epic,
  EpicsResponse,
  MoveIssuesToEpicRequest,
  RankIssuesRequest,
} from "../types/agile.js";
import { addRetryInterceptor } from "../utils/retry.js";

export class JiraAgileClient {
  private client: AxiosInstance;

  constructor(config: JiraConfig) {
    const baseURL = `https://${config.domain}.atlassian.net/rest/agile/1.0`;
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Add retry with exponential backoff for rate limits and transient errors
    addRetryInterceptor(this.client);
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const data = error.response.data as any;
      const message = data?.errorMessages?.join(", ") || data?.message || error.message;
      throw new Error(`Jira Agile API error (${error.response.status}): ${message}`);
    }
    throw error;
  }

  // Boards
  async listBoards(options: {
    startAt?: number;
    maxResults?: number;
    type?: "scrum" | "kanban" | "simple";
    name?: string;
    projectKeyOrId?: string;
  } = {}): Promise<BoardsResponse> {
    try {
      const response = await this.client.get<BoardsResponse>("/board", {
        params: {
          startAt: options.startAt || 0,
          maxResults: options.maxResults || 50,
          type: options.type,
          name: options.name,
          projectKeyOrId: options.projectKeyOrId,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getBoard(boardId: number): Promise<Board> {
    try {
      const response = await this.client.get<Board>(`/board/${boardId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getBoardConfiguration(boardId: number): Promise<BoardConfiguration> {
    try {
      const response = await this.client.get<BoardConfiguration>(`/board/${boardId}/configuration`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getBoardIssues(boardId: number, options: {
    startAt?: number;
    maxResults?: number;
    jql?: string;
    fields?: string[];
  } = {}): Promise<BoardIssuesResponse> {
    try {
      const response = await this.client.get<BoardIssuesResponse>(`/board/${boardId}/issue`, {
        params: {
          startAt: options.startAt || 0,
          maxResults: options.maxResults || 50,
          jql: options.jql,
          fields: options.fields?.join(","),
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getBoardBacklog(boardId: number, options: {
    startAt?: number;
    maxResults?: number;
    jql?: string;
    fields?: string[];
  } = {}): Promise<BoardIssuesResponse> {
    try {
      const response = await this.client.get<BoardIssuesResponse>(`/board/${boardId}/backlog`, {
        params: {
          startAt: options.startAt || 0,
          maxResults: options.maxResults || 50,
          jql: options.jql,
          fields: options.fields?.join(","),
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Sprints
  async listSprints(boardId: number, options: {
    startAt?: number;
    maxResults?: number;
    state?: "future" | "active" | "closed";
  } = {}): Promise<SprintsResponse> {
    try {
      const response = await this.client.get<SprintsResponse>(`/board/${boardId}/sprint`, {
        params: {
          startAt: options.startAt || 0,
          maxResults: options.maxResults || 50,
          state: options.state,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getSprint(sprintId: number): Promise<Sprint> {
    try {
      const response = await this.client.get<Sprint>(`/sprint/${sprintId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getSprintIssues(sprintId: number, options: {
    startAt?: number;
    maxResults?: number;
    jql?: string;
    fields?: string[];
  } = {}): Promise<BoardIssuesResponse> {
    try {
      const response = await this.client.get<BoardIssuesResponse>(`/sprint/${sprintId}/issue`, {
        params: {
          startAt: options.startAt || 0,
          maxResults: options.maxResults || 50,
          jql: options.jql,
          fields: options.fields?.join(","),
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async createSprint(request: CreateSprintRequest): Promise<Sprint> {
    try {
      const response = await this.client.post<Sprint>("/sprint", request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updateSprint(sprintId: number, request: UpdateSprintRequest): Promise<Sprint> {
    try {
      const response = await this.client.put<Sprint>(`/sprint/${sprintId}`, request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async startSprint(sprintId: number, startDate: string, endDate: string): Promise<Sprint> {
    return this.updateSprint(sprintId, {
      state: "active",
      startDate,
      endDate,
    });
  }

  async closeSprint(sprintId: number, completeDate?: string): Promise<Sprint> {
    return this.updateSprint(sprintId, {
      state: "closed",
      completeDate: completeDate || new Date().toISOString(),
    });
  }

  async moveIssuesToSprint(sprintId: number, issues: string[], options: {
    rankBeforeIssue?: string;
    rankAfterIssue?: string;
  } = {}): Promise<void> {
    try {
      const request: MoveIssuesToSprintRequest = {
        issues,
        rankBeforeIssue: options.rankBeforeIssue,
        rankAfterIssue: options.rankAfterIssue,
      };
      await this.client.post(`/sprint/${sprintId}/issue`, request);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async moveIssuesToBacklog(issues: string[]): Promise<void> {
    try {
      await this.client.post("/backlog/issue", { issues });
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Epics
  async listEpics(boardId: number, options: {
    startAt?: number;
    maxResults?: number;
    done?: boolean;
  } = {}): Promise<EpicsResponse> {
    try {
      const response = await this.client.get<EpicsResponse>(`/board/${boardId}/epic`, {
        params: {
          startAt: options.startAt || 0,
          maxResults: options.maxResults || 50,
          done: options.done,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getEpic(epicIdOrKey: string | number): Promise<Epic> {
    try {
      const response = await this.client.get<Epic>(`/epic/${epicIdOrKey}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getEpicIssues(epicIdOrKey: string | number, options: {
    startAt?: number;
    maxResults?: number;
    jql?: string;
    fields?: string[];
  } = {}): Promise<BoardIssuesResponse> {
    try {
      const response = await this.client.get<BoardIssuesResponse>(`/epic/${epicIdOrKey}/issue`, {
        params: {
          startAt: options.startAt || 0,
          maxResults: options.maxResults || 50,
          jql: options.jql,
          fields: options.fields?.join(","),
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async moveIssuesToEpic(epicIdOrKey: string | number, issues: string[]): Promise<void> {
    try {
      const request: MoveIssuesToEpicRequest = { issues };
      await this.client.post(`/epic/${epicIdOrKey}/issue`, request);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async removeIssuesFromEpic(issues: string[]): Promise<void> {
    try {
      await this.client.post("/epic/none/issue", { issues });
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Backlog ranking
  async rankIssues(issues: string[], options: {
    rankBeforeIssue?: string;
    rankAfterIssue?: string;
  } = {}): Promise<void> {
    try {
      const request: RankIssuesRequest = {
        issues,
        rankBeforeIssue: options.rankBeforeIssue,
        rankAfterIssue: options.rankAfterIssue,
      };
      await this.client.put("/issue/rank", request);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}
