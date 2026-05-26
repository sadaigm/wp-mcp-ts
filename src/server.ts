/**
 * WordPress MCP Server
 * Provides tools for interacting with WordPress REST API
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod';
import type { CallToolResult, GetPromptResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { WordPressClient, createClientFromEnv, isError } from './wordpress.js';
import type { Post, Page, Category, Tag, Comment, SearchResult, PublishAllResult } from './types.js';

// Create WordPress client
let wpClient: WordPressClient | null = null;

function getClient(): WordPressClient {
  if (!wpClient) {
    wpClient = createClientFromEnv();
  }
  return wpClient;
}

/**
 * Create the WordPress MCP Server
 */
export function createWordPressServer(): McpServer {
  const server = new McpServer({
    name: 'wordpress-mcp-server',
    version: '1.0.0',
  });

  // ==================== POSTS ====================

  server.registerTool(
    'list_posts',
    {
      description: 'List WordPress posts with optional filtering',
      inputSchema: z.object({
        per_page: z.number().min(1).max(100).default(10).describe('Number of posts per page (max 100)'),
        page: z.number().min(1).default(1).describe('Current page number'),
        search: z.string().default('').describe('Search term to filter posts'),
        status: z.enum(['publish', 'draft', 'pending', 'private', 'future']).default('publish').describe('Post status'),
        categories: z.string().optional().describe('Comma-separated category IDs'),
        tags: z.string().optional().describe('Comma-separated tag IDs'),
        author: z.number().optional().describe('Author ID'),
        order: z.enum(['asc', 'desc']).default('desc').describe('Order direction'),
        orderby: z.enum(['date', 'title', 'modified', 'author', 'id']).default('date').describe('Order by field'),
      }),
    },
    async ({ per_page, page, search, status, categories, tags, author, order, orderby }): Promise<CallToolResult> => {
      const client = getClient();
      const params: Record<string, string | number> = { per_page, page, order, orderby };
      if (search) params.search = search;
      if (status) params.status = status;
      if (categories) params.categories = categories;
      if (tags) params.tags = tags;
      if (author) params.author = author;

      const requireAuth = ['draft', 'pending', 'private', 'future'].includes(status);
      const result = await client.get<Post[]>('posts', params, requireAuth);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_post',
    {
      description: 'Retrieve a single WordPress post by ID',
      inputSchema: z.object({
        post_id: z.number().describe('The post ID'),
      }),
    },
    async ({ post_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<Post>(`posts/${post_id}`);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'create_post',
    {
      description: 'Create a new WordPress post',
      inputSchema: z.object({
        title: z.string().describe('Post title'),
        content: z.string().describe('Post content (HTML allowed)'),
        status: z.enum(['publish', 'draft', 'pending', 'private', 'future']).default('draft').describe('Post status'),
        excerpt: z.string().default('').describe('Post excerpt'),
        author: z.number().optional().describe('Author ID'),
        categories: z.array(z.number()).optional().describe('List of category IDs'),
        tags: z.array(z.number()).optional().describe('List of tag IDs'),
        featured_media: z.number().optional().describe('Featured media ID'),
        comment_status: z.enum(['open', 'closed']).default('open').describe('Comment status'),
        ping_status: z.enum(['open', 'closed']).default('open').describe('Ping status'),
      }),
    },
    async ({ title, content, status, excerpt, author, categories, tags, featured_media, comment_status, ping_status }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = { title, content, status, excerpt, comment_status, ping_status };
      if (author !== undefined) data.author = author;
      if (categories) data.categories = categories;
      if (tags) data.tags = tags;
      if (featured_media !== undefined) data.featured_media = featured_media;

      const result = await client.post<Post>('posts', data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'update_post',
    {
      description: 'Update an existing WordPress post',
      inputSchema: z.object({
        post_id: z.number().describe('The post ID'),
        title: z.string().optional().describe('Post title'),
        content: z.string().optional().describe('Post content'),
        status: z.enum(['publish', 'draft', 'pending', 'private', 'future']).optional().describe('Post status'),
        excerpt: z.string().optional().describe('Post excerpt'),
        categories: z.array(z.number()).optional().describe('List of category IDs'),
        tags: z.array(z.number()).optional().describe('List of tag IDs'),
        featured_media: z.number().optional().describe('Featured media ID'),
      }),
    },
    async ({ post_id, title, content, status, excerpt, categories, tags, featured_media }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = {};
      if (title !== undefined) data.title = title;
      if (content !== undefined) data.content = content;
      if (status !== undefined) data.status = status;
      if (excerpt !== undefined) data.excerpt = excerpt;
      if (categories !== undefined) data.categories = categories;
      if (tags !== undefined) data.tags = tags;
      if (featured_media !== undefined) data.featured_media = featured_media;

      const result = await client.post<Post>(`posts/${post_id}`, data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'delete_post',
    {
      description: 'Delete a WordPress post',
      inputSchema: z.object({
        post_id: z.number().describe('The post ID'),
        force: z.boolean().default(false).describe('Whether to bypass trash and force permanent deletion'),
      }),
    },
    async ({ post_id, force }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.delete<Post>(`posts/${post_id}`, { force: force.toString() });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'list_draft_posts',
    {
      description: 'List all draft posts in WordPress',
      inputSchema: z.object({
        per_page: z.number().min(1).max(100).default(100).describe('Number of posts per page'),
        page: z.number().min(1).default(1).describe('Current page number'),
      }),
    },
    async ({ per_page, page }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<Post[]>('posts', { status: 'draft', per_page, page }, true);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'publish_post',
    {
      description: 'Publish a single draft post immediately',
      inputSchema: z.object({
        post_id: z.number().describe('The post ID to publish'),
      }),
    },
    async ({ post_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.post<Post>(`posts/${post_id}`, { status: 'publish' });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'publish_bulk_posts',
    {
      description: 'Publish multiple draft posts at once',
      inputSchema: z.object({
        post_ids: z.array(z.number()).describe('List of post IDs to publish'),
      }),
    },
    async ({ post_ids }): Promise<CallToolResult> => {
      const client = getClient();
      const successful: Array<{ post_id: number; post: Post }> = [];
      const failed: Array<{ post_id: number; error: unknown }> = [];

      for (const post_id of post_ids) {
        try {
          const result = await client.post<Post>(`posts/${post_id}`, { status: 'publish' });
          if (isError(result)) {
            failed.push({ post_id, error: result });
          } else {
            successful.push({ post_id, post: result });
          }
        } catch (error) {
          failed.push({ post_id, error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ successful, failed }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'publish_all_drafts',
    {
      description: 'Publish ALL draft posts at once. This tool will fetch all draft posts (handles pagination automatically) and publish each draft post.',
      inputSchema: z.object({}),
    },
    async (): Promise<CallToolResult> => {
      const client = getClient();
      const allDraftIds: number[] = [];
      let page = 1;

      while (true) {
        const drafts = await client.get<Post[]>('posts', { status: 'draft', per_page: 100, page }, true);

        if (isError(drafts)) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: true, message: 'Failed to fetch draft posts', details: drafts }, null, 2) }],
            isError: true,
          };
        }

        if (!Array.isArray(drafts) || drafts.length === 0) break;

        allDraftIds.push(...drafts.map((post) => post.id));

        if (drafts.length < 100) break;
        page++;
      }

      const successful: Array<{ post_id: number; post: Post }> = [];
      const failed: Array<{ post_id: number; error: unknown }> = [];

      for (const post_id of allDraftIds) {
        try {
          const result = await client.post<Post>(`posts/${post_id}`, { status: 'publish' });
          if (isError(result)) {
            failed.push({ post_id, error: result });
          } else {
            successful.push({ post_id, post: result });
          }
        } catch (error) {
          failed.push({ post_id, error: error instanceof Error ? error.message : String(error) });
        }
      }

      const result: PublishAllResult = {
        total_found: allDraftIds.length,
        successful,
        failed,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== PAGES ====================

  server.registerTool(
    'list_pages',
    {
      description: 'List WordPress pages with optional filtering',
      inputSchema: z.object({
        per_page: z.number().min(1).max(100).default(10).describe('Number of pages per page (max 100)'),
        page: z.number().min(1).default(1).describe('Current page number'),
        search: z.string().default('').describe('Search term to filter pages'),
        status: z.enum(['publish', 'draft', 'pending', 'private']).default('publish').describe('Page status'),
        parent: z.number().optional().describe('Parent page ID filter'),
        parent_exclude: z.array(z.number()).optional().describe('Exclude parent page IDs'),
        order: z.enum(['asc', 'desc']).default('asc').describe('Order direction'),
        orderby: z.enum(['date', 'title', 'menu_order', 'modified', 'parent']).default('menu_order').describe('Order by field'),
      }),
    },
    async ({ per_page, page, search, status, parent, parent_exclude, order, orderby }): Promise<CallToolResult> => {
      const client = getClient();
      const params: Record<string, string | number> = { per_page, page, order, orderby };
      if (search) params.search = search;
      if (status) params.status = status;
      if (parent !== undefined) params.parent = parent;
      if (parent_exclude) params.parent_exclude = parent_exclude.join(',');

      const requireAuth = ['draft', 'pending', 'private'].includes(status);
      const result = await client.get<Page[]>('pages', params, requireAuth);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_page',
    {
      description: 'Retrieve a single WordPress page by ID',
      inputSchema: z.object({
        page_id: z.number().describe('The page ID'),
      }),
    },
    async ({ page_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<Page>(`pages/${page_id}`);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'create_page',
    {
      description: 'Create a new WordPress page',
      inputSchema: z.object({
        title: z.string().describe('Page title'),
        content: z.string().describe('Page content (HTML allowed)'),
        status: z.enum(['publish', 'draft', 'pending', 'private']).default('draft').describe('Page status'),
        excerpt: z.string().default('').describe('Page excerpt'),
        parent: z.number().default(0).describe('Parent page ID (0 for top-level)'),
        menu_order: z.number().default(0).describe('Order in navigation'),
        author: z.number().optional().describe('Author ID'),
        featured_media: z.number().optional().describe('Featured media ID'),
        comment_status: z.enum(['open', 'closed']).default('closed').describe('Comment status'),
        ping_status: z.enum(['open', 'closed']).default('closed').describe('Ping status'),
        template: z.string().default('').describe('Template file name'),
      }),
    },
    async ({ title, content, status, excerpt, parent, menu_order, author, featured_media, comment_status, ping_status, template }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = { title, content, status, excerpt, parent, menu_order, comment_status, ping_status };
      if (author !== undefined) data.author = author;
      if (featured_media !== undefined) data.featured_media = featured_media;
      if (template) data.template = template;

      const result = await client.post<Page>('pages', data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'update_page',
    {
      description: 'Update an existing WordPress page',
      inputSchema: z.object({
        page_id: z.number().describe('The page ID'),
        title: z.string().optional().describe('Page title'),
        content: z.string().optional().describe('Page content'),
        status: z.enum(['publish', 'draft', 'pending', 'private']).optional().describe('Page status'),
        excerpt: z.string().optional().describe('Page excerpt'),
        parent: z.number().optional().describe('Parent page ID'),
        menu_order: z.number().optional().describe('Order in navigation'),
        featured_media: z.number().optional().describe('Featured media ID'),
      }),
    },
    async ({ page_id, title, content, status, excerpt, parent, menu_order, featured_media }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = {};
      if (title !== undefined) data.title = title;
      if (content !== undefined) data.content = content;
      if (status !== undefined) data.status = status;
      if (excerpt !== undefined) data.excerpt = excerpt;
      if (parent !== undefined) data.parent = parent;
      if (menu_order !== undefined) data.menu_order = menu_order;
      if (featured_media !== undefined) data.featured_media = featured_media;

      const result = await client.post<Page>(`pages/${page_id}`, data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'delete_page',
    {
      description: 'Delete a WordPress page',
      inputSchema: z.object({
        page_id: z.number().describe('The page ID'),
        force: z.boolean().default(false).describe('Whether to bypass trash and force permanent deletion'),
      }),
    },
    async ({ page_id, force }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.delete<Page>(`pages/${page_id}`, { force: force.toString() });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'list_draft_pages',
    {
      description: 'List all draft pages in WordPress',
      inputSchema: z.object({
        per_page: z.number().min(1).max(100).default(100).describe('Number of pages per page'),
        page: z.number().min(1).default(1).describe('Current page number'),
      }),
    },
    async ({ per_page, page }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<Page[]>('pages', { status: 'draft', per_page, page }, true);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'publish_page',
    {
      description: 'Publish a single draft page immediately',
      inputSchema: z.object({
        page_id: z.number().describe('The page ID to publish'),
      }),
    },
    async ({ page_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.post<Page>(`pages/${page_id}`, { status: 'publish' });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'publish_bulk_pages',
    {
      description: 'Publish multiple draft pages at once',
      inputSchema: z.object({
        page_ids: z.array(z.number()).describe('List of page IDs to publish'),
      }),
    },
    async ({ page_ids }): Promise<CallToolResult> => {
      const client = getClient();
      const successful: Array<{ page_id: number; page: Page }> = [];
      const failed: Array<{ page_id: number; error: unknown }> = [];

      for (const page_id of page_ids) {
        try {
          const result = await client.post<Page>(`pages/${page_id}`, { status: 'publish' });
          if (isError(result)) {
            failed.push({ page_id, error: result });
          } else {
            successful.push({ page_id, page: result });
          }
        } catch (error) {
          failed.push({ page_id, error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ successful, failed }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'publish_all_draft_pages',
    {
      description: 'Publish ALL draft pages at once. This tool will fetch all draft pages (handles pagination automatically) and publish each draft page.',
      inputSchema: z.object({}),
    },
    async (): Promise<CallToolResult> => {
      const client = getClient();
      const allDraftIds: number[] = [];
      let page = 1;

      while (true) {
        const drafts = await client.get<Page[]>('pages', { status: 'draft', per_page: 100, page }, true);

        if (isError(drafts)) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: true, message: 'Failed to fetch draft pages', details: drafts }, null, 2) }],
            isError: true,
          };
        }

        if (!Array.isArray(drafts) || drafts.length === 0) break;

        allDraftIds.push(...drafts.map((p) => p.id));

        if (drafts.length < 100) break;
        page++;
      }

      const successful: Array<{ page_id: number; page: Page }> = [];
      const failed: Array<{ page_id: number; error: unknown }> = [];

      for (const page_id of allDraftIds) {
        try {
          const result = await client.post<Page>(`pages/${page_id}`, { status: 'publish' });
          if (isError(result)) {
            failed.push({ page_id, error: result });
          } else {
            successful.push({ page_id, page: result });
          }
        } catch (error) {
          failed.push({ page_id, error: error instanceof Error ? error.message : String(error) });
        }
      }

      const result: PublishAllResult = {
        total_found: allDraftIds.length,
        successful,
        failed,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== CATEGORIES ====================

  server.registerTool(
    'list_categories',
    {
      description: 'List WordPress categories with optional filtering',
      inputSchema: z.object({
        per_page: z.number().min(1).max(100).default(10).describe('Number of categories per page (max 100)'),
        page: z.number().min(1).default(1).describe('Current page number'),
        search: z.string().default('').describe('Search term to filter categories'),
        hide_empty: z.boolean().default(false).describe('Whether to hide empty categories'),
        parent: z.number().optional().describe('Parent category ID filter'),
        order: z.enum(['asc', 'desc']).default('asc').describe('Order direction'),
        orderby: z.enum(['id', 'name', 'slug', 'count', 'description']).default('name').describe('Order by field'),
      }),
    },
    async ({ per_page, page, search, hide_empty, parent, order, orderby }): Promise<CallToolResult> => {
      const client = getClient();
      const params: Record<string, string | number | boolean> = { per_page, page, order, orderby };
      if (search) params.search = search;
      if (hide_empty) params.hide_empty = 'true';
      if (parent !== undefined) params.parent = parent;

      const result = await client.get<Category[]>('categories', params);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_category',
    {
      description: 'Retrieve a single WordPress category by ID',
      inputSchema: z.object({
        category_id: z.number().describe('The category ID'),
      }),
    },
    async ({ category_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<Category>(`categories/${category_id}`);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'create_category',
    {
      description: 'Create a new WordPress category',
      inputSchema: z.object({
        name: z.string().describe('Category name (required)'),
        description: z.string().default('').describe('Category description'),
        slug: z.string().default('').describe('URL-friendly slug'),
        parent: z.number().default(0).describe('Parent category ID (0 for top-level)'),
      }),
    },
    async ({ name, description, slug, parent }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = { name, description, parent };
      if (slug) data.slug = slug;

      const result = await client.post<Category>('categories', data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'update_category',
    {
      description: 'Update an existing WordPress category',
      inputSchema: z.object({
        category_id: z.number().describe('The category ID'),
        name: z.string().optional().describe('Category name'),
        description: z.string().optional().describe('Category description'),
        slug: z.string().optional().describe('URL-friendly slug'),
        parent: z.number().optional().describe('Parent category ID'),
      }),
    },
    async ({ category_id, name, description, slug, parent }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (slug !== undefined) data.slug = slug;
      if (parent !== undefined) data.parent = parent;

      const result = await client.post<Category>(`categories/${category_id}`, data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'delete_category',
    {
      description: 'Delete a WordPress category',
      inputSchema: z.object({
        category_id: z.number().describe('The category ID'),
      }),
    },
    async ({ category_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.delete<Category>(`categories/${category_id}`, { force: 'true' });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== TAGS ====================

  server.registerTool(
    'list_tags',
    {
      description: 'List WordPress tags with optional filtering',
      inputSchema: z.object({
        per_page: z.number().min(1).max(100).default(10).describe('Number of tags per page (max 100)'),
        page: z.number().min(1).default(1).describe('Current page number'),
        search: z.string().default('').describe('Search term to filter tags'),
        hide_empty: z.boolean().default(false).describe('Whether to hide empty tags'),
        order: z.enum(['asc', 'desc']).default('asc').describe('Order direction'),
        orderby: z.enum(['id', 'name', 'slug', 'count', 'description']).default('name').describe('Order by field'),
      }),
    },
    async ({ per_page, page, search, hide_empty, order, orderby }): Promise<CallToolResult> => {
      const client = getClient();
      const params: Record<string, string | number | boolean> = { per_page, page, order, orderby };
      if (search) params.search = search;
      if (hide_empty) params.hide_empty = 'true';

      const result = await client.get<Tag[]>('tags', params);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_tag',
    {
      description: 'Retrieve a single WordPress tag by ID',
      inputSchema: z.object({
        tag_id: z.number().describe('The tag ID'),
      }),
    },
    async ({ tag_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<Tag>(`tags/${tag_id}`);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'create_tag',
    {
      description: 'Create a new WordPress tag',
      inputSchema: z.object({
        name: z.string().describe('Tag name (required)'),
        description: z.string().default('').describe('Tag description'),
        slug: z.string().default('').describe('URL-friendly slug'),
      }),
    },
    async ({ name, description, slug }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = { name, description };
      if (slug) data.slug = slug;

      const result = await client.post<Tag>('tags', data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'update_tag',
    {
      description: 'Update an existing WordPress tag',
      inputSchema: z.object({
        tag_id: z.number().describe('The tag ID'),
        name: z.string().optional().describe('Tag name'),
        description: z.string().optional().describe('Tag description'),
        slug: z.string().optional().describe('URL-friendly slug'),
      }),
    },
    async ({ tag_id, name, description, slug }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (slug !== undefined) data.slug = slug;

      const result = await client.post<Tag>(`tags/${tag_id}`, data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'delete_tag',
    {
      description: 'Delete a WordPress tag',
      inputSchema: z.object({
        tag_id: z.number().describe('The tag ID'),
      }),
    },
    async ({ tag_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.delete<Tag>(`tags/${tag_id}`, { force: 'true' });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== COMMENTS ====================

  server.registerTool(
    'list_comments',
    {
      description: 'List WordPress comments with optional filtering',
      inputSchema: z.object({
        per_page: z.number().min(1).max(100).default(10).describe('Number of comments per page (max 100)'),
        page: z.number().min(1).default(1).describe('Current page number'),
        search: z.string().default('').describe('Search term to filter comments'),
        post: z.number().optional().describe('Filter by post ID'),
        status: z.enum(['approve', 'hold', 'spam', 'trash']).default('approve').describe('Comment status'),
        parent: z.number().optional().describe('Parent comment ID (for threaded comments)'),
        order: z.enum(['asc', 'desc']).default('desc').describe('Order direction'),
        orderby: z.enum(['date', 'date_gmt', 'id', 'post', 'parent']).default('date_gmt').describe('Order by field'),
      }),
    },
    async ({ per_page, page, search, post, status, parent, order, orderby }): Promise<CallToolResult> => {
      const client = getClient();
      const params: Record<string, string | number> = { per_page, page, order, orderby };
      if (search) params.search = search;
      if (post) params.post = post;
      if (status) params.status = status;
      if (parent !== undefined) params.parent = parent;

      const requireAuth = ['hold', 'spam', 'trash'].includes(status);
      const result = await client.get<Comment[]>('comments', params, requireAuth);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_comment',
    {
      description: 'Retrieve a single WordPress comment by ID',
      inputSchema: z.object({
        comment_id: z.number().describe('The comment ID'),
      }),
    },
    async ({ comment_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<Comment>(`comments/${comment_id}`);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'create_comment',
    {
      description: 'Create a new WordPress comment',
      inputSchema: z.object({
        post: z.number().describe('Associated post ID (required)'),
        content: z.string().describe('Comment content (required)'),
        author_name: z.string().default('').describe('Display name for comment author'),
        author_email: z.string().default('').describe('Email address for comment author'),
        author_url: z.string().default('').describe('URL for comment author'),
        parent: z.number().default(0).describe('Parent comment ID (0 for top-level)'),
        status: z.enum(['approve', 'hold', 'spam']).default('hold').describe('Comment status'),
      }),
    },
    async ({ post, content, author_name, author_email, author_url, parent, status }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = { post, content, parent };
      if (author_name) data.author_name = author_name;
      if (author_email) data.author_email = author_email;
      if (author_url) data.author_url = author_url;
      if (status) data.status = status;

      const result = await client.post<Comment>('comments', data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'update_comment',
    {
      description: 'Update an existing WordPress comment',
      inputSchema: z.object({
        comment_id: z.number().describe('The comment ID'),
        content: z.string().optional().describe('Comment content'),
        status: z.enum(['approve', 'hold', 'spam', 'trash']).optional().describe('Comment status'),
        author_name: z.string().optional().describe('Display name for comment author'),
        author_email: z.string().optional().describe('Email address for comment author'),
      }),
    },
    async ({ comment_id, content, status, author_name, author_email }): Promise<CallToolResult> => {
      const client = getClient();
      const data: Record<string, unknown> = {};
      if (content !== undefined) data.content = content;
      if (status !== undefined) data.status = status;
      if (author_name !== undefined) data.author_name = author_name;
      if (author_email !== undefined) data.author_email = author_email;

      const result = await client.post<Comment>(`comments/${comment_id}`, data);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'approve_comment',
    {
      description: 'Approve a comment immediately',
      inputSchema: z.object({
        comment_id: z.number().describe('The comment ID to approve'),
      }),
    },
    async ({ comment_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.post<Comment>(`comments/${comment_id}`, { status: 'approve' });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'spam_comment',
    {
      description: 'Mark a comment as spam',
      inputSchema: z.object({
        comment_id: z.number().describe('The comment ID to mark as spam'),
      }),
    },
    async ({ comment_id }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.post<Comment>(`comments/${comment_id}`, { status: 'spam' });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'delete_comment',
    {
      description: 'Delete a WordPress comment',
      inputSchema: z.object({
        comment_id: z.number().describe('The comment ID'),
        force: z.boolean().default(false).describe('Whether to bypass trash and force permanent deletion'),
      }),
    },
    async ({ comment_id, force }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.delete<Comment>(`comments/${comment_id}`, { force: force.toString() });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'list_pending_comments',
    {
      description: 'List all pending comments for moderation',
      inputSchema: z.object({
        per_page: z.number().min(1).max(100).default(100).describe('Number of comments per page'),
        page: z.number().min(1).default(1).describe('Current page number'),
      }),
    },
    async ({ per_page, page }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<Comment[]>('comments', { status: 'hold', per_page, page }, true);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'bulk_approve_comments',
    {
      description: 'Approve multiple comments at once',
      inputSchema: z.object({
        comment_ids: z.array(z.number()).describe('List of comment IDs to approve'),
      }),
    },
    async ({ comment_ids }): Promise<CallToolResult> => {
      const client = getClient();
      const successful: Array<{ comment_id: number; comment: Comment }> = [];
      const failed: Array<{ comment_id: number; error: unknown }> = [];

      for (const comment_id of comment_ids) {
        try {
          const result = await client.post<Comment>(`comments/${comment_id}`, { status: 'approve' });
          if (isError(result)) {
            failed.push({ comment_id, error: result });
          } else {
            successful.push({ comment_id, comment: result });
          }
        } catch (error) {
          failed.push({ comment_id, error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ successful, failed }, null, 2) }],
      };
    }
  );

  // ==================== SEARCH ====================

  server.registerTool(
    'search_site',
    {
      description: 'Perform a site-wide search across WordPress content',
      inputSchema: z.object({
        search: z.string().describe('Search query string (required)'),
        per_page: z.number().min(1).max(100).default(10).describe('Number of results per page (max 100)'),
        page: z.number().min(1).default(1).describe('Current page number'),
        type: z.enum(['post', 'term', 'post-format']).optional().describe('Object type filter'),
        subtype: z.enum(['post', 'page', 'category', 'post_tag']).optional().describe('Object subtype filter'),
      }),
    },
    async ({ search, per_page, page, type, subtype }): Promise<CallToolResult> => {
      const client = getClient();
      const params: Record<string, string | number> = { search, per_page, page };
      if (type) params.type = type;
      if (subtype) params.subtype = subtype;

      const result = await client.get<SearchResult[]>('search', params);

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'search_posts',
    {
      description: 'Search only posts in WordPress',
      inputSchema: z.object({
        search: z.string().describe('Search query string'),
        per_page: z.number().min(1).max(100).default(10).describe('Number of results per page (max 100)'),
        page: z.number().min(1).default(1).describe('Current page number'),
      }),
    },
    async ({ search, per_page, page }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<SearchResult[]>('search', { search, per_page, page, type: 'post', subtype: 'post' });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'search_pages',
    {
      description: 'Search only pages in WordPress',
      inputSchema: z.object({
        search: z.string().describe('Search query string'),
        per_page: z.number().min(1).max(100).default(10).describe('Number of results per page (max 100)'),
        page: z.number().min(1).default(1).describe('Current page number'),
      }),
    },
    async ({ search, per_page, page }): Promise<CallToolResult> => {
      const client = getClient();
      const result = await client.get<SearchResult[]>('search', { search, per_page, page, type: 'post', subtype: 'page' });

      if (isError(result)) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ==================== RESOURCES ====================

  server.registerResource(
    'posts-resource',
    'wordpress://posts/{status}',
    {
      title: 'WordPress Posts',
      description: 'Get posts as a resource. Use {status} as "publish", "draft", "pending", or "private"',
    },
    async (uri): Promise<ReadResourceResult> => {
      const uriStr = typeof uri === 'string' ? uri : uri.href;
      const status = uriStr.split('/').pop() || 'publish';
      const client = getClient();
      const result = await client.get<Post[]>('posts', { status, per_page: 100 }, status !== 'publish');

      if (isError(result)) {
        return {
          contents: [
            {
              uri: uriStr,
              text: `Error retrieving posts: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uriStr,
            text: `Found ${Array.isArray(result) ? result.length : 0} ${status} posts.`,
          },
        ],
      };
    }
  );

  server.registerResource(
    'pages-resource',
    'wordpress://pages',
    {
      title: 'WordPress Pages',
      description: 'Get all pages as a resource',
    },
    async (uri): Promise<ReadResourceResult> => {
      const uriStr = typeof uri === 'string' ? uri : uri.href;
      const client = getClient();
      const result = await client.get<Page[]>('pages', { per_page: 100 });

      if (isError(result)) {
        return {
          contents: [
            {
              uri: uriStr,
              text: `Error retrieving pages: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uriStr,
            text: `Found ${Array.isArray(result) ? result.length : 0} pages.`,
          },
        ],
      };
    }
  );

  server.registerResource(
    'categories-resource',
    'wordpress://categories',
    {
      title: 'WordPress Categories',
      description: 'Get all categories as a resource',
    },
    async (uri): Promise<ReadResourceResult> => {
      const uriStr = typeof uri === 'string' ? uri : uri.href;
      const client = getClient();
      const result = await client.get<Category[]>('categories', { per_page: 100, hide_empty: false });

      if (isError(result)) {
        return {
          contents: [
            {
              uri: uriStr,
              text: `Error retrieving categories: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uriStr,
            text: `Found ${Array.isArray(result) ? result.length : 0} categories.`,
          },
        ],
      };
    }
  );

  server.registerResource(
    'tags-resource',
    'wordpress://tags',
    {
      title: 'WordPress Tags',
      description: 'Get all tags as a resource',
    },
    async (uri): Promise<ReadResourceResult> => {
      const uriStr = typeof uri === 'string' ? uri : uri.href;
      const client = getClient();
      const result = await client.get<Tag[]>('tags', { per_page: 100, hide_empty: false });

      if (isError(result)) {
        return {
          contents: [
            {
              uri: uriStr,
              text: `Error retrieving tags: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uriStr,
            text: `Found ${Array.isArray(result) ? result.length : 0} tags.`,
          },
        ],
      };
    }
  );

  server.registerResource(
    'comments-resource',
    'wordpress://comments',
    {
      title: 'WordPress Comments',
      description: 'Get all comments as a resource',
    },
    async (uri): Promise<ReadResourceResult> => {
      const uriStr = typeof uri === 'string' ? uri : uri.href;
      const client = getClient();
      const result = await client.get<Comment[]>('comments', { per_page: 100 });

      if (isError(result)) {
        return {
          contents: [
            {
              uri: uriStr,
              text: `Error retrieving comments: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uriStr,
            text: `Found ${Array.isArray(result) ? result.length : 0} comments.`,
          },
        ],
      };
    }
  );

  server.registerResource(
    'pending-comments-resource',
    'wordpress://pending-comments',
    {
      title: 'Pending WordPress Comments',
      description: 'Get pending comments for moderation',
    },
    async (uri): Promise<ReadResourceResult> => {
      const uriStr = typeof uri === 'string' ? uri : uri.href;
      const client = getClient();
      const result = await client.get<Comment[]>('comments', { status: 'hold', per_page: 100 }, true);

      if (isError(result)) {
        return {
          contents: [
            {
              uri: uriStr,
              text: `Error retrieving pending comments: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uriStr,
            text: `Found ${Array.isArray(result) ? result.length : 0} pending comments awaiting moderation.`,
          },
        ],
      };
    }
  );

  // ==================== PROMPTS ====================

  server.registerPrompt(
    'create-blog-post',
    {
      title: 'Create Blog Post',
      description: 'Generate a prompt for creating a blog post',
      argsSchema: {
        topic: z.string().describe('The topic to write about'),
        tone: z.enum(['professional', 'casual', 'friendly', 'formal']).default('professional').describe('Tone of the blog post'),
      },
    },
    async ({ topic, tone }): Promise<GetPromptResult> => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Write a ${tone} blog post about ${topic}. Include an engaging title, introduction, main body with several sections, and a conclusion.`,
            },
          },
        ],
      };
    }
  );

  server.registerPrompt(
    'optimize-seo',
    {
      title: 'Optimize SEO',
      description: 'Generate a prompt for SEO optimization',
      argsSchema: {
        content_type: z.string().describe('The type of content to optimize (e.g., "blog post", "page", "product description")'),
      },
    },
    async ({ content_type }): Promise<GetPromptResult> => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Provide SEO recommendations for ${content_type} in WordPress, including keyword placement, meta descriptions, and content structure.`,
            },
          },
        ],
      };
    }
  );

  return server;
}
