# jira-cli (`jc`)

CLI for Jira Cloud REST API v3 and Confluence Cloud REST API v2. JSON-first output for AI agents.

## Install

```bash
# npm
npm install -g @happy2png/jira-cli

# curl (standalone binary - macOS/Linux)
curl -fsSL https://raw.githubusercontent.com/ShpetimA/atlassian-cli/main/install-jira.sh | bash

# from source
cd jira-cli
bun install
bun run build  # compiles and links `jc` globally
```

### Add to PATH (curl install)

**macOS/Linux** - add to `~/.zshrc` or `~/.bashrc`:
```bash
export PATH="$PATH:$HOME/.local/bin"
```

**Windows** (PowerShell):
```powershell
# Download binary
Invoke-WebRequest -Uri "https://github.com/ShpetimA/atlassian-cli/releases/latest/download/jc-windows-x64.exe" -OutFile "$env:LOCALAPPDATA\jc.exe"

# Add to PATH (run as admin or add to user PATH via System Properties)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:LOCALAPPDATA", "User")
```

## Authentication

Set env vars:

```bash
export JIRA_DOMAIN=your-domain     # yourcompany.atlassian.net → "yourcompany"
export JIRA_EMAIL=user@example.com
export JIRA_API_TOKEN=ATATT3x...   # https://id.atlassian.com/manage/api-tokens
export JIRA_PROJECT=PROJ           # optional default project
export CONFLUENCE_SPACE=DOCS       # optional default space
```

Or use config file:

```bash
jc config init                           # creates ~/.config/jc/config.json
jc config set profiles.default.domain yourcompany
jc config set profiles.default.email user@example.com
jc config set profiles.default.apiToken ATATT3x...
```

## Global Options

```
--format json|plain|minimal   Output format (default: json)
-o, --output <file>           Write to file
--domain <domain>             Override Jira domain
--profile <name>              Config profile
--debug                       Show HTTP details
```

---

## Commands

### Issues

```bash
jc issue list [-j <jql>] [--project KEY] [-l 50] [-p 1]
jc issue get <key> [--expand fields]
jc issue create --summary "text" [--project KEY] [--type Task] [--description text] [--priority Medium] [--labels a,b]
jc issue edit <key> [--summary] [--description] [--priority] [--labels]
jc issue delete <key> [--subtasks]
jc issue assign <key> [user]        # omit user to unassign
jc issue transitions <key>
jc issue transition <key> <status>
```

### Comments

```bash
jc issue comments <key> [-l 50]
jc issue comment <key> "text"
```

### Issue Links

```bash
jc issue link-types                   # list link types (Blocks, Clones, etc)
jc issue links <key>                  # list links on issue
jc issue link <key1> <key2> <type>    # key1 outward→ key2 inward
jc issue unlink <linkId>
```

### Labels

```bash
jc issue add-label <key> <label>
jc issue remove-label <key> <label>
jc label list [-l 50] [-p 1]
```

### Worklogs

```bash
jc issue worklogs <key> [-l 50]
jc issue worklog <key> -t "1h 30m" [-c comment] [-s 2024-01-15T09:00:00]
jc issue worklog-edit <key> <worklogId> [-t time] [-c comment] [-s started]
jc issue worklog-delete <key> <worklogId>
```

### Attachments

```bash
jc issue attachments <key>
jc issue attach <key> /path/to/file.pdf
jc issue attachment-delete <attachmentId>
```

### Watchers

```bash
jc issue watchers <key>
jc issue watch <key> [--user accountId]     # defaults to self
jc issue unwatch <key> [--user accountId]
```

### Search

```bash
jc search "project = PROJ AND status = Open" [-l 50] [--fields key,summary]
jc search query "project = PROJ" [-l 50]     # explicit subcommand
jc search count "project = PROJ"             # approximate count
```

### Projects

```bash
jc project list [-q query] [--type software|business|service_desk]
jc project get <key> [--expand description,lead,issueTypes]
jc project statuses <key>
jc project components <key>
jc project versions <key> [--status released|unreleased|archived]
```

