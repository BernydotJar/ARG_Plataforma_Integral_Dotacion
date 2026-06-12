# Asistente Conversacional RAG Demo (ARGOS)

## 1) Objetivo
Este asistente es un **RAG simulado** para apoyar a usuarios de ARGOS con respuestas contextuales sobre procesos operativos, estados, controles y flujos de los módulos del portal.

En este piloto:
- No ejecuta acciones transaccionales.
- No modifica datos de negocio.
- No consulta sistemas externos en tiempo real.
- Sí responde usando recuperación de conocimiento (base demo) + citaciones.

## 2) Qué funcionalidades RAG incluye
- Conversación multi-turno (usa el historial reciente).
- Recuperación de conocimiento por similitud léxica.
- Filtro por módulo (`Todos`, `Dotación`, `Inventario`, `Calidad`, `Mantenimiento`, `Integraciones`, `Seguridad`).
- Respuesta con **fuentes/citaciones** (título, módulo, snippet, score).
- Indicador de confianza estimada.
- Fallback cuando la consulta está fuera de alcance, con sugerencias.

## 3) Qué se le puede preguntar

### 3.1 General / Arquitectura
- "¿Cuáles son los módulos principales de ARGOS?"
- "¿Cómo está organizada la arquitectura funcional del portal?"
- "¿Qué alcance tiene el MVP?"

### 3.2 Dotación / Pedidos
- "¿Cuál es el flujo recomendado de un pedido de dotación?" (Pregunta principal)
- "¿En qué estado puedo enviar un pedido a SAP?" (Pregunta principal)
- "¿Qué validaciones debo completar antes de enviar un pedido aprobado a SAP para evitar rechazos?" (Pregunta principal)
- "¿Qué registra la trazabilidad del pedido?"
- "¿Cómo se gestionan adjuntos y auditoría?"

### 3.3 Inventario
- "¿Qué tipos de movimientos de inventario existen?"
- "¿Qué campos debe tener un movimiento?"
- "¿Cuándo un ajuste de inventario requiere aprobación?"
- "¿Qué control aplicar para diferencias de stock?"

### 3.4 Calidad
- "¿Qué incluye una inspección de calidad?"
- "¿Cómo se reporta un resultado No conforme?"
- "¿Para qué sirve la severidad de defectos?"
- "¿Cómo priorizar acciones correctivas?"

### 3.5 Mantenimiento
- "¿Qué datos mínimos debe tener un ticket de mantenimiento?"
- "¿Cómo se hace seguimiento técnico de un ticket?"
- "¿Qué se registra en la bitácora de actividades?"
- "¿Cómo documentar un cierre técnico?"

### 3.6 Integraciones
- "¿Cómo se separa la lógica del portal y la orquestación de flujos?"
- "¿Qué hace el portal y qué hace la capa de integración?"
- "¿Cómo opera el modo demo cuando no hay conectividad completa?"

### 3.7 Seguridad
- "¿Cómo se controla acceso por rol y sede?"
- "¿Qué rol tiene visibilidad global?"
- "¿Qué controles de sesión y API se validan?"
- "¿Por qué se usa protección CSRF en operaciones mutables?"

## 4) Preguntas fuera de alcance (en este demo)
- "Apruébame este pedido ahora" (acción transaccional real).
- "Conéctate a SAP y tráeme el estado en vivo" (consulta externa real-time).
- "Dame credenciales o secretos de integración" (información sensible).
- "Haz cambios en Dataverse / SQL" (escritura de datos productivos).

## 5) Buenas prácticas para preguntar
- Indicar módulo: "En Inventario...".
- Describir escenario: "cuando hay diferencia de stock...".
- Pedir salida específica: "dámelo en checklist" o "en pasos".
- Si la respuesta es amplia, pedir: "resúmelo en 5 puntos".

## 6) Ejemplos de prompts recomendados
- "En Dotación, explícame los estados y qué validación aplica antes de enviar a SAP."
- "En Inventario, dame checklist para un ajuste con aprobación."
- "En Calidad, diferencia entre Conforme y No conforme y cómo registrarlo."
- "En Mantenimiento, flujo operativo desde ticket abierto hasta cierre."
- "En Seguridad, resume RBAC por rol y alcance por sede."

## 7) Nota técnica del piloto
El asistente RAG demo disponible en `/asistente-rag` utiliza:
- UI conversacional con sugerencias rápidas.
- API interna `POST /api/rag/chat` (portal dinámico).
- Motor local de recuperación (`src/lib/rag/*`) y base de conocimiento simulada.

Para GitHub Pages (`pilot-static`) se usa versión estática del mismo comportamiento (sin API server).
