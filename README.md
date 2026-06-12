# Bloomingdale 2 — Plataforma Comunitaria SUD

Plataforma completa para la Rama Bloomingdale 2 de La Iglesia de Jesucristo de los Santos de los Últimos Días.

**Módulos implementados:** Autenticación, Miembros, Agendas sacramentales, Eventos, Administración.

---

## 📊 Estado actual (Junio 2026)

**v0.1-full** — Funcionalidad completa de agenda sacramental con interfaz amigable para no técnicos.

### ✅ Logrado en la última sesión de desarrollo

#### Sistema de Agenda Sacramental
- **Template automático** al crear agenda nueva (6 items predefinidos):
  - 1️⃣ Himno de Apertura (con hint)
  - 2️⃣ Oración de apertura
  - 3️⃣ Himno de la Santa Cena (hint: rango 101-120)
  - 4️⃣ Himno Intermedio **(opcional)**
  - 5️⃣ Himno de Cierre (con hint)
  - 6️⃣ Oración de cierre

#### Selección de Himnos
- `InlineHymnPicker` — buscador compacto integrado en cada slot
- Búsqueda por número o título en tiempo real
- Hints de la **Guía oficial del himnario** (pág. 273):
  - Apertura: "Loor, agradecimiento o súplica. Ej: himnos 30–47"
  - Santa Cena: "Tema de la Santa Cena o el sacrificio expiatorio. Ej: himnos 101–120"
  - Intermedio: "Puede relacionarse con el tema de los discursos"
  - Cierre: "Permite a la congregación responder a la reunión"

#### Modal de Himnos (UX No-Técnicos)
- Se queda abierto en Bloomingdale (no cierra la app)
- Abre letra en **pestaña nueva** de churchofjesuschrist.org
- Instrucciones de **3 pasos claros:**
  1. "Presiona el botón azul de abajo"
  2. "Lee el himno en la página de la Iglesia"
  3. **"Para regresar aquí, cierra esa pestaña ✕"** (destacado)
- Integrado en: agenda pública, tarjeta de domingo, landing

#### Miembros Mejorados
- Campo **`middleName`** (segundo nombre) integrado:
  - Registro: 3 campos (Primer nombre | Segundo nombre **opcional** | Apellido)
  - Nombres completos consistentes en: navbar, admin, agendas, oraciones, discursos
  - BD: columna `middleName TEXT NULL` en tabla `Member`
  - Código: tipos actualizados en `MemberRow`, `RawMember`, todas las queries

#### Fixes Críticos de Base de Datos
1. **Session JWT:** `user.id` ahora se pasa correctamente
   - Antes: `token.sub` no llegaba a `session.user.id` → "Sesión inválida"
   - Ahora: Callback `session({ token })` explícitamente asigna `session.user.id = token.sub`

2. **Camel case en Postgres:** Todas las queries con aliases explícitos
   ```sql
   SELECT firstName AS "firstName",
          middleName AS "middleName",
          lastName AS "lastName"
   FROM "Member"
   ```
   Esto previene bugs donde Postgres devuelve `{firstname}` en lugar de `{firstName}`

3. **Eliminado último `SELECT *`:** `lib/agenda/members.ts:79` → reemplazado con campos explícitos

4. **Validación Zod completa:** `memberBaseSchema` y `memberQuickCreateSchema` incluyen `middleName`

#### Build & TypeScript
- ✅ `npx tsc --noEmit` — **0 errores**
- ✅ `npx next build` — **Compiled successfully** (19 páginas)
- ✅ ESLint — solo warnings menores (accesibilidad, no críticos)
- ✅ Typecheck en CI/CD listo

---

## 🛠️ Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** para styling (tema azul/slate/red/sky)
- **PostgreSQL** (Supabase en producción) + **SQLite** (`better-sqlite3` en dev)
- **Auth.js (NextAuth v5)** con JWT sessions
- **Zod** para validación de entrada
- **date-fns** + **date-fns-tz** para fechas y zonas horarias

---

## 📋 Requisitos

- Node.js 18+ (probado con Node 24)
- npm 9+ (probado con npm 11)
- Windows, macOS o Linux

---

## 🚀 Setup rápido

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Variables de entorno
```bash
cp .env.example .env.local
```

