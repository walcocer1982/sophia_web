# PLAN — Fixes rápidos para comportamiento, progreso y uso de imágenes

## Hito 0 — Ajustes de contrato y prompt (microcambios, sin romper nada)

**Objetivo**: habilitar bienvenida+primera pregunta, permitir reformulación creativa, seleccionar imágenes, y destrabar el avance.

### Paso 0.1 — Extender contrato Zod/JSON (salida IA)

**Cambios mínimos en `lib/ai/schemas.ts`:**

* Agrega un campo **opcional** para imagen seleccionada por la IA.
* Permite que la IA proponga una **reformulación** de la pregunta.

```ts
// Añade arriba:
export const VisualSelection = z.object({
  imageId: z.number(),              // debe existir en moment.images
  reason: z.string().min(5).max(120)
});

// Dentro de LessonAIResponse:
export const LessonAIResponse = z.object({
  chat: z.object({
    message: z.string(),            // feedback + (si aplica) la pregunta reformulada
    hints: z.array(z.string()).max(3).optional(),
    image: VisualSelection.optional(),   // <--- NUEVO
    questionRewrite: z.string().min(10).max(220).optional()  // <--- NUEVO
  }),
  progress: z.object({
    masteryDelta: z.number(), 
    nextStep: z.enum(['ADVANCE','REINFORCE','RETRY','COMPLETE']),
    tags: z.array(z.enum(['CORRECT','PARTIAL','INCORRECT','CONCEPTUAL','COMPUTATIONAL','NEEDS_HELP']))
  }),
  analytics: z.object({
    difficulty: z.enum(['EASY','MEDIUM','HARD']).optional(),
    confidenceScore: z.number().min(0).max(1).optional(),
    reasoningSignals: z.array(z.string()).max(5).optional()
  }).optional()
});
export type LessonAIResponseT = z.infer<typeof LessonAIResponse>;
```

> En tu JSON Schema de Responses API, marca `chat.image` y `chat.questionRewrite` como **opcionales** para no forzar costo innecesario.

### Paso 0.2 — Parche del prompt (líneas clave)

En `lib/ai/system-prompt.ts` **no cambies el tono/estructura**, solo añade estas 4 líneas (o equivalentes en los bloques correctos):

1. **Inicio de clase**

> “Si la sesión es nueva (recibirás `sessionSummary` vacío), haz una **breve bienvenida (1 frase)**, **presenta 2–3 objetivos** y **formula inmediatamente 1 pregunta inicial** (sin discursos largos).”

2. **Reformulación creativa**

> “Puedes **reformular creativamente** la pregunta elegida de `referenceQuestions` cuando mejore claridad o precisión. Si lo haces, retorna esa versión en `chat.questionRewrite` y úsala en el `chat.message`.”

3. **Selección de imagen**

> “Si `moment.images` está presente y alguna tiene `mustUse:true` o mejora la comprensión, selecciona una imagen y retorna `{ imageId, reason }` en `chat.image`.”

4. **Destrabar avance**

> “No te estanques: si tras 2–3 intentos persiste confusión, **cambia enfoque** (pista más directa o mini-explicación breve) y sugiere `nextStep` **REINFORCE** o **ADVANCE** según la rúbrica.”

---

## Hito 1 — Inicio de clase y primera pregunta real

**Objetivo**: cuando `LessonSession` sea `null`, Sophia **arranca** con mini-bienvenida + objetivos + **una** pregunta.

### Paso 1.1 — Modo “init” en el action

En `app/actions/sophia.ts`:

* Si **no hay sesión**:

  * Crea la sesión con `currentMomentId = 0` y `sessionSummary = ""`.
  * Llama a la IA con `studentAnswer: ""` y un flag interno `mode: "init"` **solo en el contexto user** (no cambies el system).
  * Espera JSON; guarda `AIOutcome` (turno 0) y crea un `ChatMessage(assistant)` con la **pregunta final** (usa `chat.questionRewrite ?? referenceQuestionElegida`).
