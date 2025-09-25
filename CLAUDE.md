# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sophia Web es una plataforma educativa interactiva basada en Next.js 15.5 con App Router, diseñada para ofrecer lecciones guiadas con evaluación en tiempo real mediante IA.

## Tech Stack

- **Framework:** Next.js 15.5 (App Router) con Turbopack
- **Runtime:** Edge Runtime (Vercel) - Optimizado para performance
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Authentication:** NextAuth.js v5 con Google Provider (JWT Strategy)
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
2. **Middleware** protege rutas `/lessons/*` (Edge-compatible)
3. **Session Strategy:** JWT (cookies client-side, sin tabla Session en DB)
4. **User Roles:** STUDENT | ADMIN
5. **Tablas usadas:** Solo Account y User (no Session)

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
- **Componentes UI** en `components/`
- **Componentes UI SHADCN** en `components/ui/`
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

## 🚀 Consideraciones para Edge Runtime (Vercel)

### Arquitectura Optimizada para Edge

Este proyecto está **optimizado para Edge Runtime de Vercel**, lo que proporciona:
- ⚡ Menor latencia global
- 🔒 Mayor seguridad con aislamiento de runtime
- 💰 Menor costo de ejecución
- 🌍 Distribución global automática

### Estrategia de Autenticación JWT

**Usamos JWT en lugar de database sessions porque:**
- ✅ Compatible con Edge Runtime (sin conexiones DB en middleware)
- ✅ Stateless - escalabilidad infinita
- ✅ Menor latencia (no requiere consulta DB por request)
- ✅ Ideal para aplicaciones distribuidas globalmente

**Configuración actual:**
```typescript
session: {
  strategy: 'jwt',  // NO cambiar a 'database'
  maxAge: 30 * 24 * 60 * 60,
}
```

### Middleware Optimizado para Edge Runtime

Para mantener el middleware dentro del límite de tamaño de Edge Functions:

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

3. **Reglas importantes para Edge Runtime:**
   - ❌ NO importar Prisma ni PrismaAdapter en el middleware
   - ❌ NO usar estrategia 'database' para sesiones
   - ❌ NO exportar directamente `auth` desde lib/auth en middleware
   - ✅ Usar configuración mínima solo con providers necesarios
   - ✅ Mantener el middleware bajo 1MB (idealmente <100KB)

### Limitaciones del Edge Runtime

**No disponible en Edge Runtime:**
- Node.js APIs (fs, path, crypto nativo)
- Conexiones directas a base de datos (usar API routes)
- Módulos con binarios nativos
- Buffer global (usar Web APIs)

**Alternativas Edge-compatible:**
- `crypto` → Web Crypto API
- `Buffer` → `TextEncoder/TextDecoder`
- DB queries → Server Actions o API Routes (no en middleware)

## 🎨 Design System - Plan de Implementación UI/UX

### 📋 Plan de desarrollo para Design System moderno

El plan completo de desarrollo del design system está documentado en `PLAN_UI.md` y consta de 4 hitos incrementales:

#### **Hito 1: Fundaciones del Design System y tokens base**
- Tokens de color y variables CSS custom (`lib/design/tokens.css`)
- Sistema tipográfico mejorado con escalas semánticas
- Espaciado y layout sistemático
- WCAG AA compliance para accesibilidad

#### **Hito 2: Componentes base y patrones de interacción**
- Componentes de Input mejorados (labels flotantes, validación amigable)
- Sistema de feedback educativo (ProgressRing, Toast, StatusBadge)
- Layout components para experiencias de aprendizaje
- Balance entre modernidad y familiaridad para estudiantes

#### **Hito 3: Micro-interacciones y states de carga mejorados**
- Animaciones educativas que celebren progreso
- Estados específicos para SOPHIA AI thinking
- Gestos y shortcuts discoverable
- Performance optimizada para dispositivos educativos

#### **Hito 4: Temas y personalización para engagement**
- Sistema de temas base (dark/light/high-contrast)
- Personalización de learning environment
- Achievement themes con gamification sutil
- Optimización final para hardware educativo limitado

