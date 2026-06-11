# Bloomingdale 2nd Branch — Plataforma Comunitaria

Plataforma para la Rama Bloomingdale 2 de La Iglesia de Jesucristo de los Santos de los Últimos Días.
Posts, calendario, agenda dominical, escuela dominical, himnos y registro familiar — todo en español.

## Estado

En fase de descubrimiento / pre-MVP. La primera sesión de Office Hours define el alcance y la pila.

## Estructura del repo

- `AGENTS.md` — convenciones del proyecto para AI agents
- `docs/advisor-squad.md` — referencia rápida del squad de MiniMax Code
- `app/` — código de la aplicación (estructura por definir tras Office Hours)
- `docs/decisions/` — ADRs de las decisiones grandes

## Privacidad y datos sensibles

Este proyecto maneja datos de miembros (números de miembro, grupos familiares, asistencia).
**Reglas duras** — ver `AGENTS.md`:

- No commit `.env`, tokens, ni member numbers reales
- Fixtures, seeds, mocks, ejemplos: solo datos sintéticos
- Cualquier export o log que toque datos reales va a storage cifrado, no al repo
