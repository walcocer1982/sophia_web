# PLAN.md — Nuevo modelo de datos + primera conversación con Sophia (actualizado)

> Supuestos confirmados:
>
> * Ya existe `lib/ai/system-prompt.ts` con `SOPHIA_SYSTEM_PROMPT`.
> * Usaremos **Zod** como contrato estricto de salida (Structured Outputs) para validar la respuesta de la IA.

---

## Hito 1 — Lección tipada, contrato Zod y wiring de contexto (sin DB)

**Descripción y resultados esperados**
Dejar lista la **lección** (TS), el **contrato Zod** de salida y un **helper** que arme el contexto mínimo por turno (solo el **momento actual**), usando el `SOPHIA_SYSTEM_PROMPT`.

### Paso 1.1 — Tipos + lesson01

* `types/lesson-types.ts` (ya existe, verificar compatibilidad)

  * `LessonStructure`, `LessonMoment`, `LessonImage` como definiste (con `learningObjectives` y `checkPoints`).
  * **CRÍTICO:** Asegurar que `moment.id: number` coincida con schema Prisma `momentId: Int`
* `data_lessons/lesson01.ts` (ya existe, actualizar)

  * `export const lesson01: LessonStructure` con `moments` lineales (`id: number`).
  * **COMPATIBILIDAD:** Ya implementado, solo verificar estructura

*Objetivo:* UI puede leer `title/description/learningObjectives` y disponer de `referenceQuestions[]` por momento.

#### Consideraciones críticas

* Mantén `checkPoints` solo para IA (no render en UI).
* IDs de momentos **numéricos** (0..n) y estables.

### Paso 1.2 — Contrato Zod (salida IA)

* `lib/ai/schemas.ts`

  * `export const LessonAIResponse = z.object({ chat:{ message:z.string(), hints:z.string().array().optional() }, progress:{ masteryDelta:z.number(), nextStep:z.enum(['ADVANCE','REINFORCE','RETRY','COMPLETE']), tags:z.enum(['CORRECT','PARTIAL','INCORRECT','CONCEPTUAL','COMPUTATIONAL','NEEDS_HELP']).array() }, analytics: z.object({ difficulty: z.enum(['EASY','MEDIUM','HARD']).optional(), reasoningSignals: z.array(z.string()).optional() }).optional() })`
  * `export type LessonAIResponseT = z.infer<typeof LessonAIResponse>`.

*Objetivo:* Contrato único y estricto para toda respuesta de IA.

#### Consideraciones críticas

* El action **siempre** debe `parsear` contra este schema antes de tocar UI/DB.
* Mantener el schema corto para ahorrar tokens.

### Paso 1.3 — Helper de contexto por turno

* `lib/ai/build-context.ts`

  * `buildTurnPayload({ lesson, momentId, sessionSummary, questionShown, studentAnswer })` → devuelve el bloque **user** con:

    * `lessonMeta { title, description, language }`
    * `learningObjectives` (si son extensos, reduce a 3–5 bullets)
    * `checkPoints` (idem, resumen breve)
    * `moment` (solo el actual)
    * `sessionSummary` (300–600 tokens)
    * `CURRENT TURN` (Q + respuesta del alumno)

*Objetivo:* Reutilizable, claro y barato en tokens.

---

## Hito 2 — Orquestación con OpenAI + validación Zod + persistencia mínima

**Descripción y resultados esperados**
Conectar la UI a `app/actions/sophia.ts`, llamar a OpenAI con **`response_format: json_schema (strict)`** y validar con Zod. Persistir el **turno** mínimo: `LessonSession` (si no existe), `StudentResponse`, `AIOutcome`.

### Paso 2.1 — Server Action `app/actions/sophia.ts`

* **Inputs**: `{ userId, lessonId, momentId, questionShown, studentAnswer }`.
* **Construcción**:

  * `system`: `SOPHIA_SYSTEM_PROMPT` (import desde `lib/ai/system-prompt.ts`).
  * `user`: `buildTurnPayload(...)`.
  * `response_format`: `{ type: 'json_schema', strict: true, json_schema: <schema v1 equivalente a Zod> }`.
