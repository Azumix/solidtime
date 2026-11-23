# solidtime MCP server

MCP server (stdio) that lets Claude read and write time entries on the local solidtime instance through its REST API.

## Setup

1. In solidtime: Profile Settings -> API tokens -> create a token and copy it.
2. `cp .env.example .env` and fill in `SOLIDTIME_API_TOKEN` (and `SOLIDTIME_URL` if not `http://localhost:8080`).
   Optional: `SOLIDTIME_ORGANIZATION_ID` (required if you belong to several organizations),
   `SOLIDTIME_TIMEZONE` (default `Europe/Paris`), `CLAUDE_PROJECTS_DIR` (default `/mnt/c/Users/elaffineur/.claude/projects`).
   Environment variables override `.env`.
3. `npm install && npm run build`
4. Register in Claude Code:

```
claude mcp add solidtime -- wsl -d FedoraLinux-45 -- node /home/elaffineur/dev/solidtime/mcp/dist/index.js
```

## Tools

whoami, list_projects, list_tasks, list_tags, list_time_entries, create_time_entry, update_time_entry,
delete_time_entry, split_time_entry, get_claude_session_window, log_claude_session.

Dates in: ISO 8601 with offset, or naive local time. Dates out: local time. Projects, tasks and tags can be given by ID or name.
