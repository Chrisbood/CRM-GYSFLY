# Sistema de Diseño de Panel de Agente

El Panel de Agente es una plataforma premium de gestión de relaciones con clientes (CRM) y tareas, que combina la elegancia minimalista, la concentración y la fluidez de **Things 3** con la potencia visual de analíticas interactivas, bases de datos avanzadas de clientes y herramientas de campañas de marketing.

---

## 🎨 Paleta de Colores (Color Palette)

Nuestra paleta de colores busca inspirar confianza, dinamismo y un ambiente premium. Usamos un modo oscuro sofisticado ("Obsidian Glass") y un modo claro limpio ("Arctic Paper") con acentos vibrantes.

### Colores Principales
- **Primario (Destacado):** Violeta a Índigo Neón (`#6366F1` a `#8B5CF6`) - Representa creatividad, innovación y fluidez.
- **Éxito (Success):** Esmeralda Eléctrico (`#10B981`) - Usado para estados activos, ingresos, importaciones completadas.
- **Atención (Warning):** Ámbar Cálido (`#F59E0B`) - Para tareas pendientes o contactos que requieren atención inmediata.
- **Peligro (Danger):** Coral Vibrante (`#EF4444`) - Para cancelaciones, eliminaciones o alertas críticas.

### Fondos y Superficies (Dark Mode / Obsidian Glass)
- **Fondo Base:** `#090D16` (Negro obsidiana con matiz azul profundo)
- **Superficie de Tarjetas:** `#111827` con bordes suaves de `#1F2937` y opacidad glassmorphism.
- **Bordes e Hilos:** Conectores fluidos y líneas finas de `rgba(255, 255, 255, 0.08)`.

---

## ✍️ Tipografía (Typography)

- **Fuente Principal:** `Outfit` o `Inter` (de Google Fonts)
- **Criterios de Uso:**
  - **Títulos de Secciones (H1):** `SemiBold` o `Bold`, tamaño grande (`32px`), tracking ligeramente cerrado (`-0.02em`) para un look moderno y premium.
  - **Títulos de Tarjetas (H3/H4):** `Medium`, `18px`, limpios y muy legibles.
  - **Cuerpo del Texto:** `Regular`, `14px` o `15px`, color suave (`#9CA3AF` en modo oscuro) para evitar la fatiga visual.

---

## 📐 Formas y Bordes (Shapes & Roundness)

- **Esquinas de Contenedores y Tarjetas:** Redondeado fluido de `16px` (`border-radius: 16px;`). Da un aspecto moderno, amigable y limpio.
- **Botones e Inputs:** Redondeado de `10px` para diferenciar los elementos interactivos de las tarjetas estructuradas.
- **Efectos de Sombra (Glow):** Sombras difusas y resplanderes sutiles (`box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.15)`) para destacar los elementos activos al hacer hover.

---

## ✨ Micro-Interacciones y Animaciones

1. **Efecto Things 3 "Magic Add":** Un botón flotante "+" con una micro-animación fluida de rotación que despliega un creador rápido de clientes o tareas con campos dinámicos.
2. **Efecto de Hover en Tarjetas:** Elevación sutil en 3D (`transform: translateY(-4px) scale(1.01); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`).
3. **Flujos de Carga/Descarga:** Gráficos que se llenan con animaciones fluidas al arrastrar o descargar archivos de clientes.

---

## 🖥️ Estructura de Pantallas (Key Screen Concepts)

### 1. Panel de Administración y Dashboard General (Visual & Sorprendente)
- **Barra Lateral Estilo Things 3:** Secciones como *Inbox*, *Hoy*, *Clientes Activos*, *Campañas*, *Analíticas*, y *Ajustes*, pero con iconos dinámicos y contadores brillantes.
- **Gráficos Premium:** Gráfico de líneas o áreas interactivo que muestra las tasas de carga y descarga de clientes, crecimiento mensual y efectividad de campañas.
- **Mini-Tarjetas de Estadísticas:** Clientes totales, Campañas activas, Tareas del día y Flujo de almacenamiento.

### 2. Base de Datos Interactiva de Clientes
- **Lista de Clientes Premium:** Tarjetas expandibles individuales que muestran Nombre, Teléfono, Correo, Estado de Carga (ej. Activo, En Espera) y un medidor visual de interacción.
- **Campos de Datos Completos:** Nombres, Correo, Teléfono, Notas, Etiquetas personalizadas y el historial de descargas/cargas de archivos.
- **Interacción Completa:** Botones para enviar correos directamente, programar llamadas o asignar tareas de Things 3 a ese cliente en particular.

### 3. Utilidades de Campañas y Gestión
- **Creador de Campañas:** Plantillas visuales para diseñar campañas de correo.
- **Segmentación Inteligente:** Selección de clientes por etiquetas o comportamiento con un solo clic.

---

Este sistema de diseño combina el minimalismo enfocado y la simplicidad funcional de Things 3 con la espectacularidad visual y los gráficos interactivos de una herramienta de CRM de última generación.
