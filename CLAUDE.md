# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sophia Web es una plataforma educativa interactiva basada en Next.js 15.5 con App Router, diseñada para ofrecer lecciones guiadas con evaluación en tiempo real mediante IA.

## Tech Stack

- **Framework:** Next.js 15.5 (App Router) con Turbopack
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Authentication:** NextAuth.js v5 con Google Provider
- **UI Components:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS v4.1
- **TypeScript:** Strict mode enabled

## Comandos Esenciales de Desarrollo

```bash
# Instalación inicial
npm install

# Desarrollo (puerto 3001 con Turbopack)
npm run dev

# Build de producción
npm run build

# Lint
npm run lint

# Prisma - Generar cliente
npx prisma generate

# Prisma - Aplicar migraciones
npx prisma migrate dev

# Prisma - Abrir Studio
npx prisma studio

# Prisma - Sincronizar schema con DB
npx prisma db push
```

## Arquitectura del Proyecto

### Estructura de Directorios Principal

```
app/                    # App Router de Next.js
├── actions/           # Server Actions
├── lessons/          # Rutas protegidas de lecciones
│   ├── page.tsx     # Lista de lecciones
│   └── [lessonId]/  # Detalle de lección dinámica
├── api/auth/        # NextAuth API routes
└── page.tsx         # Landing page

lib/                   # Utilidades compartidas
├── auth.ts          # Configuración NextAuth
├── db.ts           # Cliente Prisma singleton
└── utils.ts        # Utilidades generales

prisma/               # Base de datos
├── schema.prisma   # Schema con modelos User, LessonSession, ChatMessage, StudentResponse
└── migrations/     # Migraciones de DB

data_lessons/         # Contenido educativo
├── index.ts        # Loader de lecciones
└── lesson01.ts     # Estructura de lección ejemplo

components/          # Componentes UI (shadcn/ui)
└── ui/            # Componentes base reutilizables
```

### Flujo de Autenticación

1. **NextAuth v5** configurado con Google Provider
2. **Middleware** protege rutas `/lessons/*`
3. **Session Strategy:** Database (usa tablas Account/Session/User de Prisma)
4. **User Roles:** STUDENT | ADMIN

### Modelo de Datos Principal

- **User:** Usuarios autenticados con rol (STUDENT/ADMIN)
- **LessonSession:** Sesión de aprendizaje por usuario-lección
- **ChatMessage:** Mensajes del chat educativo con roles (user/assistant/system)
- **StudentResponse:** Respuestas evaluadas con análisis AI y feedback

### Flujo de Lecciones

1. Usuario accede a `/lessons` (requiere auth)
2. Selecciona lección → crea/recupera `LessonSession`
3. Interacción mediante chat con evaluación en tiempo real
4. Guarda `ChatMessage` y `StudentResponse` con evaluación
5. Tracking de progreso por momentos (`completedMoments`)

## Configuración Requerida (.env)

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="generado con openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3001"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Convenciones del Código

- **Server Components** por defecto en App Router
- **Server Actions** en `app/actions/` para mutations
- **"use client"** solo cuando necesario (interactividad)
- **Prisma Client** singleton en `lib/db.ts`
- **Componentes UI** de shadcn/ui en `components/ui/`
- **TypeScript** estricto - no usar `any` sin justificación

## Puntos Importantes de Desarrollo

1. **Hot Reload:** Usa Turbopack (`--turbopack`) para desarrollo rápido
2. **Auth Flow:** Las rutas protegidas verifican sesión automáticamente vía middleware
3. **DB Migrations:** Siempre usar `prisma migrate dev` para cambios de schema
4. **Server Actions:** Preferir sobre API routes para mutations simples
5. **Lesson Content:** Definir en `data_lessons/` siguiendo estructura de `lesson01.ts`

## Consideraciones Técnicas Importantes

### TypeScript y Tipos de NextAuth
- **Extender tipos de NextAuth:** Crear archivo `types/next-auth.d.ts` para extender interfaces Session y User
- **Evitar `any`:** Siempre definir tipos apropiados, especialmente para callbacks de auth
- **Tipos de Prisma:** Importar enums y tipos directamente desde `@prisma/client`

### NextAuth v5 con Next.js 15.5
- **Server Actions para Auth:** `signOut` debe ejecutarse en Server Actions, no en client components
- **Configuración de sesión:** Con database strategy, configurar `maxAge` y `updateAge` explícitamente
- **Logout con redirect:** Usar `signOut({ redirect: false })` + `redirect()` de Next.js para control total
- **Revalidación de caché:** Usar `revalidatePath()` después del logout para limpiar caché de rutas

### Navegación en Next.js 15
- **Link component:** Siempre usar `<Link>` de `next/link` en lugar de `<a>` para navegación interna
- **Form actions:** Para acciones de auth, usar `<form action={serverAction}>` en lugar de `onClick`

### Estructura de Server Actions
```typescript
// app/actions/auth.ts
'use server'
import { signOut } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOutAction() {
  await signOut({ redirect: false })
  revalidatePath('/')
  redirect('/')
}
```

