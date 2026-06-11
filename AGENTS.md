# AGENTS.md

Convenciones para AI agents que trabajen en este repo. Consumido por Mavis, codex, cursor, aider, devin, gemini-cli, etc.

## Project context

- **Qué es**: plataforma comunitaria para una rama pequeña de La Iglesia de Jesucristo de los Santos de los Últimos Días
- **Audiencia**: miembros de la rama (≈30–80 personas) y liderazgo (presidente, 1er/2do consejero, secretario)
- **Idioma de la UI**: español. Mensajes de commit, code identifiers, comandos CLI: en su forma natural
- **Privacidad**: datos sensibles de miembros. **No PII en commits, fixtures, seeds, ni logs**

## Squad de MiniMax Code

Este repo se trabaja con 4 advisors globales. Ver `docs/advisor-squad.md` para el detalle.

| Advisor | Routea cuando... |
|---|---|
| `cron-advisor` | necesito esperar async (CI, MR, humano) |
| `feishu-advisor` | toco Lark/Feishu (calendar, IM, docs, base, sheets, mail, etc.) |
| `team-advisor` | tarea grande → ¿owner solo o team plan? |
| `skill-advisor` | flujo repetido 3+ veces → ¿lo paso a skill? |

El router de Mavis los elige automáticamente. Para forzar: `mavis session new <name> --prompt "..."`.

## Working rules

- **Branch principal** (`main`) está protegido. Trabajo en worktrees `wt/<id>`. Push a `origin` solo cuando el usuario lo pida o después de review
- **Commits**:
  - Producto / docs / decisiones: mensaje en español
  - Tooling / config / CI: en inglés
  - Formato: `<tipo>: <descripción corta en imperativo>`
- **Decisiones grandes** (stack, auth, hosting, modelo de datos): ADR en `docs/decisions/NNN-slug.md`
- **Privacidad**:
  - `.env`, tokens, member numbers reales: **NUNCA al repo**
  - Tests, fixtures, mocks, ejemplos: **datos sintéticos únicamente**
  - Antes de cada `git add`, escanear: `git diff --staged | grep -E "(\.env|member.?number|MRN)"` (mental)
- **No reinventes la rueda**:
  - Himnos y lecciones "Ven, sígueme" vienen de `churchofjesuschrist.org` — no scrapees ni dupliques, mejor linkea / embebe la fuente oficial
  - Antes de crear un componente, mira si ya existe en el ecosistema LDS o en Mavis (skills/agents)

## Tools disponibles (MCP)

- `web_search` — investigar referencias externas (churchofjesuschrist.org, etc.)
- `webfetch` — leer páginas específicas (himnos, lecciones, manuales)
- `playwright` — QA / E2E
- `matrix_generate_image` — mockups UI
- `matrix_search_images` — referencia visual
- `matrix_transcribe_audio` — audio de discursos / clases

## Convenciones técnicas (provisionales)

- **Stack**: por definir. Discusión en Office Hours
- **Package manager**: por definir
- **Testing**: vitest (unit) + playwright (E2E) — si la pila lo soporta
- **Lint/format**: prettier + eslint (configurar al definir stack)
- **Naming**:
  - Variables, funciones, archivos: inglés
  - Strings de UI, copy, mensajes al usuario: español
  - Comentarios: español si son de producto, inglés si son técnicos
