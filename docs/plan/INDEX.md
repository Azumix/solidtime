# Historique des changements

### 23-11-2026 — Serveur MCP solidtime `major`
Saisir du temps dans solidtime se faisait à la main ; on veut que Claude puisse ajouter, découper et corriger des temps, et logger la durée d'une session de travail en une phrase.
Un serveur MCP en TypeScript (`mcp/`) passe par l'API REST de l'instance avec un token personnel et calcule la durée d'une session Claude (brute et active) depuis son transcript ; tests de fumée inclus.
→ [major/solidtime_mcp_november_2026](major/solidtime_mcp_november_2026/)
