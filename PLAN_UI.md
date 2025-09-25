# Plan para Design System moderno y accesible en 4 hitos incrementales

## Hito 1: Fundaciones del Design System y tokens base

**Descripción y resultados esperados**
Establecer las fundaciones visuales del design system con tokens de diseño consistentes, tipografía mejorada y espaciado sistemático. Verás un **upgrade visual inmediato** en toda la aplicación con mejor jerarquía visual y accesibilidad.

### Paso 1.1 — Tokens de color y variables CSS custom

Extender `app/globals.css` con tokens usando `@theme` directive de Tailwind v4 y mantener compatibilidad shadcn/ui.

*Objetivo:* Paleta de colores coherente y accesible que funcione tanto en modo claro como oscuro.

#### Instrucciones

* Usar `@theme` directive para definir tokens: `--color-success`, `--color-learning`, `--color-mastery`
* Mantener tokens shadcn existentes: `--success`, `--success-foreground` para compatibilidad
* Usar formato OKLCH: `oklch(lightness chroma hue)` para consistencia
* Definir variants para light/dark mode en `:root` y `.dark`
* Asegurar contraste WCAG AA para accesibilidad

#### Consideraciones críticas:

* Usar `@theme` para generar utility classes automáticamente
* Seguir namespace pattern: `--color-*`, `--text-*`, `--spacing-*`
* Mantener compatibilidad con CSS variables mode de shadcn
* Documentar tokens con ejemplos de uso

### Paso 1.2 — Sistema tipográfico mejorado

Extender tipografía con escalas semánticas y pesos consistentes.

*Objetivo:* Jerarquía tipográfica clara que mejore la legibilidad y comprensión.

#### Instrucciones

* Usar `@theme` para definir tipografía: `--text-display`, `--text-heading-1`, `--text-heading-2`, etc.
* Definir line-height asociado: `--text-display--line-height`, `--text-heading-1--line-height`
* Configurar letter-spacing optimizado para educación
* Generar utility classes automáticamente: `text-display`, `text-heading-1`, `text-body-lg`

#### Consideraciones críticas:

* Usar sintaxis Tailwind v4: `--text-{size}` y `--text-{size}--line-height`
* Optimizar line-height para lectores jóvenes (1.6-1.8)
* Usar `font-feature-settings` para números tabulares en matemáticas

### Paso 1.3 — Espaciado y layout sistemático

Implementar sistema de espaciado consistente con grid y containers.

*Objetivo:* Layout predecible y espaciado armonioso en toda la aplicación.

#### Instrucciones

* Usar `@theme` para espaciado: `--spacing-xs`, `--spacing-sm`, hasta `--spacing-6xl`
* Definir containers: `--container-sm`, `--container-md`, `--container-lg`, `--container-xl`
* Generar utility classes: `space-xs`, `container-sm`, etc.
* Implementar sistema de grid con CSS Grid y Tailwind utilities

#### Consideraciones críticas:

* Usar múltiplos de 4px para crisp rendering (`0.25rem`, `0.5rem`, etc.)
* Namespace correcto: `--spacing-*` y `--container-*`
* Optimizar containers para tablets educativos (768px-1024px)
* Mantener breathing room para reducir fatiga visual

### Protocolo de validación (Hito 1)

* [x] `@theme` directive genera utility classes automáticamente
* [x] Tokens mantienen compatibilidad con shadcn/ui existente
* [x] Tipografía muestra jerarquía clara en componentes existentes
* [x] Espaciado es consistente usando nuevas utility classes
* [x] Colores pasan tests de contraste WCAG AA
* [x] No hay regresiones visuales en componentes existentes

---

## Hito 2: Componentes base y patrones de interacción

**Descripción y resultados esperados**
Crear componentes base reutilizables que eleven la experiencia sin ser intimidantes. Balancear **modernidad con familiaridad** para estudiantes de secundaria/preparatoria.

### Paso 2.1 — Componentes de Input mejorados

Mejorar formularios con mejor UX y feedback visual.

*Objetivo:* Inputs más claros y menos intimidantes para estudiantes.