### Problemas Comunes y Soluciones
1. **"headers was called outside a request scope":** No llamar funciones de servidor directamente en client components
2. **Sesión no se cierra:** Usar `revalidatePath()` para limpiar caché después del logout
3. **Tipos any en callbacks:** Extender interfaces de NextAuth en `types/next-auth.d.ts`
4. **Edge Function size exceeded (Vercel):** Crear configuración separada sin PrismaAdapter para middleware

### Componentes de Chat y UX

#### Header Component con Sesión
- Recibe `session` como prop desde Server Components
- Muestra imagen real del usuario de Google con fallback a iniciales
- Estilos consistentes con gradientes cyan-yellow del proyecto
- Botón logout funcional con Server Actions

#### ChatMessage con Avatar Personalizado
- Props: `userAvatar` (imagen de Google) y `userInitials` (calculadas automáticamente)
- Usa `AvatarImage` para fotos reales, `AvatarFallback` para iniciales
- Colores: Usuario (yellow-300), Sophia (cyan-800/70)
- Ring y gradientes consistentes con el diseño global

#### AIChatPrompt (reemplazo de ChatPrompt)
- Props: `disabled` y `onSend` para integración completa
- Auto-resize textarea con altura mínima 72px, máxima 300px
- Envío con Enter (sin Shift), botón con gradiente del proyecto
- Estados visuales claros para disabled/enabled
- Placeholder dinámico según estado

#### Flujo de Datos de Sesión
```typescript
// Server Component → Client Component
async function Page() {
  const session = await auth()
  return <Header session={session} />
}

// Propagación en componentes de chat
<LessonChat session={session} />
  → <ChatContainer session={session} />
    → <ChatMessage userAvatar={session?.user?.image} userInitials={...} />
```

### Middleware Optimizado para Edge Runtime

Para evitar el error "Edge Function size exceeded" en Vercel:

1. **Separar configuraciones de auth:**
   - `lib/auth.ts`: Configuración completa con PrismaAdapter para server-side
   - `lib/auth-edge.ts`: Configuración ligera sin adapter para middleware

2. **Estructura del middleware optimizado:**
```typescript
// middleware.ts - Tamaño reducido: ~90KB (antes >1MB)
import { authEdge } from '@/lib/auth-edge'

export default authEdge((req) => {
  // Lógica de protección de rutas
})
```

3. **Importante:**
   - NO importar Prisma ni PrismaAdapter en el middleware
   - NO exportar directamente `auth` desde lib/auth en middleware
   - Usar configuración mínima solo con providers necesarios

## 🚀 Protocolo de Release

### Checklist Pre-Release

Antes de crear un nuevo release, ejecutar estos pasos en orden:

#### 1. 🧹 Limpieza de Código
```bash
# Buscar y eliminar console.logs
grep -r "console\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ components/ lib/

# Buscar comentarios TODO/FIXME
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" app/ components/ lib/

# Buscar código comentado (líneas que empiezan con //)
grep -r "^[[:space:]]*//" --include="*.ts" --include="*.tsx" app/ components/ lib/
```

#### 2. 🔍 Verificación de Calidad
```bash
# Ejecutar linter
npm run lint

# Verificar tipos TypeScript
npx tsc --noEmit

# Ejecutar build de producción
npm run build
```

#### 3. 📝 Actualización de Documentación

**CLAUDE.md:**
- [ ] Agregar nuevos patrones aprendidos
- [ ] Actualizar comandos si cambiaron
- [ ] Documentar nuevas convenciones de código
- [ ] Agregar soluciones a problemas encontrados

**package.json:**
- [ ] Incrementar versión siguiendo semver:
  - `MAJOR.MINOR.PATCH`
  - PATCH: bug fixes (1.0.0 → 1.0.1)
  - MINOR: nuevas features (1.0.0 → 1.1.0)
  - MAJOR: cambios breaking (1.0.0 → 2.0.0)

**README.md:**
- [ ] Actualizar Changelog con formato:
  ```markdown
  ### Versión X.X.X (YYYY-MM-DD)
  - **Feature:** Descripción de nueva funcionalidad
  - **Fix:** Descripción del bug corregido
  - **Mejora:** Optimización o mejora implementada
  - **Breaking:** Cambios que rompen compatibilidad (si aplica)
  ```

#### 4. ✅ Verificación Final
```bash
# Test del servidor de desarrollo
npm run dev
# Verificar que la aplicación carga correctamente
# Probar login/logout
# Navegar por las rutas principales

# Build final
npm run build
```

#### 5. 📦 Commit y Tag

```bash
# Agregar todos los cambios
git add -A

# Commit con mensaje descriptivo
git commit -m "feat: vX.X.X - [Descripción breve]

- [Detalle de cambios principales]
- [Fixes importantes]
- [Nuevas features]

🤖 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

```

### 📋 Template de Release Notes

```markdown
## v[X.X.X] - [Título descriptivo]

### 🎯 Highlights
- Principal mejora o feature

### ✨ Features
- Nueva funcionalidad 1
- Nueva funcionalidad 2

### 🐛 Bug Fixes
- Fix 1
- Fix 2

### 🔧 Mejoras
- Optimización 1
- Refactor 2

### 📚 Documentación
- Actualización de docs

### ⚠️ Breaking Changes (si aplica)
- Cambio que requiere migración
```