* En UI, renderiza directamente esa primera pregunta.

**Checklist**

* [ ] Primera carga muestra **bienvenida+objetivos (brevísimos)** y **1 pregunta**.
* [ ] No hay saludo largo ni bloque de texto excesivo.

---

## Hito 2 — Preguntas menos “copiadas” y uso de imágenes

**Objetivo**: dar libertad de mejorar la pregunta y usar imágenes cuando aporten.

### Paso 2.1 — Selección de pregunta del momento (server)

* Implementa `chooseQuestion(moment, policy='improve')`:

  * Toma una `referenceQuestions[x]` como **semilla**, pero **permite** que la IA la mejore.
  * Tras la respuesta IA, si viene `chat.questionRewrite`, **persistir** esa versión como `questionShown` (para auditoría real de lo que el alumno vio).

### Paso 2.2 — Incluir imágenes del momento en el contexto

* Si `moment.images?.length`, añade al bloque user una sección **muy corta**:

  * “`IMÁGENES DISPONIBLES: [{id, description}]`”
  * Si alguna `mustUse:true`, añade una línea: “`Debes integrar al menos una mención/uso de la imagen id:X si ayuda.`”

### Paso 2.3 — Reflejar selección de imagen en la UI

* Si el JSON trae `chat.image`, muestra la imagen (por `imageId`) **antes** del `chat.message` o embebida en el componente (según tu diseño).
* Guarda `imageId` y `reason` en `AIOutcome` (ya está denormalizado dentro de `raw`; opcional agregar columnas después).

**Checklist**

* [ ] Las preguntas empiezan a diferir de las `referenceQuestions` (mayor claridad).
* [ ] Si el momento tiene imágenes, se ven cuando la IA las selecciona.

---

## Hito 3 — Desatascar progresión entre momentos (server-side)

**Objetivo**: que Sophia **avance** de momento cuando corresponde, y que no se quede atrapada.

### Paso 3.1 — Reglas suaves de avance/estancamiento

En el mismo `app/actions/sophia.ts` (o tu helper `decide-next`):

* Si `progress.nextStep === 'ADVANCE'` → `currentMomentId++`, `attemptsInCurrent=0`, `completedMoments.push(prev)`.
* Si `RETRY|REINFORCE` → `attemptsInCurrent++`.
* **Salida de bucle**: si `attemptsInCurrent >= 3`, fuerza:

  * Si `tags` contiene `CONCEPTUAL` → `REINFORCE` con **mini-explicación** y **nueva** `referenceQuestion`.
  * Si no, intenta `ADVANCE` si `masteryDelta` positivo dos turnos seguidos; si no, `REINFORCE` con explicación corta.

### Paso 3.2 — Ajuste del clamp y rachas

* Aplica clamp de `masteryDelta` \[-0.3, 0.3] (ya lo haces).
* Si `tags` incluye `CORRECT`, incrementa `consecutiveCorrect`; si no, resetea. Si `consecutiveCorrect>=2` y sin `CONCEPTUAL`, **permite ADVANCE** aunque el modelo recomiende REINFORCE (override suave).

**Checklist**

* [ ] Se observan cambios de `currentMomentId` en DB al responder bien.
* [ ] `attemptsInCurrent` se resetea al avanzar.
* [ ] No hay más “loop eterno”; a la 3era, cambia enfoque o avanza.


## Resultado esperado tras el PLAN:

* Sophia **abre** la clase con una bienvenida breve + objetivos y **lanza 1 pregunta** (sin cháchara).
* Las preguntas **ya no son clones** de `referenceQuestions`; se ven reformulaciones más claras.
* Sophia **progresa** de momento (con reglas suaves anti-bucle).
* La IA **puede elegir imágenes** del momento y la UI las muestra cuando corresponda.

> Todo lo anterior **reusa tu arquitectura actual**, solo agrega dos campos opcionales al contrato, 4 líneas clave al prompt y pequeñas reglas en el action.