* **Post-proceso**:

  * `const ai = LessonAIResponse.parse(JSON.parse(modelOutput))`.
  * Sanitiza si el modelo incluyó >1 pregunta nueva (deja 1 o reescribe el mensaje).
  * Retorna `ai` tipado.

*Objetivo:* Respuesta **real** validada por contrato.

#### Consideraciones críticas

* 1 reintento si el parseo falla (“REINTENTO: solo JSON válido del schema v1”).
* No streaming (reduce complejidad MVP).

### Paso 2.2 — Persistencia (MVP)

**⚠️ IMPORTANTE:** Ejecutar `prisma migrate dev` para aplicar el nuevo schema antes de implementar.

* Si no hay sesión: `LessonSession.create({ userId, lessonId, currentMomentId: 0 })`.
* **Transacción atómica por turno:**
  * `StudentResponse.create({ sessionId, momentId, attempt, questionShown, studentAnswer })`.
  * `AIOutcome.create({ sessionId, responseId, momentId, raw: ai, aiMessage, aiHints, masteryDelta, nextStep, tags, difficulty, reasoningSignals })`.
  * Actualizar `LessonSession` (memoria y agregados):
    * `sessionSummary` (helper que mantenga \~500–600 tokens),
    * `lastMasteryDelta`, `consecutiveCorrect` (según tags), `attemptsInCurrent++`, `lastTags`, `lastDifficulty`, `nextStepHint` (si viene).

*Objetivo:* Cada turno queda cerrado y auditable (entrada/salida/JSON).

#### Consideraciones críticas

* Clamp de `aggregateMastery` ∈ \[0,1] (si lo actualizas en este hito).
* `responseId` en `AIOutcome` 1–1 con `StudentResponse` (evita duplicados).

---

## Hito 3 — Transición lineal + retomar clase

**Descripción y resultados esperados**
Mover el **momento** según `ai.progress.nextStep` y permitir reanudar desde el punto exacto: `currentMomentId` controlado por el backend.

### Paso 3.1 — Decisión de avance

* Reglas simples:

  * `ADVANCE` → `currentMomentId++`; agrega el anterior a `completedMoments` si no está; `attemptsInCurrent = 0`.
  * `REINFORCE` o `RETRY` → permanece; `attemptsInCurrent++`.
  * `COMPLETE` → si es el último momento o criterio cumplido → `isCompleted = true`.
* Si `currentMomentId === moments.length - 1` y `ADVANCE` → `isCompleted = true`.

*Objetivo:* Progressión **lineal** confiable.

#### Consideraciones críticas

* Evita loops: si `attemptsInCurrent > 3`, fuerza avance con nueva `referenceQuestion` o mini-explicación.
* Marca `lastAccessedAt = now()` en cada turno.

### Paso 3.2 — UI de lección y rehidratación

* En `/lessons/SSO001_lesson_01`:

  * Carga `LessonStructure` (TS).
  * Lee `LessonSession` del usuario y determina `currentMomentId`.
  * Muestra `title`, `description`, `learningObjectives`; selecciona 1 `referenceQuestion` del momento actual.
  * Enviar al action `questionShown` exacta (persistimos la que vio).

*Objetivo:* Al recargar, continuar sin pérdida (usa `sessionSummary` como memoria).

#### Consideraciones críticas

* No enviar toda la lección al modelo: solo el momento actual + resumen.
* `checkPoints` **no** visibles en UI (solo IA).

---

## Hito 4 — Integración en producción /lessons/[lessonId]

**Descripción y resultados esperados**
Llevar toda la funcionalidad probada en los test pages a la ruta real de lecciones, con autenticación completa, manejo de errores robusto y UX pulida.

### Paso 4.1 — Migración de componentes

* Crear componente `app/lessons/[lessonId]/lesson-chat.tsx`
  * Extraer lógica de test-hito3 en componente reutilizable
  * Props: `lesson`, `sessionId`, `user`
  * Manejo de estados: loading, error, success
  * Componentes hijos: MessageList, InputArea, ProgressBar

