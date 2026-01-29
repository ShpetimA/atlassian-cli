# Atlassian CLI Tools

CLI tools for Bitbucket, Jira, and Confluence.

| CLI | Binary | Description |
|-----|--------|-------------|
| [Bitbucket CLI](#bitbucket-cli-bb) | `bb` | Pull requests, repos, diffs |
| [Jira CLI](#jira-cli-jc) | `jc` | Issues, sprints, Confluence pages |

---

## Installation

### curl (standalone binary)

```bash
# Bitbucket CLI
curl -fsSL https://raw.githubusercontent.com/ShpetimA/bitbucket-cli/main/install-bb.sh | bash

# Jira CLI
curl -fsSL https://raw.githubusercontent.com/ShpetimA/bitbucket-cli/main/install-jira.sh | bash
```

Installs to `~/.local/bin`. Add to PATH if needed:
```bash
export PATH="$PATH:$HOME/.local/bin"
```

### npm

```bash
# Bitbucket CLI
npm install -g @happy2png/bitbucket-cli

# Jira CLI
npm install -g @happy2png/jira-cli
```

---

## Bitbucket CLI (`bb`)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BITBUCKET_TOKEN` | Yes* | Bearer token (app password) |
| `BITBUCKET_USERNAME` | Yes* | Username (for basic auth) |
| `BITBUCKET_PASSWORD` | Yes* | App password (for basic auth) |
| `BITBUCKET_WORKSPACE` | No | Default workspace |
| `BITBUCKET_URL` | No | API base URL (default: `https://api.bitbucket.org/2.0`) |

*Use either `BITBUCKET_TOKEN` OR `BITBUCKET_USERNAME` + `BITBUCKET_PASSWORD`

### Setup

```bash
# Option 1: Bearer token
export BITBUCKET_TOKEN="your-app-password"
export BITBUCKET_WORKSPACE="your-workspace"

# Option 2: Basic auth
export BITBUCKET_USERNAME="your-username"
export BITBUCKET_PASSWORD="your-app-password"
export BITBUCKET_WORKSPACE="your-workspace"
```

### Quick Start

```bash
bb repo list                          # List repositories
bb pr list <repo>                     # List pull requests
bb pr get <repo> <pr-id>              # Get PR details
bb pr diff <repo> <pr-id>             # Get PR diff
```

**Full reference:** [docs/bb-cli.md](docs/bb-cli.md)

---

## Jira CLI (`jc`)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JIRA_DOMAIN` | Yes | Your Atlassian domain (e.g., `yourcompany.atlassian.net`) |
| `JIRA_EMAIL` | Yes | Your Atlassian account email |
| `JIRA_API_TOKEN` | Yes | API token from [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_PROJECT` | No | Default project key |
| `CONFLUENCE_SPACE` | No | Default Confluence space key |

### Setup

```bash
export JIRA_DOMAIN="yourcompany.atlassian.net"
export JIRA_EMAIL="you@example.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT="PROJ"           # optional
export CONFLUENCE_SPACE="SPACE"      # optional
```

### Quick Start

```bash
# Jira
jc issue list                         # List issues
jc issue get <issue-key>              # Get issue details
jc issue create --summary "Title"     # Create issue
jc search "project = PROJ"            # Search via JQL

# Confluence
jc page list --space <id>             # List pages
jc page get <page-id>                 # Get page content
```

**Full reference:** [docs/jc-cli.md](docs/jc-cli.md)

---

## License

MIT
