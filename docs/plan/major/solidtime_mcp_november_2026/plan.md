# MCP solidtime — plan (mode Tooling)

## Problème

Saisir du temps dans solidtime se fait à la main dans l'interface. On veut que Claude puisse le faire directement :
ajouter une entrée, la découper en deux (split), et, en fin de session de travail avec Claude, logger la durée de
la session sur un projet en une phrase (« vas-y, log ça sur solidtime »).

## Approche

Un serveur MCP en TypeScript (stdio, `@modelcontextprotocol/sdk`) dans `mcp/` du fork, qui parle à l'API REST
`/api/v1` de l'instance locale avec un token API personnel (créé dans *Profile Settings → API tokens*).

- Exécution : `wsl -d FedoraLinux-45 -- node ~/dev/solidtime/mcp/dist/index.js`, déclaré dans la config MCP de
  Claude Code. Config dans `mcp/.env` (non versionné) : `SOLIDTIME_URL`, `SOLIDTIME_API_TOKEN`,
  `SOLIDTIME_ORGANIZATION_ID` (facultatif, sinon l'organisation courante de l'utilisateur).
- Toutes les dates vers l'API en UTC au format `Y-m-d\TH:i:s\Z` ; en entrée, le MCP accepte de l'ISO 8601 avec
  fuseau et affiche en heure locale (Europe/Paris).
- `billable` n'est pas déduit par l'API : le MCP reprend `is_billable` du projet, comme le fait l'app web.

### Outils exposés

| Outil | Rôle | Appels API |
|---|---|---|
| `whoami` | utilisateur, organisation et `member_id` courants | `GET users/me`, `GET users/me/memberships` |
| `list_projects` / `list_tasks` / `list_tags` | retrouver les IDs à partir de noms | `GET .../projects`, `tasks`, `tags` |
| `list_time_entries` | entrées sur une période | `GET .../time-entries?start&end&member_id` |
| `create_time_entry` | ajouter un temps (start + end, ou start + durée) | `POST .../time-entries` |
| `update_time_entry` / `delete_time_entry` | corriger ou supprimer | `PUT` / `DELETE .../time-entries/{id}` |
| `split_time_entry` | couper une entrée à une heure donnée (ou en N parts égales) : l'originale est raccourcie, la ou les nouvelles reprennent projet, tâche, tags, description et billable | `PUT` + `POST` |
| `get_claude_session_window` | début, fin et durée de la session Claude en cours, lus dans le transcript `~/.claude/projects/*/<session_id>.jsonl` | lecture de fichier |
| `log_claude_session` | crée l'entrée de temps correspondant à la session | `POST .../time-entries` |

### Durée d'une session Claude

`session_id` vient de la variable `CLAUDE_CODE_SESSION_ID`, que Claude passe à l'outil. Le serveur lit les
`timestamp` du transcript et calcule :
- la durée **brute** (premier message → maintenant) ;
- la durée **active**, en retirant les trous de plus de 15 minutes (pauses, reboot…), réglable par paramètre.

Claude montre les deux et demande laquelle logger, sur quel projet et avec quelle description, avant d'écrire.
Une session qui a tourné en continu peut être loggée en une entrée (début → fin) ; une session avec des trous
peut l'être en plusieurs entrées (une par plage active) — option `split_on_gaps`.

## Fichiers visés

- `mcp/package.json`, `mcp/tsconfig.json`, `mcp/.env.example`, `mcp/README.md`
- `mcp/src/index.ts` (déclaration des outils), `mcp/src/api.ts` (client HTTP), `mcp/src/session.ts`
  (lecture du transcript), `mcp/src/time.ts` (conversion de dates, split)
- `mcp/tests/` : test de fumée (calcul de durée sur un transcript fictif, split, appel `whoami` contre
  l'instance locale)

Aucune modification du code de solidtime lui-même.