### Filters

```bash
jc filter list [-n name] [--owner id] [--project key] [--favourites]
jc filter get <id> [--expand sharedUsers,subscriptions]
jc filter create --name "My Filter" --jql "project = PROJ" [--description text] [--favourite]
jc filter update <id> [--name] [--jql] [--description] [--favourite|--no-favourite]
jc filter delete <id>
```

### Fields

```bash
jc field list [--custom|--system] [--searchable]
```

---

## Agile Commands

### Boards

```bash
jc board list [--project KEY] [--type scrum|kanban]
jc board get <id>
jc board config <id>
jc board issues <id> [-j jql] [-l 50]
jc board backlog <id> [-j jql] [-l 50]
```

### Sprints

```bash
jc sprint list <board-id> [--state future|active|closed] [-l 50]
jc sprint get <id>
jc sprint issues <id> [-j jql] [--fields key,summary] [-l 50]
jc sprint create <board-id> --name "Sprint 1" [--start-date 2024-01-15] [--end-date 2024-01-29] [--goal text]
jc sprint start <id> --start-date 2024-01-15 --end-date 2024-01-29
jc sprint close <id> [--complete-date 2024-01-29]
jc sprint move-issues <id> --issues PROJ-1,PROJ-2 [--rank-before PROJ-3]
jc sprint to-backlog --issues PROJ-1,PROJ-2
```

### Epics

```bash
jc epic list <board-id> [--done|--not-done]
jc epic get <key>
jc epic issues <key> [-j jql] [--fields key,summary]
jc epic move-issues <key> --issues PROJ-1,PROJ-2
jc epic remove-issues --issues PROJ-1,PROJ-2
jc epic rank --issues PROJ-1 --before|--after PROJ-2
```

---

## Confluence Commands

### Spaces

```bash
jc space list [--type global|personal] [--status current|archived]
jc space get <id-or-key>
```

### Pages

```bash
jc page list --space <id> [--status current|draft|trashed] [--sort title|modified-date] [-l 25]
jc page get <id> [--body storage|atlas_doc_format|view]
jc page create --space <id> --title "Page Title" [--parent <id>] [--body "<p>HTML</p>"] [--body-file ./doc.html]
jc page update <id> --title "New Title" [--body "<p>HTML</p>"] [--body-file ./doc.html] [--message "Updated"]
jc page delete <id>
jc page children <id> [-l 25]
jc page comments <id> [-l 25]
jc page comment <id> "comment text"
jc page labels <id> [-l 25]
jc page add-label <id> <label>
```

---

## Config Commands

```bash
jc config init                    # create config file
jc config set <key> <value>       # set config value (dot notation)
jc config get <key>               # get config value
jc config list                    # show full config
jc config profile <name>          # switch active profile
```

Config path: `~/.config/jc/config.json` (Linux/macOS) or `%APPDATA%\jc\config.json` (Windows)

---

## Examples

```bash
# List open bugs assigned to me
jc issue list -j "assignee = currentUser() AND type = Bug AND status != Done"

# Create story and assign
jc issue create --project PROJ --type Story --summary "Add login" --labels auth,frontend
jc issue assign PROJ-123 user@example.com

# Move to sprint
jc sprint move-issues 42 --issues PROJ-123,PROJ-124

# Track time
jc issue worklog PROJ-123 -t "2h" -c "Implemented login form"

# Update Confluence page from file
jc page update 12345 --title "API Docs" --body-file ./api-docs.html --message "Added endpoints"
```

---

## Output Formats

- **json** (default): Full JSON response, ideal for AI agents
- **plain**: Human-readable key-value format
- **minimal**: Compact output (keys only for lists)

```bash
jc issue list --format plain
jc issue list --format minimal
jc issue list -o issues.json      # write to file
```

---

## Async Tasks

```bash
jc issue archive -j "project = OLD"   # archive issues (async)
jc issue archive --issues KEY-1,KEY-2 --wait
jc task get <taskId>                  # check task status
jc task cancel <taskId>               # cancel running task
```

---

## License

MIT
