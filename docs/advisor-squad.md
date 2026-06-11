# MiniMax Code — Advisor Squad

4 especialistas globales que viven en `~/.mavis/agents/<name>/` (no en este repo). El router de Mavis los elige según la pregunta; también puedes forzar.

## TL;DR

| Advisor | Cuándo lo necesitas | Comando típico |
|---|---|---|
| `cron-advisor` | Esperar algo async (CI, MR, humano) | `mavis cron self <name> --every 10m --prompt "..."` |
| `feishu-advisor` | Tocar Lark/Feishu (calendar, IM, docs, base, sheets, mail, drive, tasks, approval, minutes, vc, whiteboard) | `lark-calendar +agenda`, `lark-im +send`, `lark-doc +create` |
| `team-advisor` | Tarea grande → ¿owner solo o plan multi-agente? | `mavis team plan run <yaml>` |
| `skill-advisor` | Flujo repetido 3+ veces → ¿lo paso a skill? | carga `skill-creator` |

## Cuándo NO usar ninguno

- Tarea trivial, 1 archivo, <200 líneas → hazla directo
- Pregunta general / conversación → Mavis (orchestrator) responde
- Bug raro, sesión atorada → `mavis-doctor` skill
- Specs de producto / brainstorming → `/office-hours` o `/grill-me` (gstack)

## Detalles

### `cron-advisor`
- **Scope**: `mavis cron self` para esperas async fuera de team plans
- **Stop**: cron creado y `mavis cron list` lo muestra, O le explicaste al usuario por qué NO necesita cron, O redirigiste porque es un team plan (que ya tiene su propio heartbeat)
- **Anti-pattern**: usar cron para monitorear un `mavis team plan` activo (el motor ya lo hace)

### `feishu-advisor`
- **Scope**: suite completo Lark/Feishu vía `lark-cli` + `lark-tools`
- **Auth**: la primera vez usa `lark-cli config init` + `lark-cli auth login`. Si recibes 401 / `LARK_USER_AUTH_REQUIRED`, sigue el flow del skill
- **Limitación**: **WeChat nativo no soportado**. Si lo piden, explica la limitación y propone alternativa (IM genérico, mail, hook)
- **Stop**: acción ejecutada y confirmada, O auth lista, O redirigiste

### `team-advisor`
- **Scope**: diseñar, lanzar, monitorear `mavis-team` plans. Decide cuándo SÍ (paralelismo real, gates, retries) y cuándo NO (un owner basta)
- **Preflight**: 5 preguntas antes de YAML — final deliverable, por qué team, qué se puede paralelizar, qué agentes/tools, qué cierra el plan
- **Stop**: plan lanzado con `plan_id`, O decisión informada de no usar team, O ciclo cerrado con resumen, O cancel + hacerse cargo

### `skill-advisor`
- **Scope**: `skill-creator` para flujos repetidos. **Anti-pattern**: crear skills por crear
- **Antes de crear**: ¿el flujo se repite 3+ veces? ¿es no trivial? ¿el usuario lo va a volver a necesitar? Si alguna es NO, no es skill
- **Stop**: skill creado en la ruta correcta, eval pasa, `mavis skill list` lo muestra, O redirigiste (cron/hook/team lo resuelven)

## Cómo invocar

- **Automático**: el router de Mavis decide en cada turno
- **Forzado en CLI**: `mavis session new <name> --prompt "<pregunta>"`
- **Forzado en conversación**: "Pregúntale a cron-advisor sobre..."
- **En team plan**: `assigned_to: <name>`

## Costo mental

- 1 pregunta corta sobre un advisor: Mavis la responde sin spawnear
- Pregunta media que requiere ejecutar comandos: spawn corto, ~30–60s
- Pregunta grande o chain de acciones: spawn largo, puede ser team plan

Si dudas si vale la pena spawnear, default: pregunta. El spawn es barato.
