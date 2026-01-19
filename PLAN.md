
# Jira & Confluence CLI Migration Plan

## Overview

Migrating Jira Cloud REST API v3 and Confluence Cloud REST API v2 into CLI format. Single CLI `jc` for both Jira + Confluence. Monorepo with existing `bitbucket-cli`.

## Decisions

| Item | Decision |
|------|----------|
| CLI name | `jc` |
| Package | `jira-cli` (in monorepo) |
| ADF conversion | `marklassian` npm package |
| Agile API | Yes - sprints, boards, epics, backlog |
| Bulk operations | Yes - async task polling |
| Interactive mode | No - AI agent usage |
| Output format | JSON-first for AI agents |
| Auth storage | Config file + env vars |

---

## Project Structure (Monorepo)

```
/
├── bitbucket-cli/          # Existing
│   └── ...
├── jira-cli/               # NEW
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── clients/
│   │   │   ├── jira.ts
│   │   │   ├── jira-agile.ts
│   │   │   └── confluence.ts
│   │   ├── types/
│   │   │   ├── jira.ts
│   │   │   ├── agile.ts
│   │   │   └── confluence.ts
│   │   ├── commands/
│   │   │   ├── issue.ts
│   │   │   ├── project.ts
│   │   │   ├── search.ts
│   │   │   ├── board.ts
│   │   │   ├── sprint.ts
│   │   │   ├── epic.ts
│   │   │   ├── backlog.ts
│   │   │   ├── page.ts
│   │   │   ├── space.ts
│   │   │   ├── config.ts
│   │   │   └── task.ts
│   │   └── utils/
│   │       ├── output.ts
│   │       ├── adf.ts
│   │       └── polling.ts
│   ├── package.json
│   └── tsconfig.json
└── package.json            # Workspace root
```

---

## Configuration

### Config File Location
```
~/.config/jc/config.json    # Linux/macOS
%APPDATA%\jc\config.json    # Windows
```

### Config Schema
```json
{
  "profiles": {
    "default": {
      "domain": "mycompany",
      "email": "user@example.com",
      "apiToken": "ATATT3x..."
    },
    "work": {
      "domain": "workcompany",
      "email": "work@company.com",
      "apiToken": "ATATT3y..."
    }
  },
  "defaults": {
    "profile": "default",
    "project": "PROJ",
    "space": "DOCS",
    "format": "json"
  }
}
```

### Environment Variables
```bash
JIRA_DOMAIN=your-domain
JIRA_EMAIL=user@example.com
JIRA_API_TOKEN=ATATT3x...
JIRA_PROJECT=PROJ
CONFLUENCE_SPACE=DOCS
```

### Auth Resolution Order
1. CLI flags (`--domain`, `--email`, `--token`)
2. Environment variables
3. Config file (active profile)

---

## API Endpoints

### Jira REST API v3
Base: `https://{domain}.atlassian.net/rest/api/3`

### Jira Software Agile API
Base: `https://{domain}.atlassian.net/rest/agile/1.0`

### Confluence REST API v2
Base: `https://{domain}.atlassian.net/wiki/api/v2`

---

## Commands Reference

### Issue Management (P0)

| Command | API | Description |
|---------|-----|-------------|
| `jc issue list` | `POST /search/jql` | List issues via JQL |
| `jc issue get <key>` | `GET /issue/{key}` | Get issue details |
| `jc issue create` | `POST /issue` | Create issue |
| `jc issue edit <key>` | `PUT /issue/{key}` | Update issue |
| `jc issue delete <key>` | `DELETE /issue/{key}` | Delete issue |
| `jc issue assign <key> <user>` | `PUT /issue/{key}/assignee` | Assign issue |
| `jc issue transitions <key>` | `GET /issue/{key}/transitions` | List transitions |
| `jc issue transition <key> <status>` | `POST /issue/{key}/transitions` | Transition issue |
| `jc issue bulk-create` | `POST /issue/bulk` | Bulk create |
| `jc issue archive` | `POST /issue/archive` | Archive issues (async) |

### Issue Comments (P0)

