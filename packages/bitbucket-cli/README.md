# Bitbucket CLI (`bb`)

CLI for Bitbucket Cloud API - manage repos, pull requests, diffs, and comments.

## Installation

```bash
# npm
npm install -g @happy2png/bitbucket-cli

# curl (standalone binary)
curl -fsSL https://raw.githubusercontent.com/ShpetimA/atlassian-cli/main/install-bb.sh | bash
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BITBUCKET_TOKEN` | Yes* | Bearer token (app password) |
| `BITBUCKET_USERNAME` | Yes* | Username (for basic auth) |
| `BITBUCKET_PASSWORD` | Yes* | App password (for basic auth) |
| `BITBUCKET_WORKSPACE` | No | Default workspace |
| `BITBUCKET_URL` | No | API base URL (default: `https://api.bitbucket.org/2.0`) |

*Use either `BITBUCKET_TOKEN` OR `BITBUCKET_USERNAME` + `BITBUCKET_PASSWORD`

## Setup

```bash
# Option 1: Bearer token
export BITBUCKET_TOKEN="your-app-password"
export BITBUCKET_WORKSPACE="your-workspace"

# Option 2: Basic auth
export BITBUCKET_USERNAME="your-username"
export BITBUCKET_PASSWORD="your-app-password"
export BITBUCKET_WORKSPACE="your-workspace"
```

## Commands

### Repository

```bash
bb repo list                          # List repositories
bb repo list -l 50                    # Limit to 50
bb repo list -n myrepo                # Filter by name
```

### Pull Requests

```bash
bb pr list <repo>                     # List PRs
bb pr list <repo> -s MERGED           # Merged PRs
bb pr get <repo> <id>                 # Get PR details
bb pr diff <repo> <id>                # Get PR diff
bb pr diff <repo> <id> --stat-only    # Diff stats only
bb pr diff <repo> <id> -f src/file.ts # Filter to file
```

### Comments

```bash
bb pr comments <repo> <id>            # List comments
bb pr comment <repo> <id> "LGTM!"     # Add comment
bb pr comment <repo> <id> "Fix" -f src/index.ts -l 42  # Inline comment
bb pr resolve-comment <repo> <pr> <comment-id>         # Resolve thread
```

### Activity & Commits

```bash
bb pr activity <repo> <id>            # PR activity
bb pr activity <repo> <id> -t approval # Only approvals
bb pr commits <repo> <id>             # PR commits
```

## Global Options

| Option | Description |
|--------|-------------|
| `-f, --format <format>` | Output: `json`, `plain`, `minimal` |
| `-o, --output <file>` | Write to file |
| `-w, --workspace <ws>` | Override workspace |

## Full Reference

See [docs/bb-cli.md](https://github.com/ShpetimA/atlassian-cli/blob/main/docs/bb-cli.md) for all commands and options.

## License

MIT
