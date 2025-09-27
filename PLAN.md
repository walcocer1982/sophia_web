### Resumen ejecutivo (1 párrafo)

Vamos a extraer toda la lógica de IA a **tres archivos mínimos** siguiendo un patrón semi-hexagonal (`core.ts` para lógica pura, `providers.ts` para adaptadores, `index.ts` como facade) y a adelgazar el **action** que hoy mezcla responsabilidades para que solo delegue; mantenemos separación clara sin over-engineering. Resultado: arquitectura limpia semi-hexagonal, solo 3 archivos, misma UI y misma DB, lista para experimentar y escalar sin reescribir nada.

---

## Hito 1 — Crear arquitectura semi-hexagonal con **3 archivos mínimos**

**Qué implementamos**

* **Tres módulos con responsabilidades claras**:

  **`lib/ai/core.ts`** – Lógica pura del dominio:
  * `composePrompt(slots)` – función pura que arma el **prompt por slots** con topes de tokens (ROL/TAREA, PERFIL, ESTADO, RESUMEN≤250, ÚLTIMOS_K≤350).
  * `validate(jsonLike)` – validación estricta del JSON de salida (usa tu Zod actual, importado).
  * `distillSummary(prevSummary, lastPair)` – "destilación" del **resumen vivo** (≤250 tokens) para memoria barata.
  * Tipos del dominio: `TurnInput`, `TurnResult`.

  **`lib/ai/providers.ts`** – Adaptadores de proveedores:
  * `callOpenAI(prompt, userMessage)` – implementación con OpenAI.
  * `callVercel(prompt, userMessage)` – stub para Vercel AI SDK.
  * Interface `AIProvider` para futura extensibilidad.

  **`lib/ai/index.ts`** – Facade público:
  * `callAI(prompt, userMessage)` – punto de entrada único que delega al provider correcto según `process.env.AI_PROVIDER`.
  * Re-exporta las funciones de `core.ts` para consumo externo.

**Qué cambiamos**

* **No tocamos UI ni DB**. Solo movemos la lógica a estos 3 archivos con separación clara de responsabilidades.

**Qué logramos**

* Un **núcleo de IA** con arquitectura semi-hexagonal: dominio puro separado de adaptadores, pero sin complejidad excesiva.

---

## Hito 2 — Adelgazar el action: delega todo a `lib/ai/`

**Qué implementamos**

* En tu **server action** actual:

  1. Leer auth/ids y **cargar** lo que ya cargas de DB (como hoy).
  2. Importar desde `lib/ai/index.ts`:
     ```typescript
     import { composePrompt, callAI, validate, distillSummary } from '@/lib/ai';
     ```
  3. Llamar a `composePrompt(...)` pasando facts/estado/resumen/últimos turnos.
  4. Ejecutar `callAI(...)` con el prompt compuesto.
  5. `validate(...)` la salida del modelo.
  6. Persistir exactamente **con tus helpers actuales** (mismos imports/Prisma).
  7. Ejecutar `distillSummary(...)` y guardar el **nuevo** resumen.
  8. Retornar `TurnResult` a la UI **sin cambiar la forma** de la respuesta.

**Qué cambiamos**

* El action queda en ~40–60 líneas y **no** importa SDKs de IA ni prompts; **solo** usa el facade público de `lib/ai/`.

**Qué logramos**

* Separación real de responsabilidades con **cero impacto** en UI/DB; el action es solo un orquestador delgado.

---

## Hito 3 — Implementar switch de proveedor con extensibilidad

**Qué implementamos**

* En `lib/ai/providers.ts`:
  * Interface `AIProvider` para estandarizar proveedores:
    ```typescript
    interface AIProvider {
      name: string;
      call(prompt: string, userMsg: string): Promise<string>;
      validateConfig(): boolean;
    }
    ```
  * Implementación completa de `OpenAIProvider`.
  * Stub de `VercelProvider` con error claro ("no implementado").

* En `lib/ai/index.ts`:
  * Switch limpio por `process.env.AI_PROVIDER || 'openai'`.
  * Registro de providers disponibles.
  * Fallback inteligente si el provider no existe.

**Qué cambiamos**

* **Nada** en UI/DB. **Nada** en rutas. Solo una variable de entorno el día que quieras alternar proveedores.

**Qué logramos**

* Arquitectura preparada para múltiples proveedores sin tocar el dominio ni la UI.
* Fácil A/B testing entre proveedores cambiando una variable de entorno.

---

### Mapa de archivos semi-hexagonal (final)

```
lib/
  ai/
    core.ts        # Lógica pura: composePrompt, validate, distillSummary, tipos
    providers.ts   # Adaptadores: OpenAIProvider, VercelProvider, interface AIProvider
    index.ts       # Facade público: callAI con switch, re-exports de core
app/
  actions/
    sophia.ts      # Action delgado, delega en lib/ai/; UI intacta
```

### Presupuesto de contexto (para bajar costo desde ya)

* **RESUMEN** vivo ≤ **250 tokens** (destilación por turno).
* **ÚLTIMOS K turnos** truncados ≤ **350 tokens** (K≈3).
* **FACTS/ESTADO/PERFIL** ultra-compactos (≤100–160 tokens cada uno).
* **Hard cap** de contexto (sin input actual): **≤1200 tokens**.

---

### Ventajas de la Arquitectura Semi-Hexagonal

* **Separación clara**: Dominio (core) independiente de infraestructura (providers).
* **Testeable**: Lógica pura en `core.ts` es fácil de testear sin mocks.
* **Extensible**: Agregar un nuevo provider es solo implementar la interface.
* **Mantenible**: Cada archivo tiene una responsabilidad única y clara.
* **Sin over-engineering**: Solo 3 archivos, sin capas innecesarias.

Esta arquitectura te da el balance perfecto entre simplicidad y escalabilidad para el futuro.