| Command | API | Description |
|---------|-----|-------------|
| `jc issue comments <key>` | `GET /issue/{key}/comment` | List comments |
| `jc issue comment <key> <text>` | `POST /issue/{key}/comment` | Add comment |
| `jc issue comment-edit <key> <id>` | `PUT /issue/{key}/comment/{id}` | Edit comment |
| `jc issue comment-delete <key> <id>` | `DELETE /issue/{key}/comment/{id}` | Delete comment |

### Search (P0)

| Command | API | Description |
|---------|-----|-------------|
| `jc search <jql>` | `POST /search/jql` | Search issues |
| `jc search count <jql>` | `POST /search/approximate-count` | Count results |

### Projects (P1)

| Command | API | Description |
|---------|-----|-------------|
| `jc project list` | `GET /project/search` | List projects |
| `jc project get <key>` | `GET /project/{key}` | Get project |
| `jc project statuses <key>` | `GET /project/{key}/statuses` | List statuses |
| `jc project components <key>` | `GET /project/{key}/components` | List components |
| `jc project versions <key>` | `GET /project/{key}/versions` | List versions |

### Issue Links (P1)

| Command | API | Description |
|---------|-----|-------------|
| `jc issue link <key1> <key2> <type>` | `POST /issueLink` | Create link |
| `jc issue links <key>` | embedded in issue | Get links |
| `jc issue link-types` | `GET /issueLinkType` | List link types |

### Labels & Fields (P1)

| Command | API | Description |
|---------|-----|-------------|
| `jc labels` | `GET /label` | List labels |
| `jc fields` | `GET /field` | List fields |
| `jc issue add-label <key> <label>` | `PUT /issue/{key}` | Add label |

### Watchers & Votes (P2)

| Command | API | Description |
|---------|-----|-------------|
| `jc issue watch <key>` | `POST /issue/{key}/watchers` | Watch issue |
| `jc issue unwatch <key>` | `DELETE /issue/{key}/watchers` | Unwatch |
| `jc issue watchers <key>` | `GET /issue/{key}/watchers` | List watchers |
| `jc issue vote <key>` | `POST /issue/{key}/votes` | Vote |

### Worklogs (P2)

| Command | API | Description |
|---------|-----|-------------|
| `jc issue worklogs <key>` | `GET /issue/{key}/worklog` | List worklogs |
| `jc issue worklog <key>` | `POST /issue/{key}/worklog` | Add worklog |

### Attachments (P2)

| Command | API | Description |
|---------|-----|-------------|
| `jc issue attach <key> <file>` | `POST /issue/{key}/attachments` | Add attachment |
| `jc issue attachments <key>` | embedded in issue | List attachments |

### Filters (P2)

| Command | API | Description |
|---------|-----|-------------|
| `jc filter list` | `GET /filter/search` | List filters |
| `jc filter get <id>` | `GET /filter/{id}` | Get filter |
| `jc filter create` | `POST /filter` | Create filter |

---

## Agile Commands

### Boards (P0)

| Command | API | Description |
|---------|-----|-------------|
| `jc board list` | `GET /board` | List boards |
| `jc board get <id>` | `GET /board/{id}` | Get board |
| `jc board issues <id>` | `GET /board/{id}/issue` | Board issues |
| `jc board backlog <id>` | `GET /board/{id}/backlog` | Backlog issues |
| `jc board config <id>` | `GET /board/{id}/configuration` | Board config |

### Sprints (P0)

| Command | API | Description |
|---------|-----|-------------|
| `jc sprint list <board-id>` | `GET /board/{id}/sprint` | List sprints |
| `jc sprint get <id>` | `GET /sprint/{id}` | Get sprint |
| `jc sprint issues <id>` | `GET /sprint/{id}/issue` | Sprint issues |
| `jc sprint create <board-id>` | `POST /sprint` | Create sprint |
| `jc sprint start <id>` | `POST /sprint/{id}` | Start sprint |
| `jc sprint close <id>` | `POST /sprint/{id}` | Close sprint |
| `jc sprint move-issues <id>` | `POST /sprint/{id}/issue` | Move issues |

