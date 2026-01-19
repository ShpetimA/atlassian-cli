// Confluence REST API v2 Types
// Base: https://{domain}.atlassian.net/wiki/api/v2

export interface Space {
  id: string;
  key: string;
  name: string;
  type: "global" | "personal";
  status: "current" | "archived";
  description?: {
    plain?: { value: string };
    view?: { value: string };
  };
  homepageId?: string;
  createdAt?: string;
}

export interface SpaceListResponse {
  results: Space[];
  _links: {
    next?: string;
    base: string;
  };
}

export interface Page {
  id: string;
  title: string;
  spaceId: string;
  status: "current" | "draft" | "trashed" | "archived";
  parentId?: string;
  parentType?: "page" | "whiteboard";
  position?: number;
  authorId?: string;
  ownerId?: string;
  createdAt?: string;
  version?: {
    number: number;
    message?: string;
    createdAt: string;
    authorId?: string;
  };
  body?: {
    storage?: { representation: "storage"; value: string };
    atlas_doc_format?: { representation: "atlas_doc_format"; value: string };
    view?: { representation: "view"; value: string };
  };
  _links?: {
    webui?: string;
    editui?: string;
    tinyui?: string;
  };
}

export interface PageListResponse {
  results: Page[];
  _links: {
    next?: string;
    base: string;
  };
}

export interface CreatePageRequest {
  spaceId: string;
  title: string;
  parentId?: string;
  status?: "current" | "draft";
  body?: {
    representation: "storage" | "atlas_doc_format";
    value: string;
  };
}

export interface UpdatePageRequest {
  id: string;
  title: string;
  status: "current" | "draft";
  body?: {
    representation: "storage" | "atlas_doc_format";
    value: string;
  };
  version: {
    number: number;
    message?: string;
  };
}

export interface FooterComment {
  id: string;
  pageId: string;
  body: {
    storage?: { representation: "storage"; value: string };
    atlas_doc_format?: { representation: "atlas_doc_format"; value: string };
  };
  createdAt: string;
  version?: {
    number: number;
    createdAt: string;
  };
}

export interface FooterCommentListResponse {
  results: FooterComment[];
  _links: {
    next?: string;
    base: string;
  };
}

export interface CreateCommentRequest {
  pageId: string;
  body: {
    representation: "storage" | "atlas_doc_format";
    value: string;
  };
}

export interface Label {
  id: string;
  name: string;
  prefix: string;
}

export interface LabelListResponse {
  results: Label[];
  _links: {
    next?: string;
    base: string;
  };
}