### 🎯 Estado de Implementación Design System

**Objetivo:** Crear un design system moderno pero accesible que no intimide a estudiantes promedio

**Progreso actual:**
- [x] Hito 1: Completado - Tokens, tipografía y espaciado
- [x] Hito 2: Completado - Componentes aplicados en /lessons (ProgressRing, StatusBadge, LoadingState)
- [x] Hito 3: Completado - Micro-interacciones, SOPHIA thinking states, animaciones educativas
- [ ] Hito 4: Pendiente - Temas y personalización

**Consideraciones de diseño:**
- Target audience: estudiantes de secundaria/preparatoria
- Hardware objetivo: tablets educativos de gama media-baja
- Principio: modernidad sin intimidación
- Accesibilidad: WCAG AA compliance

### 📐 Protocolo UI Minimalista - "Menos es Más"

**PRINCIPIO FUNDAMENTAL:** Usar el design system de manera intencional y mínima. No por tener tokens y utilidades debemos usarlas todas.

#### 🎯 **Regla de Oro: Tailwind First, Design System Second**

1. **SIEMPRE usar Tailwind CSS como primera opción:**
   ```tsx
   // ✅ CORRECTO - Simple y directo
   <Badge className="bg-green-100 text-green-800">Completado</Badge>

   // ❌ EVITAR - Exceso de design system para casos simples
   <Badge className="ds-bg-success-glass ds-text-success-foreground">Completado</Badge>
   ```

2. **Design System SOLO para casos especiales:**
   - Estados educativos específicos (mastery, learning, progress)
   - Efectos glass que necesiten contraste optimizado
   - Tipografía jerárquica en páginas de lecciones
   - Espaciado cuando el patrón se repite 3+ veces

#### 🚦 **Matriz de Decisión UI**

**¿Cuándo usar qué?**

| Escenario | Usar Tailwind | Usar Design System | Ejemplo |
|-----------|---------------|-------------------|---------|
| Colores básicos | ✅ | ❌ | `text-gray-600`, `bg-blue-50` |
| Estados educativos | ❌ | ✅ | `ds-text-mastery`, `ds-bg-learning-glass` |
| Espaciado común | ✅ | ❌ | `p-4`, `mb-6`, `gap-2` |
| Layout educativo | ❌ | ✅ | `ds-container-lg`, `ds-chat-max-width` |
| Tipografía normal | ✅ | ❌ | `text-lg`, `font-medium` |
| Jerarquía educativa | ❌ | ✅ | `ds-text-heading-1`, `ds-text-body-lg` |

#### ⚡ **Checklist de Implementación Rápida**

**Antes de usar design system, pregúntate:**
- [ ] ¿Es esto específico del contexto educativo?
- [ ] ¿Tailwind CSS no puede lograr lo mismo más simple?
- [ ] ¿Se repetirá este patrón en 3+ lugares?
- [ ] ¿Necesito contraste/accesibilidad específica?

**Si 2+ respuestas son "Sí" → Usa Design System**
**Si 0-1 respuestas son "Sí" → Usa Tailwind**

#### 🎨 **Patrones de Uso Comunes**

**✅ Buenos usos del Design System:**
```tsx
// Estados de aprendizaje
<Badge className="ds-bg-mastery-glass">Nivel Avanzado</Badge>

// Tipografía educativa
<h1 className="ds-text-heading-1">Lección de Matemáticas</h1>

// Layout de lecciones
<div className="ds-container-lg ds-space-y-spacing-xl">

// Efectos glass con contraste
<div className="ds-bg-progress-glass ds-p-spacing-md">
```

**❌ Malos usos del Design System:**
```tsx
// Simple spacing - usar Tailwind
<div className="ds-p-spacing-sm"> // ❌
<div className="p-2">             // ✅

// Colores básicos - usar Tailwind
<span className="ds-text-info">    // ❌
<span className="text-blue-600">   // ✅

// Tipografía normal - usar Tailwind
<p className="ds-text-body-md">     // ❌
<p className="text-base">           // ✅
```

