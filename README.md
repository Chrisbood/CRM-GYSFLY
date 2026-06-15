# 📊 Panel de Agente — Consola de Control de la Agencia

¡Bienvenido al **Panel de Agente**! Una plataforma premium B2B de gestión de relaciones con clientes (CRM) y planificador de tareas para agencias de viajes de alta gama. Esta aplicación combina la elegancia minimalista, la concentración y la fluidez del aclamado gestor **Things 3** con la potencia analítica de gráficos interactivos, bases de datos avanzadas de viajeros y herramientas de automatización de marketing.

---

## 🎯 ¿A quién está enfocado?

Esta plataforma ha sido diseñada específicamente para:
* **Agencias de Viajes Premium y B2B**: Que necesitan gestionar el ciclo completo de reservas de lujo, itinerarios personalizados y flujos contables complejos de sus pasajeros.
* **Agentes y Consultores de Viajes**: Que requieren un planificador diario estructurado, herramientas rápidas para emitir billetes y visados, y comunicación directa con los clientes.
* **Administradores y Directores Ejecutivos**: Que necesitan monitorizar el volumen de ventas, controlar márgenes de beneficio neto, gestionar permisos de personal (ACL) y despachar campañas de marketing directo.

---

## ✨ Funciones Más Destacadas

### 1. Dashboard General (Cuadro de Mando Ejecutivo)
* **Indicadores Clave**: Monitoreo de viajeros totales, ingresos mensuales frente a objetivos financieros (metas de ventas), campañas activas y efectividad de tareas.
* **Gráficos Históricos**: Gráfico interactivo (ChartJS) de flujo de ventas mensuales y volumen de reservas emitidas.
* **Lista de Salidas**: Planificador diario Things 3 para salidas de hoy y alertas inmediatas.
* **Vista Rápida de Clientes Recientes**: Tabla dinámica con acceso directo a fichas técnicas individuales.

### 2. Base de Datos Avanzada de Pasajeros
* **Ficha Técnica Detallada**: Información demográfica, notas de viaje confidenciales, asignación de asesores y etiquetas de segmentación VIP.
* **Módulo Financiero y Contabilidad**: Desglose automático por cliente que calcula el precio de venta, el costo operativo del proveedor, el beneficio neto y el margen de ganancia en porcentaje.
* **Gestor Documental Integrado**: Simulación de carga y descarga segura de itinerarios en PDF, billetes de avión y vouchers de hoteles.
* **Interacciones Directas**: Botones de llamada a la acción rápidos para redactar correos, emitir billetes o eliminar registros.

### 3. Filtros Demográficos en Tiempo Real y Analíticas
* **Segmentación Inteligente**: Buscador instantáneo por nombre, teléfono, país de origen, código de zona postal y mes de salida.
* **Visualización de Datos**: Gráficos circulares de distribución por países y barras dinámicas de cuota de mercado por destinos principales.

### 4. Automatización de Marketing (Campañas Masivas)
* **Creador de Campañas**: Plantillas de correo integradas para boletines mensuales, ofertas promocionales de Maldivas/Bali y avisos de visados.
* **Previsualización de Dispositivos**: Editor en vivo con vista previa adaptada a dispositivos móviles en tiempo real.
* **Consola de Envío Masivo**: Simulación completa del envío a través de protocolos SMTP seguros con barra de progreso interactiva y consola de terminal que muestra logs detallados del proceso de despacho.

### 5. Ajustes del Sistema y Seguridad (ACL)
* **Gestión de Asesores**: Permite crear, borrar y previsualizar avatares de asesores de viajes asignados.
* **Control de Acceso (ACL)**: Creación de usuarios de la consola con asignación de roles (Agente de Ventas, Administrador) y checkbox detallados de permisos individuales de lectura, escritura, borrado o ajustes.
* **Personalización de Marca**: Ajuste interactivo del nombre global de la agencia que actualiza la identidad de la marca en toda la aplicación.

---

## 🛠️ Tecnologías Utilizadas

* **Estructura y Maquetación**: HTML5 Semántico.
* **Estilos y Diseño Premium**: Tailwind CSS (con CDN y configuración extendida personalizada), fuentes de Google Fonts (Outfit) y Google Material Symbols.
* **Lógica del Cliente**: Vanilla Javascript moderno.
* **Gráficos**: Chart.js.
* **Persistencia**: LocalStorage del navegador para permitir el funcionamiento local offline sin dependencias de base de datos externas pesadas.

---

## 🚀 Cómo Empezar Localmente

1. **Clona este repositorio o descarga la carpeta.**
2. **Inicia el servidor local de desarrollo:**
   Si tienes Python3 en tu ordenador, simplemente ejecuta:
   ```bash
   python3 -m http.server 8080
   ```
   O bien, utiliza el script automatizado para Mac:
   ```bash
   bash start.sh
   ```
3. **Accede en tu navegador a:**
   [http://localhost:8080](http://localhost:8080)
4. **Credenciales de Administrador por Defecto:**
   * **Usuario:** `admin@agente.com`
   * **Contraseña:** `admin123`
