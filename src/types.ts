/**
 * WordPress API Types
 * Type definitions for WordPress entities
 */

/**
 * Base WordPress entity
 */
export interface BaseEntity {
  id: number;
  link?: string;
}

/**
 * WordPress Post
 */
export interface Post extends BaseEntity {
  date: string;
  date_gmt: string;
  guid: { rendered: string };
  modified: string;
  modified_gmt: string;
  password: string;
  slug: string;
  status: 'publish' | 'draft' | 'pending' | 'private' | 'future';
  type: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  author: number;
  featured_media: number;
  comment_status: 'open' | 'closed';
  ping_status: 'open' | 'closed';
  sticky: boolean;
  template: string;
  format: string;
  categories?: number[];
  tags?: number[];
}

/**
 * WordPress Page
 */
export interface Page extends BaseEntity {
  date: string;
  date_gmt: string;
  guid: { rendered: string };
  modified: string;
  modified_gmt: string;
  password: string;
  slug: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  type: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  author: number;
  featured_media: number;
  comment_status: 'open' | 'closed';
  ping_status: 'open' | 'closed';
  menu_order: number;
  parent: number;
  template: string;
}

/**
 * WordPress Category
 */
export interface Category extends BaseEntity {
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: unknown[];
}

/**
 * WordPress Tag
 */
export interface Tag extends BaseEntity {
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  meta: unknown[];
}

/**
 * WordPress Comment
 */
export interface Comment extends BaseEntity {
  post: number;
  parent: number;
  author: number;
  author_name: string;
  author_url: string;
  date: string;
  date_gmt: string;
  content: { rendered: string };
  link: string;
  status: 'approved' | 'hold' | 'spam' | 'trash';
  type: string;
  author_avatar_urls: Record<string, string>;
  meta: unknown[];
  karma: number;
}

/**
 * Search Result
 */
export interface SearchResult {
  id: number;
  title: string;
  url: string;
  type: string;
  subtype: string;
}

/**
 * Bulk operation result
 */
export interface BulkResult<T = unknown> {
  successful: Array<{ id: number; item: T } | { post_id: number; post: T } | { page_id: number; page: T } | { comment_id: number; comment: T }>;
  failed: Array<{ id: number; error: unknown } | { post_id: number; error: unknown } | { page_id: number; error: unknown } | { comment_id: number; error: unknown }>;
}

/**
 * Publish all result
 */
export interface PublishAllResult {
  total_found: number;
  successful: Array<{ post_id: number; post: Post } | { page_id: number; page: Page }>;
  failed: Array<{ post_id: number; error: unknown } | { page_id: number; error: unknown }>;
}