#### Instrucciones

* Crear `InputField` con label flotante opcional
* Implementar `TextareaAutoResize` con contador de caracteres
* Añadir estados de validación con iconografía clara
* Crear `InputGroup` para inputs relacionados

#### Consideraciones críticas:

* Feedback inmediato pero no agresivo
* Errores en lenguaje amigable para estudiantes
* Iconos universalmente reconocibles

### Paso 2.2 — Componentes de feedback y estado

Desarrollar sistema de notificaciones y indicadores de progreso educativo.

*Objetivo:* Feedback claro del sistema que motive y guíe al estudiante.

#### Instrucciones

* `ProgressRing` para dominio/mastery visual
* `Toast` system con tonos educativos (aliento, corrección gentil)
* `StatusBadge` para diferentes estados de aprendizaje
* `LoadingState` components que no generen ansiedad

#### Consideraciones críticas:

* Animaciones suaves y no distrayentes
* Mensajes positivos even en casos de error
* Visual cues claros sin ser abrumadores

### Paso 2.3 — Layout components educativos

Crear layouts específicos para experiencias de aprendizaje.

*Objetivo:* Estructuras que faciliten el focus y la comprensión.

#### Instrucciones

* `LessonContainer` con sidebar opcional para navegación
* `ChatLayout` optimizado para conversación educativa
* `ProgressHeader` que muestre contexto sin distraer
* `CardStack` para mostrar conceptos paso a paso

#### Consideraciones críticas:

* Reducir cognitive load con información contextual
* Mobile-first approach para tablets educativos
* Clear visual hierarchy que no intimide

### Protocolo de validación (Hito 2)

* [ ] Componentes de input muestran feedback claro y amigable
* [ ] Sistema de notificaciones usa tono educativo apropiado
* [ ] Layouts facilitan focus en contenido sin distracciones
* [ ] Componentes son responsive y funcionan en tablets
* [ ] No hay elementos que generen ansiedad o intimidación

---

## Hito 3: Micro-interacciones y states de carga mejorados

**Descripción y resultados esperados**
Implementar micro-interacciones que **deleiten y tranquilicen** a los estudiantes. Estados de carga que eduquen en lugar de frustrar.

### Paso 3.1 — Animaciones y transiciones educativas

Crear animaciones que refuercen el aprendizaje y den feedback positivo.

*Objetivo:* Micro-interacciones que celebren el progreso y suavicen las transiciones.

#### Instrucciones

* Animaciones de "success" que celebren logros pequeños
* Transiciones de página suaves que mantengan contexto
* Hover states que inviten a la interacción
* Loading states que muestren progreso real

#### Consideraciones críticas:

* Respetar `prefers-reduced-motion` para accesibilidad
* Animaciones rápidas (< 300ms) para no retrasar
* Feedback inmediato en interacciones críticas

### Paso 3.2 — Estados de SOPHIA AI thinking

Crear estados de carga específicos para cuando SOPHIA está "pensando".

*Objetivo:* Humanizar la IA y reducir ansiedad durante procesamiento.

#### Instrucciones

* `SophiaThinking` component con typing indicator
* Mensajes contextuales sobre lo que SOPHIA está analizando
* Progress indicator que muestre etapas del procesamiento
* Timeout gracioso con mensaje tranquilizador

#### Consideraciones críticas:

* No exceder 5 segundos sin feedback visual
* Mensajes que construyan confianza en el sistema
* Fallbacks claros para errores de red

### Paso 3.3 — Gestos y shortcuts amigables

Implementar interacciones que aceleren el flujo sin ser complicadas.

*Objetivo:* Shortcuts discoverable que empoderen usuarios avanzados.

#### Instrucciones

* Enter para enviar, Shift+Enter para nueva línea
* Navegación con teclado intuitiva
* Drag & drop simple para reordenar cuando aplique
* Touch gestures básicos para mobile

#### Consideraciones críticas:

* Shortcuts deben ser discoverable (tooltips)
* Mantener compatibilidad con screen readers
* No quebrar expectativas de usuarios de mobile

