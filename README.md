# WordPress MCP Server

A TypeScript/Node.js MCP (Model Context Protocol) server for managing WordPress sites via the REST API.

## Features

- **Posts**: Create, read, update, delete, and publish WordPress posts
- **Pages**: Full page management with hierarchical support
- **Categories**: Manage WordPress categories
- **Tags**: Manage WordPress tags
- **Comments**: Moderate and manage comments
- **Search**: Site-wide search functionality
- **Resources**: Quick access to WordPress data
- **Prompts**: Built-in prompts for blog post creation and SEO optimization

## Installation

### Claude Desktop Configuration

Add this to your Claude Desktop MCP configuration file (`claude_desktop_config.json`):

#### Using local dist

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["dist/cli.js"],
      "env": {
        "WP_URL": "https://your-site.com",
        "WP_USERNAME": "your-username",
        "WP_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```
#### Using npm

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "wordpress-mcp-server"],
      "env": {
        "WP_URL": "https://your-site.com",
        "WP_USERNAME": "your-username",
        "WP_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

### Environment Variables

- `WP_URL`: Your WordPress site URL (e.g., `https://example.com`)
- `WP_USERNAME`: Your WordPress username
- `WP_APP_PASSWORD`: Your WordPress application password (generate at `/wp-admin/profile.php`)

## Available Tools

### Posts

- `list_posts` - List posts with filtering options
- `get_post` - Get a single post by ID
- `create_post` - Create a new post
- `update_post` - Update an existing post
- `delete_post` - Delete a post
- `list_draft_posts` - List all draft posts
- `publish_post` - Publish a single draft post
- `publish_bulk_posts` - Publish multiple draft posts
- `publish_all_drafts` - Publish ALL draft posts

### Pages

- `list_pages` - List pages with filtering options
- `get_page` - Get a single page by ID
- `create_page` - Create a new page
- `update_page` - Update an existing page
- `delete_page` - Delete a page
- `list_draft_pages` - List all draft pages
- `publish_page` - Publish a single draft page
- `publish_bulk_pages` - Publish multiple draft pages
- `publish_all_draft_pages` - Publish ALL draft pages

### Categories

- `list_categories` - List categories
- `get_category` - Get a single category
- `create_category` - Create a new category
- `update_category` - Update a category
- `delete_category` - Delete a category

### Tags

- `list_tags` - List tags
- `get_tag` - Get a single tag
- `create_tag` - Create a new tag
- `update_tag` - Update a tag
- `delete_tag` - Delete a tag

### Comments

- `list_comments` - List comments with filtering
- `get_comment` - Get a single comment
- `create_comment` - Create a new comment
- `update_comment` - Update a comment
- `approve_comment` - Approve a comment
- `spam_comment` - Mark a comment as spam
- `delete_comment` - Delete a comment
- `list_pending_comments` - List pending comments
- `bulk_approve_comments` - Approve multiple comments

### Search

- `search_site` - Site-wide search
- `search_posts` - Search only posts
- `search_pages` - Search only pages

## Resources

- `wordpress://posts/{status}` - Get posts by status
- `wordpress://pages` - Get all pages
- `wordpress://categories` - Get all categories
- `wordpress://tags` - Get all tags
- `wordpress://comments` - Get all comments
- `wordpress://pending-comments` - Get pending comments

## Prompts

- `create-blog-post` - Generate a blog post writing prompt
- `optimize-seo` - Generate SEO optimization recommendations

## Requirements

- Node.js 18 or higher
- WordPress site with REST API enabled
- WordPress application password

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start

# Watch mode
npm run dev
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
