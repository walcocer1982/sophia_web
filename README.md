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

## Sistema de Tutora IA - SOPHIA

### Comportamiento actual

SOPHIA es una tutora virtual integrada con GPT-4o-mini que evalúa y guía a estudiantes en lecciones de seguridad industrial (IPERC). Su comportamiento se basa en:

* **Evaluación por targets**: Cada lección tiene targets (competencias) con rúbricas de 5 niveles (Inicial, Básico, Competente, Avanzado, Dominio)
* **Mastery tracking**: Sistema de maestría de 0 a 1 que determina el progreso del estudiante por cada target
* **Respuestas estructuradas**: Usa JSON Schema estricto para garantizar consistencia en evaluación y feedback
* **Detección de intención**: Clasifica cada turno como ANSWER (respuesta), CLARIFY (aclaración) o OFFTOPIC
* **Pedagogía adaptativa**: Ajusta dificultad y hints según nivel de dominio del estudiante

### Flujo de interacción

1. **Inicio de sesión**: Al crear nueva sesión, SOPHIA presenta objetivos y formula primera pregunta
2. **Evaluación continua**: Cada respuesta se evalúa contra la rúbrica del target activo
3. **Clarificaciones sin penalización**: Preguntas de aclaración no afectan el mastery ni cuentan como intentos
4. **Transición automática**: Avanza al siguiente momento cuando se alcanza el minMastery del target
5. **Memoria contextual**: Mantiene sessionSummary con estado, evidencias, brechas y plan pedagógico

### Historias de usuario - Interacción Estudiante-SOPHIA

**HU-01: Inicio de lección nueva**. Como estudiante, al iniciar una lección nueva recibo una bienvenida personalizada con mi nombre, los objetivos de aprendizaje presentados de forma clara, y una primera pregunta contextualizada que evalúa mis conocimientos previos, permitiéndome comenzar el aprendizaje de forma inmediata sin navegación adicional.

**HU-02: Responder pregunta evaluativa**. Como estudiante, cuando respondo una pregunta de SOPHIA, recibo feedback inmediato que reconoce mis aciertos específicos, señala claramente qué aspectos debo mejorar con ejemplos concretos, y me proporciona hints graduales si necesito ayuda, todo mientras veo mi progreso visual actualizado en tiempo real.

**HU-03: Solicitar aclaración de conceptos**. Como estudiante, cuando no entiendo un término o concepto puedo preguntar "¿qué es X?" o expresar mi confusión, y SOPHIA me proporciona una explicación breve y contextualizada sin penalizar mi progreso, manteniendo la misma pregunta activa para que pueda responder cuando esté listo.

**HU-04: Recuperar sesión interrumpida**. Como estudiante, cuando regreso a una lección incompleta, SOPHIA me recibe con un resumen de dónde quedé, qué hemos cubierto y qué falta por aprender, permitiéndome continuar exactamente desde el último punto sin perder contexto ni progreso.

**HU-05: Recibir ayuda adaptativa**. Como estudiante con dificultades, cuando fallo múltiples intentos en un concepto, SOPHIA detecta mi patrón de errores y ajusta automáticamente su estrategia pedagógica, proporcionándome explicaciones más detalladas, ejemplos adicionales y preguntas más simples para construir comprensión gradual.

**HU-06: Completar target de aprendizaje**. Como estudiante, cuando alcanzo el dominio requerido de un target específico, recibo reconocimiento explícito de mi logro con un resumen de lo aprendido, y SOPHIA transiciona suavemente al siguiente desafío manteniendo mi motivación y momentum de aprendizaje.

**HU-07: Navegación off-topic**. Como estudiante, si envío mensajes no relacionados con la lección como saludos o comentarios casuales, SOPHIA responde cortésmente pero me redirige de vuelta al contenido educativo, manteniendo el foco en el aprendizaje sin ser autoritaria o desagradable.

**HU-08: Visualizar progreso detallado**. Como estudiante, puedo ver en todo momento mi nivel de mastery por cada target, cuántos intentos he realizado, qué targets he completado, y cuánto me falta para completar la lección, dándome control y transparencia sobre mi proceso de aprendizaje.

## Server UP in dev mode:
- .env
```env
DATABASE_URL="..."

AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3001"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

OPENAI_API_KEY="..."

AUTH_MICROSOFT_ENTRA_ID_ID=""
AUTH_MICROSOFT_ENTRA_ID_SECRET=""
AUTH_MICROSOFT_ENTRA_ID_ISSUER=""
```

- server:
```bash
npm install
npm run dev
```

## Changelog

### Versión 2.0.1 (2025-01-26)
**Mejoras de calidad y optimización**

#### 🐛 Bug Fixes y limpieza de código
- **Fix:** Eliminados todos los console.logs de debug en producción
- **Fix:** Corregidos errores de TypeScript y warnings de ESLint
- **Fix:** Eliminado archivo de test obsoleto (test-sophia-personality.ts)
- **Mejora:** Actualizada configuración de import para compatibilidad con readline

#### 🔧 Optimizaciones técnicas
- **Mejora:** Refactorizada función `buildSessionSummary` para mejor mantenibilidad
- **Mejora:** Simplificada la estructura de contexto para la IA
- **Mejora:** Mejorado el sistema de rúbricas con validación más estricta
- **Mejora:** Optimizado el manejo de tipos TypeScript en toda la aplicación

#### 📚 Mejoras en contenido educativo
- **Nueva:** Añadidas imágenes descriptivas para cada momento de la lección
- **Mejora:** Enriquecidas las rúbricas de evaluación con más criterios específicos
- **Mejora:** Mejorados los prompts del sistema para respuestas más pedagógicas

### Versión 2.0.0 (2025-01-25)
**MAJOR RELEASE - Sistema de IA Pedagógica SOPHIA**

#### 🤖 Integración completa con OpenAI
- **Nueva:** Tutora virtual SOPHIA con evaluación en tiempo real usando GPT-4o-mini
- **Nueva:** Sistema de respuestas estructuradas con JSON Schema para consistencia
- **Nueva:** Evaluación pedagógica basada en rúbricas por momento de aprendizaje

#### 📚 Sistema pedagógico avanzado
- **Nueva:** Rúbricas de evaluación detalladas por cada momento de la lección
- **Nueva:** Sistema de hints graduales de 3 niveles (sutil, directo, explícito)
- **Nueva:** Feedback diferenciado según desempeño del estudiante
- **Nueva:** Análisis de perfil del estudiante basado en historial
- **Nueva:** Temperatura adaptativa de IA según nivel de dominio

#### 💾 Persistencia y tracking completo
- **Nueva:** Modelos de base de datos para AIOutcome y MomentProgress
- **Nueva:** Transacciones atómicas para garantizar consistencia de datos
- **Nueva:** Session summary con optimización de tokens
- **Nueva:** Sistema de transición automática entre momentos de aprendizaje

#### 🎨 Mejoras de UI/UX
- **Nueva:** Sidebar responsive con ocultación automática en móvil
- **Nueva:** Botón flotante para mostrar/ocultar sidebar en dispositivos móviles
- **Nueva:** Debug log de IA para monitoreo en producción
- **Fix:** Eliminada duplicación de componentes de "Sophia pensando"
- **Fix:** Restaurada foto del usuario en mensajes del chat

#### 🛠️ Mejoras técnicas
- **Nueva:** Arquitectura de prompts con contexto enriquecido
- **Nueva:** Sistema de analytics pedagógicos
- **Mejora:** Limpieza de console.logs para producción
- **Mejora:** Scripts de limpieza de datos de prueba
- **Docs:** Plan completo de implementación en PLAN.md

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