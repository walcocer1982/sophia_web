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