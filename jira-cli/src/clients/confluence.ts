import axios, { type AxiosInstance, type AxiosError } from "axios";
import type { JiraConfig } from "../types/jira.js";
import type {
  Space,
  SpaceListResponse,
  Page,
  PageListResponse,
  CreatePageRequest,
  UpdatePageRequest,
  FooterComment,
  FooterCommentListResponse,
  CreateCommentRequest,
  Label,
  LabelListResponse,
} from "../types/confluence.js";

export class ConfluenceClient {
  private client: AxiosInstance;

  constructor(config: JiraConfig) {
    // Confluence API v2: https://{domain}.atlassian.net/wiki/api/v2
    const baseURL = `https://${config.domain}.atlassian.net/wiki/api/v2`;
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
      const message = data?.errors?.[0]?.message || data?.message || error.message;
      throw new Error(`Confluence API error (${error.response.status}): ${message}`);
    }
    throw error;
  }

  // Space operations
  async listSpaces(options: {
    limit?: number;
    cursor?: string;
    type?: "global" | "personal";
    status?: "current" | "archived";
  } = {}): Promise<SpaceListResponse> {
    try {
      const params: Record<string, string | number> = {};
      if (options.limit) params.limit = options.limit;
      if (options.cursor) params.cursor = options.cursor;
      if (options.type) params.type = options.type;
      if (options.status) params.status = options.status;

      const response = await this.client.get<SpaceListResponse>("/spaces", { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getSpace(spaceId: string): Promise<Space> {
    try {
      const response = await this.client.get<Space>(`/spaces/${spaceId}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getSpaceByKey(key: string): Promise<Space> {
    // API v2 doesn't have direct key lookup, need to search
    const result = await this.listSpaces({ limit: 100 });
    const space = result.results.find((s) => s.key === key);
    if (!space) {
      throw new Error(`Space with key '${key}' not found`);
    }
    return space;
  }

  // Page operations
  async listPages(options: {
    spaceId?: string;
    limit?: number;
    cursor?: string;
    status?: "current" | "draft" | "trashed" | "archived";
    sort?: string;
    bodyFormat?: "storage" | "atlas_doc_format" | "view";
  } = {}): Promise<PageListResponse> {
    try {
      const params: Record<string, string | number> = {};
      if (options.spaceId) params["space-id"] = options.spaceId;
      if (options.limit) params.limit = options.limit;
      if (options.cursor) params.cursor = options.cursor;
      if (options.status) params.status = options.status;
      if (options.sort) params.sort = options.sort;
      if (options.bodyFormat) params["body-format"] = options.bodyFormat;

      const response = await this.client.get<PageListResponse>("/pages", { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getPage(pageId: string, bodyFormat?: "storage" | "atlas_doc_format" | "view"): Promise<Page> {
    try {
      const params: Record<string, string> = {};
      if (bodyFormat) params["body-format"] = bodyFormat;

      const response = await this.client.get<Page>(`/pages/${pageId}`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async createPage(request: CreatePageRequest): Promise<Page> {
    try {
      const response = await this.client.post<Page>("/pages", request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async updatePage(pageId: string, request: UpdatePageRequest): Promise<Page> {
    try {
      const response = await this.client.put<Page>(`/pages/${pageId}`, request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async deletePage(pageId: string): Promise<void> {
    try {
      await this.client.delete(`/pages/${pageId}`);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async getPageChildren(pageId: string, options: {
    limit?: number;
    cursor?: string;
  } = {}): Promise<PageListResponse> {
    try {
      const params: Record<string, string | number> = {};
      if (options.limit) params.limit = options.limit;
      if (options.cursor) params.cursor = options.cursor;

      const response = await this.client.get<PageListResponse>(`/pages/${pageId}/children`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Footer comments
  async getPageComments(pageId: string, options: {
    limit?: number;
    cursor?: string;
    bodyFormat?: "storage" | "atlas_doc_format";
  } = {}): Promise<FooterCommentListResponse> {
    try {
      const params: Record<string, string | number> = {};
      if (options.limit) params.limit = options.limit;
      if (options.cursor) params.cursor = options.cursor;
      if (options.bodyFormat) params["body-format"] = options.bodyFormat;

      const response = await this.client.get<FooterCommentListResponse>(
        `/pages/${pageId}/footer-comments`,
        { params }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async createFooterComment(request: CreateCommentRequest): Promise<FooterComment> {
    try {
      const response = await this.client.post<FooterComment>("/footer-comments", request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  // Labels
  async getPageLabels(pageId: string, options: {
    limit?: number;
    cursor?: string;
  } = {}): Promise<LabelListResponse> {
    try {
      const params: Record<string, string | number> = {};
      if (options.limit) params.limit = options.limit;
      if (options.cursor) params.cursor = options.cursor;

      const response = await this.client.get<LabelListResponse>(`/pages/${pageId}/labels`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async addPageLabel(pageId: string, label: string): Promise<Label> {
    try {
      const response = await this.client.post<Label>(`/pages/${pageId}/labels`, {
        name: label,
        prefix: "global",
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async removePageLabel(pageId: string, labelId: string): Promise<void> {
    try {
      await this.client.delete(`/pages/${pageId}/labels/${labelId}`);
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}