#### 🏗️ **Arquitectura de Componentes Eficiente**

**Jerarquía de estilos:**
1. **Tailwind** - 80% de los casos
2. **Design System** - 15% casos educativos específicos
3. **CSS custom** - 5% casos muy específicos

**En la práctica:**
- Componentes base: Usa Tailwind
- Componentes educativos: Combina Tailwind + Design System mínimo
- Páginas de lecciones: Design System más presente pero selectivo

Este protocolo asegura que el design system agregue valor real sin crear complejidad innecesaria.

## 🤖 Integración de IA - Plan de Implementación v1.0.3

### 📋 Plan de desarrollo para SOPHIA AI

El plan completo de implementación está documentado en `PLAN.md` y consta de 3 hitos incrementales:

#### **Hito 1: Respuestas JSON tipadas y action mínima de SOPHIA**
- Esquemas Zod para validación (`lib/ai/schemas.ts`)
- System prompt pedagógico (`lib/ai/prompts.ts`)
- Server Action con OpenAI API (`app/actions/sophia.ts`)
- Integración en UI sin persistencia

#### **Hito 2: Persistencia y reanudación (DB + outcome de IA)**
- Modelos Prisma: `AIOutcome`, `MomentProgress`, `AIRequestLog`
- Transacciones atómicas por turno
- Session summary para optimización de tokens
- Rehidratación de estado al reanudar

#### **Hito 3: Estructura de lección y transición automática**
- `LessonStructure` con momentos, goals y rúbricas
- Lógica de transición basada en mastery
- Guardas pedagógicas adaptativas
- Métricas básicas de desempeño

### 🎯 Estado de Implementación v1.0.3

**Objetivo:** Integrar SOPHIA como tutora IA pedagógica con evaluación en tiempo real

**Progreso actual:**
- [x] Hito 1: Completado - Esquemas Zod, prompts pedagógicos, integración OpenAI API
- [x] Hito 2: Completado - Modelos Prisma (AIOutcome, MomentProgress), transacciones atómicas, session summary
- [ ] Hito 3: NO IMPLEMENTADO - Estructura de lección compleja y transiciones automáticas (revertido por complejidad)

**Configuración requerida:**
```env
OPENAI_API_KEY="sk-..."  # ✅ Ya configurada
```

### 🔄 Decisión Arquitectural - Simplificación vs Complejidad

**Fecha:** 2024-09-25
**Decisión:** Revertir implementación del Hito 3 de SOPHIA AI
**Razón:** La arquitectura compleja con LessonStructure, momentos automáticos y transition engine generaba mayor complejidad de la necesaria para v1.0.3

**Estado actual mantenido:**
- ✅ **Hito 1 + 2 activos:** OpenAI integration funcional con persistencia DB completa
- ✅ **Estructura simple de lecciones:** `data_lessons/lesson01.ts` con formato básico
- ✅ **Evaluación en tiempo real:** `processSophiaTurn()` con análisis AI y guardado transaccional
- ✅ **UI optimizada:** SOPHIA thinking states, optimistic updates, diseño educativo
- ✅ **Design System completo:** Hitos 1-3 implementados completamente

**Archivos removidos en la simplificación:**
- `lib/ai/lesson-types.ts` - Tipos complejos de estructura de lección
- `lib/ai/transition-engine.ts` - Lógica de transiciones automáticas
- `app/actions/sophia-turn-v2.ts` - Version avanzada con transitions
- `app/actions/sophia-turn-mock.ts` - Version mock para testing

**Beneficios de la simplificación:**
- Codebase más mantenible y comprensible
- Menor superficie de bugs y edge cases
- Implementación más estable para producción
- Easier debugging y troubleshooting
- Mejor performance (menos lógica compleja por turno)

Esta decisión mantiene toda la funcionalidad core mientras reduce la complejidad técnica innecesaria.

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