# Sophia Web

Aplicación educativa con **Next.js 15.5 (App Router)**, **Server Actions**, **NextAuth v5 (Google)**, **Prisma** y **PostgreSQL (Neon)**. Orientada a cohortes pequeñas (p.ej., 20 alumnos × 10 clases), con foco en simplicidad y puesta en producción rápida.

## 🚀 Tech stack

* **Next.js 15.5** · App Router · RSC · Server Actions
* **Auth:** NextAuth v5 + Google · PrismaAdapter
* **DB:** PostgreSQL (Neon) + Prisma
* **UI:** Tailwind v4.x
* **Deploy:** Vercel (runtime Node.js en segmentos con Prisma)

### Autenticación & acceso

* Los usuarios inician sesión con **Google** (`/api/auth/signin` via botón o `signIn('google')`).
* **Middleware** protege cualquier ruta que matchee `/lessons/:path*`.

  * Si el usuario **no está autenticado**, es redirigido al flujo de login.
  * Si está autenticado, continúa a la ruta solicitada.
* La **sesión** se almacena en DB (estrategia `database`), y expone `session.user.role` (`STUDENT` por defecto; `ADMIN` para paneles de gestión).

### Lecciones, sesiones y progreso

* Un alumno puede **iniciar o retomar** una lección mediante una Server Action que:

  * Crea (o reusa) una **LessonSession** con `sessionNumber` incremental.
  * Mantiene `currentMomentId` y `completedMoments` para saber **dónde quedó**.
* El alumno interactúa (chat/preguntas) y cada mensaje se guarda como **ChatMessage** con `sequence` **atómico** (se garantiza el orden en una transacción).
* Si la interacción es evaluable, se crea un **StudentResponse** enlazado al mensaje, con campos como `isCorrect`, `score`, `feedback` y `aiAnalysis` (si aplica).

### Revalidación & rendering

* La lectura de datos ocurre en **Server Components** (RSC) y Prisma.
* Tras cualquier mutación (Server Action) se invoca `revalidatePath()`/`revalidateTag()` para refrescar las vistas (consistencia UX).
* Listados/dashboards pueden usar **ISR suave** (p.ej., 60s) para reducir costo de lectura.

### Roles y permisos

* `STUDENT`: acceso a `/lessons/*` (sus recursos).
* `ADMIN`: acceso adicional a `/admin/*` (gestión de lecciones, monitoreo).

  > La verificación de rol se hace **en las Server Actions** que lo requieran (no solo en el middleware).

### Seguridad y límites

* Cookies httpOnly/sameSite por NextAuth; secretos y OAuth en variables de entorno.
* Rate-limit **básico** (opcional) en acciones de chat para evitar abuso.
* CSP y headers de seguridad recomendados en `next.config.ts` (ver sección más abajo).


## Server UP in dev mode:
- .env
```env
DATABASE_URL="..."

AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3001"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

- server:
```bash
npm install
npm run dev
```

## Changelog

### Versión 1.0.2 (2025-01-23)
- **Feature:** Header personalizado con imagen de usuario de Google y datos de sesión reales
- **Feature:** ChatMessage con avatares personalizados del usuario autenticado
- **Feature:** AIChatPrompt mejorado con auto-resize y diseño consistente
- **Mejora:** Flujo completo de datos de sesión desde Server Components a Client Components
- **Mejora:** Estilos visuales consistentes con gradientes cyan-yellow del proyecto
- **Fix:** Configuración de imágenes externas para Google avatars en next.config.ts
- **Docs:** Documentación de componentes de chat y UX en CLAUDE.md

### Versión 1.0.1
- **Fix:** Corregido error de navegación usando `<Link>` en lugar de `<a>`
- **Fix:** Implementado logout correcto con Server Actions y revalidación de caché
- **Mejora:** Agregados tipos TypeScript apropiados para NextAuth callbacks
- **Nuevo:** Archivo `types/next-auth.d.ts` para extender interfaces de sesión
- **Docs:** Agregada documentación técnica en CLAUDE.md sobre NextAuth v5 con Next.js 15

### Versión 1.0
- Project Structure
- Tailwind v4.1
- NextAuth 5.x + Google Provider
- Prisma
- PostgreSQL + Neon
- Middleware