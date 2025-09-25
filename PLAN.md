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

* `lib/ai/lesson-types.ts`

  * `LessonStructure`, `LessonMoment`, `LessonImage` como definiste (con `learningObjectives` y `checkPoints`).
* `data_lessons/lesson01.ts`

  * `export const lesson01: LessonStructure` con `moments` lineales (`id: number`).

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

* Si no hay sesión: `LessonSession.create({ userId, lessonId, currentMomentId: 0 })`.
* `StudentResponse.create({ sessionId, momentId, attempt, questionShown, studentAnswer })`.
* `AIOutcome.create({ sessionId, responseId, momentId, raw: ai, aiMessage, aiHints, masteryDelta, nextStep, tags, difficulty, reasoningSignals })`.
* Actualiza `LessonSession` (memoria y agregados):

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

## Checklists por hito

**Hito 1**

* [ ] `lesson01` compila; `learningObjectives` y `checkPoints` presentes.
* [ ] `LessonAIResponse` (Zod) exportado y probado con payload ficticio.
* [ ] `buildTurnPayload` arma el bloque **user** con solo el momento actual.

**Hito 2**

* [ ] `app/actions/sophia.ts` usa `response_format: json_schema (strict)` y valida con Zod.
* [ ] Se crean `LessonSession` (si no existe), `StudentResponse`, `AIOutcome`.
* [ ] `sessionSummary` actualizado (≤600 tokens), `last*` y contadores al día.
* [ ] IA nunca llega a la UI sin pasar por `LessonAIResponse.parse(...)`.

**Hito 3**

* [ ] `currentMomentId` cambia con `nextStep`; `completedMoments` se actualiza.
* [ ] `attemptsInCurrent` se resetea al avanzar y limita refuerzos.
* [ ] Último momento + `ADVANCE` → `isCompleted = true`.
* [ ] Rehidratación: la clase continúa correctamente tras recarga.

---

## Notas operativas

* **Costos**: mete en prompt solo **momento actual** + `sessionSummary`.
* **Trazabilidad**: `AIOutcome.raw` guarda el JSON íntegro para auditoría y evolución del esquema.
* **Calidad**: el **Zod** es el guardián; si falla, no persistir ni mostrar nada a la UI (muestra error amable).

Con esto, tu repo queda listo para una primera conversación con Sophia, con contrato de salida **blindado por Zod** y una progresión lineal **predecible**.