### Epics (P1)

| Command | API | Description |
|---------|-----|-------------|
| `jc epic list <board-id>` | `GET /board/{id}/epic` | List epics |
| `jc epic get <key>` | `GET /epic/{key}` | Get epic |
| `jc epic issues <key>` | `GET /epic/{key}/issue` | Epic issues |
| `jc epic move-issues <key>` | `POST /epic/{key}/issue` | Add to epic |
| `jc epic remove-issues` | `POST /epic/none/issue` | Remove from epic |

### Backlog (P1)

| Command | API | Description |
|---------|-----|-------------|
| `jc backlog issues <board-id>` | `GET /board/{id}/backlog` | View backlog |
| `jc backlog move <board-id>` | `POST /backlog/{id}/issue` | Move to backlog |
| `jc backlog rank` | `PUT /issue/rank` | Reorder |

### Reports (P2)

| Command | API | Description |
|---------|-----|-------------|
| `jc board velocity <id>` | `GET /board/{id}/reports/velocity` | Velocity |
| `jc board burndown <sprint-id>` | `GET /board/{id}/reports/burndown` | Burndown |

---

## Confluence Commands

### Pages (P0)

| Command | API | Description |
|---------|-----|-------------|
| `jc page list --space <key>` | `GET /pages` | List pages |
| `jc page get <id>` | `GET /pages/{id}` | Get page |
| `jc page create` | `POST /pages` | Create page |
| `jc page update <id>` | `PUT /pages/{id}` | Update page |
| `jc page delete <id>` | `DELETE /pages/{id}` | Delete page |
| `jc page children <id>` | `GET /pages/{id}/children` | Child pages |
| `jc page search <query>` | CQL search | Search pages |

### Spaces (P1)

| Command | API | Description |
|---------|-----|-------------|
| `jc space list` | `GET /spaces` | List spaces |
| `jc space get <key>` | `GET /spaces/{id}` | Get space |
| `jc space create` | `POST /spaces` | Create space |

### Page Comments (P1)

| Command | API | Description |
|---------|-----|-------------|
| `jc page comments <id>` | `GET /pages/{id}/footer-comments` | List comments |
| `jc page comment <id> <text>` | `POST /footer-comments` | Add comment |

### Labels (P2)

| Command | API | Description |
|---------|-----|-------------|
| `jc page labels <id>` | `GET /pages/{id}/labels` | List labels |
| `jc page add-label <id> <label>` | `POST /pages/{id}/labels` | Add label |

### Blog Posts (P2)

| Command | API | Description |
|---------|-----|-------------|
| `jc blog list --space <key>` | `GET /blogposts` | List posts |
| `jc blog create` | `POST /blogposts` | Create post |

---

## Config Commands

| Command | Description |
|---------|-------------|
| `jc config init` | Initialize config file |
| `jc config set <key> <value>` | Set value |
| `jc config get <key>` | Get value |
| `jc config list` | Show config |
| `jc config profile <name>` | Switch profile |

---

## Task Commands (Async Operations)

| Command | API | Description |
|---------|-----|-------------|
| `jc task get <id>` | `GET /task/{id}` | Get task status |
| `jc task cancel <id>` | `POST /task/{id}/cancel` | Cancel task |

---

## Global Options

```
--format json|plain|minimal   Output format (default: json)
--output <file>               Write to file
--project <key>               Default project
--profile <name>              Config profile
--domain <domain>             Jira domain override
--debug                       Show HTTP requests
-l, --limit <n>               Results limit
-p, --page <n>                Page number
```

---

## CLI Examples

### Issues
```bash
# List open bugs in sprint
jc issue list --jql "project = PROJ AND type = Bug AND sprint in openSprints()" -l 50

# Create story
jc issue create --project PROJ --type Story --summary "User login" \
  --description "As a user..." --priority Medium --labels feature,auth

# Transition to Done
jc issue transition PROJ-123 Done

# Assign issue
jc issue assign PROJ-123 user@example.com
```