Edita `.env.local` y genera `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3️⃣ Base de datos local
```bash
npm run db:migrate    # Crea 9 tablas (idempotente)
npm run db:seed       # Puebla 209 himnos
```

### 4️⃣ Desarrollo
```bash
npm run dev           # http://localhost:3000
```

### Resetear todo
```bash
npm run db:reset      # Borra DB + migrate + seed
```

---

## 👤 Primer login

1. Abre `http://localhost:3000/registro`
2. Completa: Nombre, Apellido, Correo, Contraseña (8+ caracteres)
3. **Automáticamente rol `admin`** en primera cuenta
4. Accede a:
   - `/inicio` — Dashboard personal
   - `/admin/agendas` — Crear y editar agendas sacramentales
   - `/miembros` — Ver miembros registrados
   - `/agendas` — Ver agenda pública (si publicada)

---

## 📚 Scripts

| Script | Función |
|--------|---------|
| `npm run dev` | Servidor desarrollo (http://localhost:3000) |
| `npm run build` | Build producción |
| `npm run start` | Sirve build producción |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Migraciones SQL (idempotente) |
| `npm run db:seed` | Puebla tabla `Hymn` con 209 himnos |
| `npm run db:reset` | Borra DB + migrate + seed (dev only) |

---

## 📁 Estructura del proyecto

```
bloomingdale2/
├── app/
│   ├── admin/
│   │   ├── agendas/[id]/editar/page.tsx    # Editor con 6 slots predefinidos
│   │   ├── eventos/
│   │   ├── miembros/
│   │   └── grupos-familiares/
│   ├── api/
│   │   ├── agendas/                        # CRUD + transiciones (borrador → publicado)
│   │   ├── auth/[...nextauth]/             # NextAuth handlers
│   │   ├── eventos/
│   │   ├── himnos/buscar                   # GET /api/himnos/buscar?q=...
│   │   ├── members/
│   │   └── register/
│   ├── agendas/
│   │   ├── [id]/page.tsx                   # Vista pública (con HymnModal)
│   │   ├── [id]/AgendaPublicView.tsx       # Client component
│   │   ├── hoy/                            # Agenda de hoy
│   │   └── page.tsx
│   ├── iniciar-sesion/                     # Login
│   ├── registro/                           # Signup (3 campos de nombre)
│   ├── inicio/                             # Dashboard
│   ├── miembros/
│   ├── eventos/
│   ├── globals.css                         # Tailwind directives
│   ├── layout.tsx                          # Root layout + navbar
│   └── page.tsx                            # Redirect a /inicio o /iniciar-sesion

components/
├── HymnModal.tsx                           # Modal amigable para no técnicos
├── Navbar.tsx                              # Con rol-aware links
├── SundayAgendaCard.tsx                    # Tarjeta domingo próximo + HymnModal
├── admin/agendas/
│   ├── AgendaEditor.tsx                    # Editor con InlineHymnPicker
│   ├── HymnAutocomplete.tsx                # Búsqueda autocomplete
│   ├── InlineHymnPicker.tsx                # Selector compacto integrado
│   └── SpeakerPicker.tsx
├── ui/
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── Spinner.tsx
│   └── ... (otros componentes reutilizables)
└── ... (otros componentes)

lib/
├── agenda/
│   ├── hymns.ts                            # searchHymns() con camelCase aliases
│   ├── members.ts                          # getMemberById(), createMember() con middleName
│   ├── queries.ts                          # CRUD de agendas, items, transiciones
│   ├── types.ts                            # MemberRow, AgendaWithItems, HymnRow, etc.
│   ├── validations.ts                      # Zod schemas
│   └── dates.ts                            # Helpers de fecha/zona horaria
├── auth.ts                                 # NextAuth config con session callback
├── authz.ts                                # requireAdmin(), requireSessionForPage()
├── db.ts                                   # Singleton de DB
└── validators/member.ts                    # memberBaseSchema (firstName, middleName, lastName)

db/
├── migrations/0001_init.sql                # DDL de 9 tablas
├── postgres-schema.sql                     # Schema Supabase
├── hymns-data.ts                           # 209 himnos (auto-generado)
└── hymns-seed.sql                          # INSERT UPSERT de himnos (corregido)

auth.config.ts                              # NextAuth edge-safe config
auth.ts                                     # NextAuth full config (Node)
middleware.ts                               # Protege rutas

scripts/
├── db-migrate.ts                           # Runner migraciones
├── db-seed.ts                              # Seeder himnos
├── db-reset.ts                             # Borra DB + migrate + seed
└── hymns-fetch.ts                          # Auto-fetch himnos (opcional)

.env.example
.env.local (no commiteado)
package.json
tsconfig.json
tailwind.config.js
next.config.js
```

---

## 🗄️ Base de datos

### Tablas principales

| Tabla | Descripción |
|-------|------------|
| `User` | Usuarios (email, passwordHash, role: admin/member) |
| `Member` | Miembros (firstName, **middleName**, lastName, membershipNumber, familyGroupId) |
| `FamilyGroup` | Grupos familiares (headMemberId, nombre) |
| `Agenda` | Agendas dominicales (date, status: draft/published/completed, createdBy) |
| `AgendaItem` | Items de agenda (type: hymn/prayer/speaker/announcement, refId, order, note) |
| `Hymn` | Himnos (number 1–209, titleEs, titleEn) |
| `Event` | Eventos (title, type, eventDate, description) |
| `Post` | Posts comunitarios (title, content, authorId) |
| `Post` | ... (9 tablas en total) |

### ⚙️ Camel Case en Postgres

**Regla de oro:** Sin comillas → lowercase. Con comillas → se respeta case.

✅ **Correcto:**
```ts
const row = db.prepare(`
  SELECT firstName AS "firstName",
         lastName AS "lastName"
  FROM "Member"
`).get(id);
console.log(row.firstName); // ✓ funciona
```

❌ **Incorrecto (bug):**
```ts
const row = db.prepare(`
  SELECT firstName, lastName FROM "Member"
`).get(id);
console.log(row.firstName); // ✗ undefined (es row.firstname)
```

**Todas las queries en `lib/`** usan aliases explícitos. Ver `lib/members.ts` como referencia.

---

## 🎵 Himnos

### Estado actual
- ✅ **209 himnos** en `db/hymns-data.ts` (archivo estático, auto-generado)
- ⚠️ **PENDIENTE CRÍTICO:** Correr `db/hymns-seed.sql` en **Supabase SQL Editor** para poblar tabla `Hymn` en producción
  - Sin esto: búsqueda de himnos devuelve "Sin coincidencias"
  - Comando: copiar contenido de `/mnt/user-data/outputs/hymns-seed.sql` → pegar en Supabase → Run
- ❌ Himnos 210–341 no recopilados aún (v0.2)

### 🔍 Búsqueda de himnos
- Endpoint: `GET /api/himnos/buscar?q=...&limit=10`
- Busca por: número exacto, número prefijo (ej: "10" → 100, 101, ...), título substring
- Case-insensitive

### 📝 Asignar himnos en agenda

1. Admin en `/admin/agendas/[id]/editar`
2. Para cada slot de himno sin asignar:
   - Aparece `InlineHymnPicker` con hint
   - Escribe número o parte del título → busca en tiempo real
   - Selecciona himno → se guarda automáticamente
3. Publicar agenda → visible en `/agendas` para miembros

### 👥 Miembros ven himnos
- Click en "Himno 105 — La Santa Cena" → abre `HymnModal`
- Modal muestra: número, título, hint de la guía oficial, 3 instrucciones
- Botón azul abre `churchofjesuschrist.org/study/library/hymns/105?lang=spa` en pestaña nueva
- Cierran pestaña → regresan a modal en Bloomingdale (no pierden contexto)

---

## 🔐 Autenticación

- **Sistema:** JWT sessions (NextAuth v5)
- **Registro:** Email + contraseña (8+ caracteres, sin email verification aún)
- **Primer usuario:** rol `admin` automático
- **Usuarios subsecuentes:** rol `member`
- **Session:** JWT token con `id`, `email`, `role`, `name` (firstName + middleName + lastName)

---

## 🐛 Errores resueltos en esta sesión

### 1. "Sesión inválida" al crear agenda
**Síntoma:** Error al presionar "Crear borrador"
**Causa:** `session.user.id` no se pasaba desde JWT token
**Fix:**
```ts
// auth.ts
async session({ session, token }) {
  if (token.sub) session.user.id = token.sub;
  session.user.role = token.role ?? "member";
  return session;
}
```

### 2. "Cannot read properties of undefined (reading 'firstName')"
**Síntoma:** Al guardar cambios en "Editar miembro"
**Causa:** MemberForm no tenía `middleName` en schema Zod
**Fix:**
```ts
// lib/validators/member.ts
export const memberBaseSchema = z.object({
  firstName: trimmed("nombre", 80),
  middleName: z.string().trim().max(80).optional()
    .transform(v => v && v.length > 0 ? v : null),
  lastName: trimmed("apellido", 80),
  // ...
});
```

### 3. "Sin coincidencias" buscando himnos (aún pendiente)
**Síntoma:** Escribir "105" o "jés" devuelve "Sin coincidencias"
**Causa:** Tabla `Hymn` está **vacía** en Supabase
**Fix:** User debe correr `hymns-seed.sql` en Supabase SQL Editor
**Estimado de resolución:** 2 minutos

### 4. `SELECT *` en agenda/members.ts
**Síntoma:** Silencioso, pero `getMemberById()` retornaba `{firstname, lastname}` en lugar de `{firstName, lastName}`
**Causa:** Postgres lowercase sin comillas
**Fix:**
```ts
// lib/agenda/members.ts
SELECT id,
       firstName AS "firstName",
       middleName AS "middleName",
       lastName AS "lastName",
       ...
FROM "Member" WHERE id = ?
```

---

## ✅ Checklist de implementación

- [x] Autenticación con JWT (NextAuth v5)
- [x] CRUD de Miembros (incluyendo `middleName`)
- [x] CRUD de Agendas sacramentales
- [x] Template automático de 6 items
- [x] Búsqueda de himnos (endpoint)
- [x] Modal amigable para no técnicos
- [x] Hints de guía oficial en cada rol de himno
- [x] Camel case aliases en todas las queries Postgres
- [x] Validación Zod en toda la entrada
- [x] Build Next.js limpio (0 errores TypeScript)

---

## 📋 TODO (v0.2 y adelante)

### 🚨 Inmediato (bloqueadores)
- [ ] **URGENTE:** Correr `db/hymns-seed.sql` en Supabase SQL Editor
- [ ] Revocar PAT de GitHub (en https://github.com/settings/tokens)
- [ ] Verificar búsqueda de himnos funciona después de seed

### v0.2 — Completitud
- [ ] Completar himnos 210–341 (recopilar títulos oficiales)
- [ ] Email verification en registro
- [ ] Módulo "Ven, sígueme" (52 lecciones AT 2026)
- [ ] Radio SUD Online (stream integrado)
- [ ] Tracking de asistencia en agendas
- [ ] Reportes de discursos (cuándo fue cada miembro)

### v0.3+ — Expansión
- [ ] Foto de perfil de miembros
- [ ] Calendar view de eventos
- [ ] Notificaciones por correo (próximo domingo, etc.)
- [ ] Export de agenda a PDF
- [ ] Sistema de comentarios en posts

---

## 🏗️ Ambiente: Local vs. Producción

### Local (SQLite)
```bash
npm run dev
```
- `better-sqlite3` + `.db.sqlite` local
- `npm run db:seed` puebla 209 himnos
- No requiere credenciales

### Producción (Supabase)
- Variables en `.env.local` (secreto, no commiteado):
  - `DATABASE_URL` → Transaction Pooler URL de Supabase
  - `AUTH_SECRET` → JWT secret
- Himnos: **manual seed en Supabase SQL Editor** (una sola vez)
- Hosted en Vercel: `https://bloomingdale2.vercel.app`

---

## 👨‍💻 Para desarrolladores

### Agregar una query nueva

1. **Validar entrada con Zod**
   ```ts
   // lib/validators/member.ts
   export const createMemberSchema = z.object({
     firstName: trimmed("nombre", 80),
     lastName: trimmed("apellido", 80),
   });
   ```

2. **Usar aliases en SELECT si hay camelCase**
   ```ts
   db.prepare(`
     SELECT id, firstName AS "firstName", lastName AS "lastName"
     FROM "Member"
   `)
   ```

3. **Pasar typecheck**
   ```bash
   npx tsc --noEmit
   ```

4. **Funcionar con SQLite y Postgres** (dual-database compatible)
   - `better-sqlite3` en dev
   - Supabase en prod
   - Mismo código funciona en ambos

---

## 📝 Licencia

Uso interno de la Rama Bloomingdale 2. Cualquier distribución o uso externo requiere autorización de la rama.

---

## 🙏 Notas finales

Este proyecto está diseñado para:
- **Miembros no técnicos** (UI clara, instrucciones en español)
- **Admin básico** (crear agenda, asignar himnos, ver miembros)
- **Escalabilidad** (Postgres en prod, SQLite en dev)
- **Mantenibilidad** (TypeScript, validación, tests)

Si encuentras errores o tienes sugerencias, contacta al equipo de desarrollo de la rama.

**Última actualización:** 12 de junio de 2026
