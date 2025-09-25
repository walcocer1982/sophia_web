# Plan para integrar la IA en 3 hitos incrementales

## Hito 1: Respuestas JSON tipadas y action mínima de SOPHIA

**Descripción y resultados esperados**
Conseguir un ciclo completo **UI → `app/action/sophia.ts` → OpenAI → JSON validado → UI** sin tocar DB todavía. Verás el **mensaje de Sophia** y el objeto tipado (chat/progress/analytics) en la app.

### Paso 1.1 — Esquema y tipos de salida (Zod)

Crear en `lib/ai/schemas.ts`: `LessonAIResponse` (Zod) y `export type LessonAIResponseT`.

*Objetivo:* Contrato de salida estable (chat/progress/analytics) validado en server.

#### Instrucciones

* `lib/ai/schemas.ts`: define `chat`, `progress (masteryDelta,nextStep,tags)`, `analytics (reasoningSignals,difficulty)`.
* Exporta `LessonAIResponseT`.

#### Consideraciones críticas:

* Mantén el esquema pequeño; versiona con comentario `// v1`.
* No incluyas campos que no uses en UI/DB.
* Evita strings libres cuando puedas (usa enums en app).

### Paso 1.2 — System prompt y utilidades

Crear `lib/ai/prompts.ts` con el **system prompt de SOPHIA** (luego lo llenaremos) y helpers mínimos.

*Objetivo:* Centralizar reglas pedagógicas y evitar duplicación.

#### Instrucciones

* `export const SOPHIA_SYSTEM_PROMPT = "..."` (plantilla con placeholders).
* Helper `buildLessonSummary(session): string` (temporal, retornará un stub o estado local).

#### Consideraciones críticas:

* Limitar `lessonSessionSummary` a \~300–600 tokens.
* No exponer secretos ni datos sensibles.

### Paso 1.3 — Server Action única

Implementar `app/action/sophia.ts` que reciba `{ systemPrompt, lessonSessionSummary, question, studentAnswer }` y devuelva `LessonAIResponseT` usando **Responses API** con `response_format: { type: "json_schema", strict: true }`.

*Objetivo:* Asegurar **JSON válido** antes de llegar a la UI.

#### Instrucciones

* Instanciar `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })` dentro del action.
* Construir `input` con mensajes `system` + `user` (summary + QA + "solo JSON").
* Parsear `res` → `JSON.parse` → `LessonAIResponse.parse()`.
* Retornar el objeto tipado; manejar errores con shape estable `{ ok:false, error:"..." }` si aplica.

#### Consideraciones críticas:

* No habilitar streaming aún.
* Asegurar que **nunca** retornas texto fuera de JSON.
* Manejar timeouts (reintento único opcional).

### Paso 1.4 — Conexión mínima en UI

Conectar el chat/flujo (p. ej. `LessonChat`) para invocar `app/action/sophia.ts`.

*Objetivo:* Ver **fin a fin** la primera respuesta de SOPHIA en la UI.

#### Instrucciones

* Deshabilita input durante la llamada; muestra loading.
* Renderiza `ai.chat.message` y conserva `ai` en estado local (para debug).

#### Consideraciones críticas:

* Evita llamadas paralelas por sesión.
* Maneja errores de red/validación con toasts o banner.

### Protocolo de validación (Hito 1)

* [x] `lib/ai/schemas.ts` exporta `LessonAIResponse` y `LessonAIResponseT`.
* [x] `lib/ai/prompts.ts` contiene el **system prompt** y compila.
* [x] `app/action/sophia.ts` retorna **solo** JSON válido del esquema.
* [x] En UI se muestra el `chat.message` y no hay texto "extra" del modelo.
* [x] Logs muestran latencia y no hay errores uncaught.

---

## Hito 2: Persistencia y reanudación (DB + outcome de IA)

**Descripción y resultados esperados**
Extender Prisma para registrar **AIOutcome**, **MomentProgress**, **AIRequestLog** y campos agregados en `LessonSession` (e.g. `aggregateMastery`, `sessionSummary`). Al recargar, la sesión **retoma** estado y la IA usa **memoria cacheada**.

### Paso 2.1 — Migraciones Prisma

Añadir enums y modelos propuestos; migrar DB.

*Objetivo:* Soporte nativo a outcomes, progreso por momento y métricas de costos/perf.

#### Instrucciones

* Añadir enums: `MessageRole`, `Difficulty`, `ResponseTag`, `EvaluationSource`.
* Crear modelos: `MomentProgress`, `AIOutcome`, `AIRequestLog`.
* Extender `LessonSession` con: `aggregateMastery`, `lastMasteryDelta`, `consecutiveCorrect`, `attemptsInCurrent`, `lastTags`, `lastDifficulty`, `nextStepHint`, `sessionSummary`.
* Ejecutar `prisma migrate dev`.

#### Consideraciones críticas:

* Backup antes de migrar en ambientes compartidos.
* Defaults sensatos para datos existentes.
* Índices en `[sessionId, momentId]` y fechas para consultas rápidas.

### Paso 2.2 — Transacción por turno

Encapsular todo el ciclo de un turno en **una transacción**.

*Objetivo:* Consistencia entre mensajes, evaluación y agregados.

#### Instrucciones

* Crear `ChatMessage(user)` y `StudentResponse`.
* Invocar `app/action/sophia.ts` → obtener `ai`.
* Crear `AIOutcome` (guardar `raw` y campos denormalizados).
* Upsert `MomentProgress` (intentos, `masteryAvg`, `completed` si aplica).
* Actualizar `LessonSession` (agregados + `sessionSummary`).
* Crear `ChatMessage(assistant)` con `ai.chat.message`.
* Registrar `AIRequestLog` (tokens/latencia/modelo si disponibles).

