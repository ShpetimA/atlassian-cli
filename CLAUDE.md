# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
bun run build          # Compile TypeScript to dist/ and link globally (enables `bb` command)
bun run dev            # Watch mode compilation
bun start              # Run compiled CLI
```

No test or lint scripts defined.

## Architecture

Bitbucket CLI - TypeScript/Node.js CLI for Bitbucket Cloud API v2.0. Uses Commander.js for CLI structure, Axios for HTTP.

### Core Files

- `src/index.ts` - CLI entry point, global options (--format, --output, --workspace)
- `src/client.ts` - BitbucketClient class wrapping all API calls
- `src/types.ts` - TypeScript interfaces for config and API entities
- `src/commands/pr.ts` - Pull request subcommands (list, get, diff, comments, activity)
- `src/commands/repo.ts` - Repository subcommands (list)
- `src/utils/output.ts` - Output formatting (json/plain/minimal)

### Authentication

Env vars: `BITBUCKET_TOKEN` (bearer) OR `BITBUCKET_USERNAME` + `BITBUCKET_PASSWORD` (basic auth). `BITBUCKET_WORKSPACE` for default workspace.

### Patterns

- Commands return data via `formatOutput()` from utils/output.ts
- BitbucketClient handles URL normalization (web URLs → API URLs)
- Pagination: `pagelen` (max 100), `page` params; defaults to 10 items
- ES Module (ESM) with ES2022 target

## Submodule

`bitbucket-mcp/` is a separate MCP server (git submodule), not part of this CLI package. When adding new CLI commands, check `bitbucket-mcp/` for existing API endpoints and types to reuse.
