# Jira & Confluence CLI (`jc`) Reference

## Global Options

| Option | Description |
|--------|-------------|
| `--format <format>` | Output format: `json`, `plain`, `minimal` (default: `json`) |
| `-o, --output <file>` | Write output to file |
| `--domain <domain>` | Jira domain override |
| `--profile <name>` | Config profile to use |
| `--debug` | Show HTTP request details |

---

## Config Commands

### `jc config init`

Initialize config file.

```bash
jc config init
jc config init --domain mycompany --email me@x.com --token XXX
```

### `jc config set <key> <value>`

Set config value.

```bash
jc config set defaults.project PROJ
jc config set profiles.default.domain mycompany
```

### `jc config get <key>`

Get config value.

```bash
jc config get defaults.project
```

### `jc config list`

Show current config.

### `jc config profile <name>`

Switch active profile.

---

## Issue Commands

### `jc issue list`

List issues via JQL.

```bash
jc issue list
jc issue list --project PROJ
jc issue list -j "status = 'In Progress'"
jc issue list -l 100 -p 2
```

| Option | Description |
|--------|-------------|
| `-j, --jql <query>` | JQL query |
| `--project <key>` | Filter by project |
| `-l, --limit <n>` | Max results (default: 50) |
| `-p, --page <n>` | Page number |

### `jc issue get <key>`

Get issue details.

```bash
jc issue get PROJ-123
jc issue get PROJ-123 --expand changelog
```

### `jc issue create`

Create issue.

```bash
jc issue create --summary "Bug title" --project PROJ
jc issue create --summary "Task" --type Task --priority High --labels bug,urgent
```

| Option | Description |
|--------|-------------|
| `--summary <text>` | Issue summary (required) |
| `--project <key>` | Project key |
| `--type <name>` | Issue type (default: Task) |
| `--description <text>` | Description |
| `--priority <name>` | Priority |
| `--labels <labels>` | Comma-separated labels |

### `jc issue edit <key>`

Update issue.

```bash
jc issue edit PROJ-123 --summary "New title"
jc issue edit PROJ-123 --priority Critical --labels new-label
```

### `jc issue delete <key>`

Delete issue.

```bash
jc issue delete PROJ-123
jc issue delete PROJ-123 --subtasks
```

### `jc issue assign <key> [user]`

Assign/unassign issue.

```bash
jc issue assign PROJ-123 john@company.com
jc issue assign PROJ-123                    # unassign
```

### `jc issue transitions <key>`

List available transitions.

### `jc issue transition <key> <status>`

Transition issue.

```bash
jc issue transition PROJ-123 "In Progress"
jc issue transition PROJ-123 Done
```

### `jc issue comments <key>`

List comments.

### `jc issue comment <key> <text>`

Add comment.

```bash
jc issue comment PROJ-123 "This is done"
```

### `jc issue link-types`

List available link types.

### `jc issue links <key>`

List issue links.

### `jc issue link <key1> <key2> <type>`

Create link between issues.

```bash
jc issue link PROJ-1 PROJ-2 "Blocks"
```

### `jc issue unlink <linkId>`

Delete issue link.

### `jc issue add-label <key> <label>`

Add label.

### `jc issue remove-label <key> <label>`

Remove label.

### `jc issue worklogs <key>`

List worklogs.

### `jc issue worklog <key>`

Add worklog.

```bash
jc issue worklog PROJ-123 -t "2h 30m" -c "Fixed bug"
```

| Option | Description |
|--------|-------------|
| `-t, --time <duration>` | Time spent (required) |
| `-c, --comment <text>` | Comment |
| `-s, --started <datetime>` | Start time (ISO) |

### `jc issue worklog-edit <key> <worklogId>`

Update worklog.

### `jc issue worklog-delete <key> <worklogId>`

Delete worklog.

### `jc issue attachments <key>`

List attachments.

### `jc issue attach <key> <file>`

Attach file.

### `jc issue attachment-delete <attachmentId>`

Delete attachment.

### `jc issue watchers <key>`

List watchers.

### `jc issue watch <key>`

Watch issue.

### `jc issue unwatch <key>`

Unwatch issue.

### `jc issue archive`

Archive issues (async).