#### Consideraciones críticas:

* Clampear mastery a \[0,1]; `consecutiveCorrect` según `tags`/score.
* `sessionSummary` \~500 tokens con helper dedicado.
* Manejar idempotencia si el cliente reintenta.

### Paso 2.3 — Rehidratación en UI

Reanudar desde `currentMomentId` y mostrar historial relevante.

*Objetivo:* UX de **continuar donde quedaste** + memoria lista para IA.

#### Instrucciones

* Server Component: cargar `LessonSession` + últimos `ChatMessage`.
* Pasar estado inicial al cliente (momento, últimos mensajes).
* Al llamar a IA, usar `sessionSummary` en lugar de todo el historial.

#### Consideraciones críticas:

* Paginación de mensajes a partir de N.
* Autorización estricta por `userId`/`sessionId`.

### Protocolo de validación (Hito 2)

* [x] Migraciones aplicadas y schema Prisma actualizado.
* [x] Turno completo persiste en **una transacción** sin inconsistencias.
* [x] Rehidratación trae `currentMomentId` correcto y carga historial.
* [x] `sessionSummary` se actualiza y reduce tokens en requests.
* [x] `AIOutcome.raw` almacena el JSON íntegro y denormalizados útiles.

---

## Hito 3: Estructura de lección y transición automática

**Descripción y resultados esperados**
Adoptar `LessonStructure` con momentos (`goal`, `rubric`, `transitions`, `aiPolicy`) y función `decideNextMoment` basada en `masteryDelta`, `tags` y criterios. La clase avanza/refuerza **automáticamente** y quedan métricas básicas operativas.

### Paso 3.1 — Tipos y datos de lección

Definir `lib/ai/lesson-types.ts` y migrar `lesson01` al nuevo formato.

*Objetivo:* Objetivos, rúbricas y transiciones explícitas por momento.

#### Instrucciones

* Crear tipos `LessonStructure`, `LessonMoment`, etc.
* Actualizar `lesson01` con `type`, `goal`, `question`, `rubric`, `transitions`, `ai`.
* Loader `getLesson(lessonId)` que devuelva estructura tipada.

#### Consideraciones críticas:

* IDs de momentos estables ("m1", "m2").
* `aiPolicy` global + overrides por momento.
* Contenido breve y accionable.

### Paso 3.2 — Transición automática

Implementar `decideNextMoment(m, ai)` y persistir el cambio.

*Objetivo:* Moverse entre momentos según desempeño de forma confiable.

#### Instrucciones

* Criterios: `masteryDelta`, `tags`, `advanceCriteria` (consecutivos, min delta).
* Bloqueo por `tags` críticos (p.ej. "conceptual") → `onStruggle`.
* Persistir `currentMomentId`; marcar `MomentProgress.completed` según regla.

#### Consideraciones críticas:

* Evitar loops de refuerzo (límite de repeticiones + salida controlada).
* Respetar `maxNewQuestionsPerTurn = 1`.
* Log básico para tuning (desde `AIRequestLog`).

### Paso 3.3 — Guardas pedagógicas + tablero mínimo

Añadir reglas pequeñas de calidad y una consulta para métricas.

*Objetivo:* Estabilidad y visibilidad.

#### Instrucciones

* Si `aggregateMastery < 0.5` → bajar dificultad y activar pistas tiered.
* Si `≥ 0.75` y sin `conceptual` → subir dificultad y ofrecer challenge.
* Query rápida sobre `AIOutcome.tags/difficulty` y `AIRequestLog` para tablero básico.

#### Consideraciones críticas:

* No revelar soluciones completas salvo criterio de desbloqueo.
* Rate limit simple por sesión/usuario.

### Protocolo de validación (Hito 3)

* [ ] `lesson01` convertido a `LessonStructure` y compila.
* [ ] `decideNextMoment` mueve el flujo según delta/tags/criterios.
* [ ] `currentMomentId` y `MomentProgress.completed` se actualizan correctamente.
* [ ] Métricas básicas visibles (tags/difficulty, tokens/latencia).
* [ ] No hay loops infinitos; existe salida de refuerzo.

---

## Archivos temporales para eliminar post-release

Los siguientes archivos fueron creados para testing y validación del Hito 1. Deben ser eliminados después del release v1.0.3 una vez que la integración completa esté funcionando:

### Archivos de prueba a remover:
* `app/lessons/test-ai/page.tsx` - Página de prueba del Hito 1
* `app/lessons/test-ai/test-ai-client.tsx` - Cliente de prueba para invocar SOPHIA
* `app/lessons/test-persistence/page.tsx` - Página de prueba del Hito 2
* `app/lessons/test-persistence/test-persistence-client.tsx` - Cliente de prueba de persistencia

### Funciones legacy a limpiar:
* `app/actions/sophia.ts` - Función `postUserInput()` marcada como legacy (líneas 8-18)

### Notas de limpieza:
* La función `postUserInput` debe ser removida completamente una vez que todos los componentes migren a `processSophiaTurn`
* Los archivos de test-ai y test-persistence fueron útiles para validación pero no deben ir a producción
* Considerar crear tests unitarios formales basados en los casos de prueba implementados
* Variable `updatedSession` no usada en sophia-turn.ts (línea 220) puede removerse
