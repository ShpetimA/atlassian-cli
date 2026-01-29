# Bitbucket CLI (`bb`) Reference

## Global Options

| Option | Description |
|--------|-------------|
| `-f, --format <format>` | Output format: `json`, `plain`, `minimal` (default: `plain`) |
| `-o, --output <file>` | Write output to file |
| `-w, --workspace <workspace>` | Bitbucket workspace (overrides env) |

---

## Repository Commands

### `bb repo list`

List repositories in workspace.

```bash
bb repo list
bb repo list -l 50              # limit to 50
bb repo list -n myrepo          # filter by name
bb repo list -p 2               # page 2
```

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Number of results (default: 10) |
| `-p, --page <n>` | Page number |
| `-n, --name <name>` | Filter by name |

---

## Pull Request Commands

### `bb pr list <repo>`

List pull requests.

```bash
bb pr list my-repo
bb pr list my-repo -s MERGED    # merged PRs
bb pr list my-repo -l 50        # limit 50
```

| Option | Description |
|--------|-------------|
| `-s, --state <state>` | Filter: `OPEN`, `MERGED`, `DECLINED` (default: `OPEN`) |
| `-l, --limit <n>` | Number of results (default: 10) |
| `-p, --page <n>` | Page number |

---

### `bb pr get <repo> <id>`

Get PR details.

```bash
bb pr get my-repo 123
bb pr get my-repo 123 --fields title,state,author
```

| Option | Description |
|--------|-------------|
| `--fields <fields>` | Comma-separated fields to show |

---

### `bb pr diff <repo> <id>`

Get PR diff.

```bash
bb pr diff my-repo 123
bb pr diff my-repo 123 -f src/index.ts   # specific file
bb pr diff my-repo 123 -l 500            # limit lines
bb pr diff my-repo 123 --stat-only       # only stats
```

| Option | Description |
|--------|-------------|
| `-f, --file <path>` | Filter to specific file |
| `-l, --lines <n>` | Limit output lines |
| `--stat-only` | Show only file change stats |

---

### `bb pr comments <repo> <id>`

Get PR comments.

```bash
bb pr comments my-repo 123
bb pr comments my-repo 123 --inline-only
```

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Number of results (default: 20) |
| `-p, --page <n>` | Page number |
| `--inline-only` | Only inline comments |

---

### `bb pr comment <repo> <id> <content>`

Add comment to PR.

```bash
bb pr comment my-repo 123 "LGTM!"
bb pr comment my-repo 123 "Fix this" -f src/index.ts -l 42   # inline
```

| Option | Description |
|--------|-------------|
| `-f, --file <path>` | File path for inline comment |
| `-l, --line <n>` | Line number for inline comment |

---

### `bb pr activity <repo> <id>`

Get PR activity.

```bash
bb pr activity my-repo 123
bb pr activity my-repo 123 -t approval   # only approvals
```

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Number of results (default: 20) |
| `-p, --page <n>` | Page number |
| `-t, --type <type>` | Filter: `approval`, `comment`, `update` |

---

### `bb pr commits <repo> <id>`

Get PR commits.

```bash
bb pr commits my-repo 123
```

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Number of results (default: 20) |

---

### `bb pr add-pending <repo> <id> <content>`

Add draft/pending comment.

```bash
bb pr add-pending my-repo 123 "Draft comment"
bb pr add-pending my-repo 123 "Review" -f src/index.ts -l 10
```

| Option | Description |
|--------|-------------|
| `-f, --file <path>` | File path for inline |
| `-l, --line <n>` | Line in new file |
| `--from <n>` | Line in old file (deletions) |

---

### `bb pr update-comment <repo> <pr-id> <comment-id> <content>`

Update existing comment.

```bash
bb pr update-comment my-repo 123 456 "Updated text"
```

---

### `bb pr delete-comment <repo> <pr-id> <comment-id>`

Delete a comment.

```bash
bb pr delete-comment my-repo 123 456
```

---

### `bb pr resolve-comment <repo> <pr-id> <comment-id>`

Resolve comment thread.

```bash
bb pr resolve-comment my-repo 123 456
```

---

### `bb pr reopen-comment <repo> <pr-id> <comment-id>`

Reopen resolved comment.

```bash
bb pr reopen-comment my-repo 123 456
```