### Sprints
```bash
# List active sprints
jc sprint list 42 --state active

# Move issues to sprint
jc sprint move-issues 123 --issues PROJ-1,PROJ-2,PROJ-3

# Start sprint
jc sprint start 123 --start-date 2024-01-15 --end-date 2024-01-29
```

### Confluence
```bash
# Create PRD page
jc page create --space PROD --title "Feature: Login" \
  --parent-id 12345 --body "## Overview\n..."

# Update from file
jc page update 67890 --body-file ./prd.md
```

### Bulk Operations
```bash
# Archive old issues (async with polling)
jc issue archive --jql "project = OLD AND updated < -2y" --wait

# Without --wait returns task ID
jc issue archive --jql "project = OLD"
# Output: { "taskId": "10042", "status": "ENQUEUED" }

# Check manually
jc task get 10042
```

---

## Implementation Plan

### Phase 1: Core + Config ✅
- [x] Project setup in monorepo
- [x] Dependencies: commander, axios (marklassian deferred to Phase 2)
- [x] Config file management
- [x] JiraClient with auth
- [x] `jc issue list` / `jc issue get`
- [x] JSON output

### Phase 2: Issue CRUD + ADF ✅
- [x] `jc issue create/edit/delete`
- [x] `jc issue assign`
- [x] `jc issue transitions/transition`
- [x] `jc issue comments/comment`
- [ ] marklassian integration (deferred - raw ADF works)

### Phase 3: Agile - Boards & Sprints ✅
- [x] JiraAgileClient
- [x] `jc board list/get/issues/backlog`
- [x] `jc sprint list/get/issues/create/start/close`
- [x] `jc sprint move-issues`

### Phase 4: Agile - Epics & Backlog ✅
- [x] `jc epic list/get/issues/move-issues`
- [x] `jc epic remove-issues`
- [x] `jc epic rank` (backlog ranking)
- [ ] Velocity/burndown reports (P2, deferred)

### Phase 5: Comments, Search, Bulk
- [x] `jc issue comments/comment` (moved to Phase 2)
- [x] `jc search <jql>`
- [x] `jc search count` (approximate count)
- [ ] Async task polling
- [ ] `jc issue archive`

### Phase 6: Confluence ✅
- [x] ConfluenceClient
- [x] `jc page list/get/create/update/delete`
- [x] `jc space list/get`
- [x] Page comments + labels

### Phase 7: Polish
- [x] Projects (list/get/statuses/components/versions)
- [x] Issue Links (link, links, link-types, unlink)
- [x] Labels & Fields (label list, field list, issue add-label/remove-label)
- [x] Filters (list, get, create, update, delete)
- [ ] Worklogs, attachments, watchers
- [ ] Error handling, retry
- [ ] README, examples

---

## Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "axios": "^1.6.0",
    "marklassian": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## Type Definitions (Key Types)

### Jira Issue
```typescript
interface Issue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description: ADF | null;
    status: { name: string; id: string };
    priority: { name: string; id: string };
    issuetype: { name: string; id: string };
    project: { key: string; id: string; name: string };
    assignee: User | null;
    reporter: User;
    labels: string[];
    created: string;
    updated: string;
    resolution: { name: string } | null;
    // Custom fields: customfield_XXXXX
  };
}
```

### Agile Sprint
```typescript
interface Sprint {
  id: number;
  self: string;
  state: 'future' | 'active' | 'closed';
  name: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
  originBoardId: number;
}
```

### Confluence Page
```typescript
interface Page {
  id: string;
  title: string;
  spaceId: string;
  status: 'current' | 'draft' | 'trashed';
  body: {
    storage?: { representation: string; value: string };
    atlas_doc_format?: { representation: string; value: string };
  };
  version: { number: number; createdAt: string };
  parentId?: string;
}
```

---

## ADF (Atlassian Document Format)

Using `marklassian` for markdown ↔ ADF conversion:

```typescript
import { markdownToAdf, adfToMarkdown } from 'marklassian';

// Input: convert markdown to ADF for API
const adf = markdownToAdf('## Hello\n\nWorld');

// Output: convert ADF to markdown for display
const md = adfToMarkdown(issue.fields.description);
```
