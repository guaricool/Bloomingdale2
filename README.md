# Bloomingdale 2 — Plataforma Comunitaria

Plataforma para la Rama Bloomingdale 2 de La Iglesia de Jesucristo de los Santos de los Últimos Días.
Posts, calendario, agenda dominical, escuela dominical, himnos y registro familiar — todo en español.

## Estado

v0.1 — bootstrap fundacional. Estructura del proyecto + auth + DB + himnos seedeados. Los módulos de
Miembros / Agendas / Eventos / Administración se llenan en las siguientes tareas del plan.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** para todo el styling
- **SQLite** vía **better-sqlite3** (archivo local, sin servidor de DB)
- **Auth.js (NextAuth v5)** con credentials provider y sesiones JWT
- **bcryptjs** para hashing de contraseñas
- **zod** para validación de entrada
- **date-fns** + **date-fns-tz** para manejo de fechas / zona horaria

## Requisitos

- Node.js 18+ (probado con Node 24)
- npm 9+ (probado con npm 11)
- Windows, macOS o Linux. La DB es un archivo `.db` local — no requiere instalación extra.

## Setup rápido

```bash
# 1) Instalar dependencias
npm install

# 2) Configurar variables de entorno (la primera vez)
cp .env.example .env.local
# Edita .env.local y genera un NEXTAUTH_SECRET:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 3) Crear la base de datos y poblarla con los himnos
npm run db:migrate    # crea las 8 tablas
npm run db:seed       # inserta los himnos (209/341; el resto queda como TODO para v0.2)

# 4) Arrancar el servidor de desarrollo
npm run dev
# → http://localhost:3000
```

Si querés resetear la base de datos local (borrar archivo y correr migrate + seed de nuevo):

```bash
npm run db:reset
```

## Primer administrador

El **primer usuario** que se registra a través de `/register` queda automáticamente con rol `admin`.
Los usuarios subsecuentes quedan con rol `member`. El admin puede promover a otros desde la sección
de Administración (próximamente).

Para crear el primer admin en una instalación limpia:

1. Abrí `http://localhost:3000/register` en el navegador
2. Llená nombre, correo y contraseña (mín. 8 caracteres)
3. El sistema te loguea y te redirige a `/dashboard`

## Scripts

| Script              | Qué hace |
|---------------------|----------|
| `npm run dev`       | Servidor de desarrollo en `http://localhost:3000` |
| `npm run build`     | Build de producción |
| `npm run start`     | Sirve el build de producción |
| `npm run lint`      | ESLint con la config de Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate`| Aplica migraciones SQL en `db/migrations/` (idempotente) |
| `npm run db:seed`   | Puebla la tabla `Hymn` con los himnos en español |
| `npm run db:reset`  | Borra la DB local, vuelve a migrar y seedear |

## Estructura del proyecto

```
.
├── app/                       # Next.js App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handlers
│   │   ├── health/route.ts               # GET /api/health → {ok:true}
│   │   └── register/route.ts             # POST /api/register
│   ├── dashboard/page.tsx     # /dashboard (requiere login)
│   ├── login/page.tsx         # /login
│   ├── register/page.tsx      # /register
│   ├── globals.css            # Tailwind directives
│   ├── layout.tsx             # Root layout: navbar + footer
│   └── page.tsx               # / → redirect a /dashboard o /login
├── auth.config.ts             # NextAuth config Edge-safe (middleware)
├── auth.ts                    # NextAuth config completa (Node, con DB)
├── components/
│   └── Navbar.tsx             # Navbar superior con rol-aware Admin link
├── db/
│   ├── migrations/
│   │   └── 0001_init.sql      # DDL de las 8 tablas
│   ├── hymns-data.ts          # 209 himnos seedeados (auto-generado)
│   └── schema.sql             # DDL generado por db:migrate
├── docs/
│   └── spec/v0.1-mvp.md       # Spec funcional de la v0.1
├── lib/
│   └── db.ts                  # Singleton better-sqlite3
├── middleware.ts              # Protege /dashboard, /miembros, /agendas, /eventos, /admin
├── scripts/
│   ├── db-migrate.ts          # Runner de migraciones
│   ├── db-seed.ts             # Seeder de himnos (idempotente)
│   ├── db-reset.ts            # Borra DB + migrate + seed
│   └── hymns-fetch.ts         # Auto-fetch desde churchofjesuschrist.org (opcional)
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Privacidad y datos sensibles

Este proyecto maneja datos de miembros (números de miembro, grupos familiares, asistencia).
**Reglas duras** — ver `AGENTS.md`:

- No commitear `.env`, tokens, ni member numbers reales
- Fixtures, seeds, mocks, ejemplos: solo datos sintéticos
- Cualquier export o log que toque datos reales va a storage cifrado, no al repo

## TODO (v0.2)

- [ ] Completar los himnos 210-341 (actualmente hay 209/341)
- [ ] Módulo de Miembros (CRUD)
- [ ] Módulo de Agendas (CRUD con validación de domingo)
- [ ] Módulo de Eventos
- [ ] Tracking de discursos
- [ ] Tab "Administración" (separado del dashboard)
- [ ] Promover a otro usuario a admin