* Actualizar `app/lessons/[lessonId]/page.tsx`
  * Server component que carga sesión de usuario autenticado
  * Obtener o crear LessonSession real
  * Pasar datos necesarios al LessonChat client component

*Objetivo:* Experiencia de usuario completa y profesional.

#### Consideraciones críticas

* Verificar autenticación real (no usuario de prueba)
* Manejar casos edge: sesión expirada, límites de API
* Loading states mientras SOPHIA responde
* Persistir pregunta seleccionada en DB para consistencia

### Paso 4.2 — Cleanup y optimización

* Eliminar páginas de prueba (test-hito1, test-hito2, test-hito3)
* Remover lógica de usuario de prueba en server action
* Implementar rate limiting para proteger API
* Agregar telemetría básica (eventos de progreso)

*Objetivo:* Código listo para producción sin artifacts de desarrollo.

#### Consideraciones críticas

* Backup de test pages antes de eliminar (por si acaso)
* Verificar que no queden imports huérfanos
* Actualizar CLAUDE.md con nuevas rutas

---

## Hito 5 — Optimización pedagógica de prompts

**Descripción y resultados esperados**
Mejorar significativamente la calidad de las respuestas de SOPHIA haciéndolas más específicas, pedagógicas y adaptadas al contexto de cada momento.

### Paso 5.1 — Enriquecer contexto por momento

* Actualizar `buildTurnPayload` para incluir:
  * Rúbrica específica del momento (correct/partial/incorrect criteria)
  * Ejemplos de respuestas esperadas (si existen)
  * Imágenes del momento con instrucciones de referencia
  * Historial resumido de errores comunes del estudiante

* Crear `lib/ai/moment-rubrics.ts`
  * Mapeo momento → criterios específicos de evaluación
  * Frases de feedback contextualizadas por tipo de error
  * Progresiones de dificultad por momento

*Objetivo:* Contexto rico sin explotar límite de tokens.

#### Consideraciones críticas

* Mantener payload < 2000 tokens
* Priorizar información relevante al momento actual
* No revelar respuestas completas en el contexto

### Paso 5.2 — Refinar SOPHIA_SYSTEM_PROMPT

* Segmentar instrucciones por fase de aprendizaje:
  * **Inicio** (momento 0-1): Más explicativo, establecer base
  * **Medio** (momento 2-3): Más socrático, preguntas guiadas
  * **Final** (momento 4+): Síntesis, conexiones avanzadas

* Agregar técnicas pedagógicas específicas:
  * **Error patterns**: Detectar y corregir conceptos erróneos comunes
  * **Scaffolding progresivo**: Reducir ayuda gradualmente
  * **Metacognición**: Hacer que el estudiante reflexione sobre su proceso

* Mejorar manejo de casos especiales:
  * Respuestas vagas → Pedir especificación
  * Respuestas parciales → Reconocer lo correcto, guiar lo faltante
  * Respuestas off-topic → Redirigir amablemente

*Objetivo:* SOPHIA como tutora experta adaptativa, no solo evaluadora.

#### Consideraciones críticas

* Testear con respuestas reales de estudiantes
* Mantener tono empático pero exigente
* Evitar sobre-explicación que aburra

### Paso 5.3 — Sistema de feedback diferenciado

* Crear templates de respuesta por categoría:
  * **Celebración** (CORRECT + alta confianza)
  * **Refuerzo positivo** (CORRECT + baja confianza)
  * **Corrección constructiva** (PARTIAL)
  * **Reorientación** (INCORRECT)
  * **Explicación rescue** (múltiples INCORRECT)

* Implementar variabilidad en respuestas:
  * Pool de frases iniciales por categoría
  * Rotación para evitar repetitividad
  * Personalización según racha/historial

*Objetivo:* Feedback que motive y guíe, no solo califique.

---

## Checklists por hito

**Hito 1** ✅ **[COMPLETADO]**