```bash
jc issue archive -j "project = OLD"
jc issue archive --issues PROJ-1,PROJ-2 --wait
```

---

## Search Commands

### `jc search <jql>`

Search issues.

```bash
jc search "project = PROJ AND status = Open"
jc search "assignee = currentUser()" -l 100
```

### `jc search query <jql>`

Same as above.

### `jc search count <jql>`

Get issue count.

---

## Project Commands

### `jc project list`

List projects.

```bash
jc project list
jc project list -q "mobile" --type software
```

### `jc project get <key>`

Get project details.

### `jc project statuses <key>`

List project statuses.

### `jc project components <key>`

List components.

### `jc project versions <key>`

List versions.

---

## Board Commands (Agile)

### `jc board list`

List boards.

```bash
jc board list
jc board list --type scrum --project PROJ
```

### `jc board get <id>`

Get board details.

### `jc board config <id>`

Get board configuration.

### `jc board issues <id>`

List board issues.

### `jc board backlog <id>`

List backlog issues.

---

## Sprint Commands (Agile)

### `jc sprint list <board-id>`

List sprints.

```bash
jc sprint list 1
jc sprint list 1 --state active
```

### `jc sprint get <id>`

Get sprint details.

### `jc sprint issues <id>`

List sprint issues.

### `jc sprint create <board-id>`

Create sprint.

```bash
jc sprint create 1 --name "Sprint 1" --goal "MVP"
```

### `jc sprint start <id>`

Start sprint.

```bash
jc sprint start 1 --start-date 2024-01-01 --end-date 2024-01-14
```

### `jc sprint close <id>`

Close sprint.

### `jc sprint move-issues <id>`

Move issues to sprint.

```bash
jc sprint move-issues 1 --issues PROJ-1,PROJ-2
```

### `jc sprint to-backlog`

Move issues to backlog.

```bash
jc sprint to-backlog --issues PROJ-1,PROJ-2
```

---

## Epic Commands (Agile)

### `jc epic list <board-id>`

List epics.

### `jc epic get <key>`

Get epic details.

### `jc epic issues <key>`

List epic issues.

### `jc epic move-issues <key>`

Move issues to epic.

```bash
jc epic move-issues PROJ-100 --issues PROJ-1,PROJ-2
```

### `jc epic remove-issues`

Remove issues from epic.

### `jc epic rank`

Rank/reorder issues.

```bash
jc epic rank --issues PROJ-1,PROJ-2 --before PROJ-3
```

---

## Label Commands

### `jc label list`

List all labels.

---

## Field Commands

### `jc field list`

List fields.

```bash
jc field list
jc field list --custom
jc field list --searchable
```

---

## Filter Commands

### `jc filter list`

List filters.

```bash
jc filter list
jc filter list --favourites
jc filter list -n "my filter"
```

### `jc filter get <id>`

Get filter.

### `jc filter create`

Create filter.

```bash
jc filter create --name "My Bugs" --jql "type = Bug"
```

### `jc filter update <id>`

Update filter.

### `jc filter delete <id>`

Delete filter.

---

## Task Commands (Async Operations)

### `jc task get <taskId>`

Get async task status.

### `jc task cancel <taskId>`

Cancel running task.

---

## Confluence Space Commands

### `jc space list`

List spaces.

```bash
jc space list
jc space list --type personal
```

### `jc space get <id-or-key>`

Get space.

---

## Confluence Page Commands

### `jc page list`

List pages.

```bash
jc page list --space 12345
jc page list --space 12345 --status current
```

### `jc page get <id>`

Get page.

```bash
jc page get 12345
jc page get 12345 --body storage
```

### `jc page create`

Create page.

```bash
jc page create --space 123 --title "My Page" --body "<p>Hello</p>"
jc page create --space 123 --title "My Page" --body-file content.html
```

### `jc page update <id>`

Update page.

```bash
jc page update 12345 --title "New Title" --body "<p>Updated</p>"
```

### `jc page delete <id>`

Delete page.

### `jc page children <id>`

List child pages.

### `jc page comments <id>`

List page comments.

### `jc page comment <id> <text>`

Add comment.

### `jc page labels <id>`

List page labels.

### `jc page add-label <id> <label>`

Add label.