### Protocolo de validación (Hito 3)

* [ ] Animaciones celebran micro-logros apropiadamente
* [ ] Estados de SOPHIA thinking reducen ansiedad
* [ ] Shortcuts son discoverable y útiles
* [ ] Todas las animaciones respetan accessibility preferences
* [ ] Performance de animaciones es óptima en dispositivos educativos

---

## Hito 4: Temas y personalización para engagement

**Descripción y resultados esperados**
Sistema de temas que permita **personalización sin overwhelm**. Estudiantes pueden adaptar la experiencia a sus preferencias mientras mantienen la integridad educativa.

### Paso 4.1 — Sistema de temas base

Implementar dark/light mode mejorado y foundation para temas personalizados.

*Objetivo:* Temas que reduzcan fatiga visual y permitan estudio en diferentes condiciones.

#### Instrucciones

* Mejorar dark mode con better contrast ratios
* `Auto` mode basado en horario (día/estudio nocturno)
* High contrast theme para accesibilidad visual
* Warm/cool variants para preferencias personales

#### Consideraciones críticas:

* Todos los temas deben pasar tests de accesibilidad
* Transición suave entre temas sin flash
* Persistir preferencia entre sesiones

### Paso 4.2 — Personalización de learning environment

Opciones de personalización que mejoren focus y motivación.

*Objetivo:* Ambiente que se adapte al estilo de aprendizaje individual.

#### Instrucciones

* Compact/comfortable density modes
* Opcional background patterns sutiles (geometric, none)
* Font size scaling para diferentes edades/preferencias
* Focus mode que oculte elementos no esenciales

#### Consideraciones críticas:

* Opciones deben ser educational, no distracting
* Defaults sólidos para estudiantes que no personalicen
* Changes deben ser immediatamente reversibles

### Paso 4.3 — Achievement themes y gamification sutil

Sistema de themes que se unlock con progreso educativo.

*Objetivo:* Motivación intrínseca through subtle environmental rewards.

#### Instrucciones

* Themes que se unlock tras completar lessons
* Subtle badge/reward system en el environment
* Seasonal themes para mantener freshness
* "Study streak" indicators visuales

#### Consideraciones críticas:

* Gamification debe ser sutil, no distracting
* Nunca lock educational content behind themes
* Motivation positiva, never shame-based

### Paso 4.4 — Performance y optimización final

Optimizar todo el design system para performance en dispositivos educativos.

*Objetivo:* Design system que funcione flawlessly en hardware limitado.

#### Instrucciones

* Audit de CSS bundle size y tree-shaking
* Lazy loading de theme assets no críticos
* Optimización de animaciones para 60fps
* Critical CSS inlining para fast first paint

#### Consideraciones críticas:

* Target: funcionar smooth en tablets de $200
* Minimize layout shifts durante theme changes
* Mantener bundle size < 50KB para design system

### Protocolo de validación (Hito 4)

* [ ] Todos los temas pasan accessibility tests
* [ ] Personalización mejora engagement sin distracción
* [ ] Achievement system motiva sin crear ansiedad
* [ ] Performance es óptima en dispositivos educativos de gama baja
* [ ] Design system completo funciona cohesivamente

---

## Archivos temporales para eliminar post-release

Los siguientes archivos serán creados durante el desarrollo del design system y deben evaluarse para mantenimiento post-release:

### Archivos de prueba a remover:
* `app/design-system/test-tokens/page.tsx` - Testing de tokens de color
* `app/design-system/test-components/page.tsx` - Gallery de componentes
* `app/design-system/test-themes/page.tsx` - Switcher de temas
* `app/design-system/test-animations/page.tsx` - Testing de micro-interacciones

### Utilities a consolidar:
* `lib/design/utils.ts` - Helper functions que puedan integrarse a utils principal
* Cualquier duplicate CSS que pueda optimizarse

### Consideraciones de mantenimiento:
* Documentar design tokens para designers futuros
* Crear storybook o similar para component reference
* Guidelines de uso para mantener consistency
* Testing visual regression para themes