* [x] `lesson01` compila; `learningObjectives` y `checkPoints` presentes.
* [x] `LessonAIResponse` (Zod) exportado y probado con payload ficticio.
* [x] `buildTurnPayload` arma el bloque **user** con solo el momento actual.

**Hito 2** ✅ **[COMPLETADO]**

* [x] `app/actions/sophia.ts` usa `response_format: json_schema (strict)` y valida con Zod.
* [x] Se crean `LessonSession` (si no existe), `StudentResponse`, `AIOutcome`.
* [x] `sessionSummary` actualizado (≤600 tokens), `last*` y contadores al día.
* [x] IA nunca llega a la UI sin pasar por `LessonAIResponse.parse(...)`.

**Hito 3** ✅ **[COMPLETADO]**

* [x] `currentMomentId` cambia con `nextStep`; `completedMoments` se actualiza.
* [x] `attemptsInCurrent` se resetea al avanzar y limita refuerzos.
* [x] Último momento + `ADVANCE` → `isCompleted = true`.
* [x] Rehidratación: la clase continúa correctamente tras recarga.

**Hito 4** ⏳ **[PENDIENTE]**

* [ ] Componente LessonChat extraído y reutilizable
* [ ] Integración completa en /lessons/[lessonId]/page.tsx
* [ ] Autenticación real sin usuario de prueba
* [ ] Páginas de test eliminadas
* [ ] Rate limiting implementado

**Hito 5** ⏳ **[PENDIENTE]**

* [ ] Rúbricas específicas por momento implementadas
* [ ] SOPHIA_SYSTEM_PROMPT segmentado por fase
* [ ] Templates de feedback diferenciado
* [ ] Variabilidad en respuestas
* [ ] Testing con respuestas reales

---

## Notas operativas

* **Costos**: mete en prompt solo **momento actual** + `sessionSummary`.
* **Trazabilidad**: `AIOutcome.raw` guarda el JSON íntegro para auditoría y evolución del esquema.
* **Calidad**: el **Zod** es el guardián; si falla, no persistir ni mostrar nada a la UI (muestra error amable).

Con esto, tu repo queda listo para una primera conversación con Sophia, con contrato de salida **blindado por Zod** y una progresión lineal **predecible**.

---

## 🔄 Estado Actual (v1.0.3) vs Plan

### ✅ **Ya Implementado**
- **Design System completo** - Hitos 1-3 de PLAN_UI.md
- **Tipos de lección** - `types/lesson-types.ts` con `LessonStructure`
- **Datos de lección** - `data_lessons/lesson01.ts` con momentos numerados
- **UI base** - Componentes educativos (ProgressRing, StatusBadge, SophiaThinking)
- **Auth flow** - NextAuth v5 funcional
- **Build infrastructure** - Next.js 15.5 + Turbopack

### ⚠️ **Requiere Migración**
- **Schema Prisma** - Nuevo modelo necesita `prisma migrate dev`
- **Server Actions** - Actualizar de mock a OpenAI real
- **Zod schemas** - Crear `lib/ai/schemas.ts`
- **System prompt** - Crear `lib/ai/system-prompt.ts`
- **Build context** - Crear `lib/ai/build-context.ts`

### 📋 **Preparación Recomendada**

#### Antes de Hito 1:
```bash
# 1. Backup de DB actual (si hay datos importantes)
pg_dump DATABASE_URL > backup_before_ai_migration.sql

# 2. Verificar que zod está en v3.x (ya hecho en v1.0.3)
npm ls zod

# 3. Preparar entorno para migraciones
cp .env .env.backup
```

#### Secuencia de implementación sugerida:
1. **Hito 1** → Estructura completa sin DB (testing seguro)
2. **Migración schema** → `prisma migrate dev`
3. **Hito 2** → Persistencia + OpenAI integration
4. **Hito 3** → Transiciones y completion

#### Riesgos identificados:
- **Breaking changes** en tipos existentes
- **Migration conflicts** si hay datos previos
- **OpenAI costs** durante testing (usar límites)
