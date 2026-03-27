import type { RagKnowledgeChunk } from "@/lib/rag/types";

export const ragKnowledgeBase: RagKnowledgeChunk[] = [
  {
    id: "gen-01",
    title: "Arquitectura funcional ARGOS",
    module: "General",
    tags: ["arquitectura", "portal", "mvp", "modulos", "nextjs"],
    content:
      "ARGOS consolida Dotacion, Inventario, Calidad y Mantenimiento en un solo portal con trazabilidad por sede y rol.",
    sampleQuestions: [
      "Cuales son los modulos principales de ARGOS?",
      "Como esta organizada la arquitectura funcional del portal?",
    ],
    operationalGuidance: {
      diagnosis: "El usuario necesita orientacion de proceso y ruta funcional.",
      actions: [
        "Identificar modulo y sede antes de ejecutar acciones.",
        "Validar rol para confirmar permisos de creacion/aprobacion.",
        "Usar tablero de pendientes como punto de inicio de jornada.",
      ],
      validations: [
        "El usuario ve solo modulos permitidos por su rol.",
        "Los listados muestran informacion de la sede correcta.",
      ],
      escalateWhen: [
        "No aparece un modulo que el rol deberia tener habilitado.",
      ],
    },
  },
  {
    id: "sec-01",
    title: "Gobierno de acceso por rol y sede",
    module: "Seguridad",
    tags: ["roles", "rbac", "sede", "acceso", "seguridad"],
    content:
      "El acceso esta controlado por roles de aplicacion y alcance por sede. SuperAdmin ve todas las sedes; roles locales operan solo su alcance.",
    sampleQuestions: [
      "Quien puede ver todas las sedes?",
      "Como se limita la informacion por sede?",
    ],
    operationalGuidance: {
      diagnosis: "Incidente tipico: usuario no ve registros esperados por filtro de sede o rol.",
      actions: [
        "Verificar rol efectivo del usuario en la sesion actual.",
        "Confirmar que la sede del registro coincida con sedes autorizadas.",
        "Revisar si el modulo tiene restricciones adicionales por perfil.",
      ],
      validations: [
        "El usuario puede abrir pantalla pero no datos fuera de su sede.",
        "Un SuperAdmin confirma visibilidad global del mismo registro.",
      ],
      preventEscalation: [
        "Evitar crear usuarios con roles redundantes y sin sede asignada.",
      ],
      escalateWhen: [
        "Existe discrepancia entre rol asignado y rol efectivo en sesion.",
      ],
    },
  },
  {
    id: "dot-01",
    title: "Ciclo de pedido de dotacion",
    module: "Dotacion",
    tags: ["pedido", "dotacion", "flujo", "estado", "aprobacion"],
    content:
      "El flujo de pedido recomendado es Borrador, EnAprobacion, Aprobado, EnviadoSAP y Rechazado.",
    sampleQuestions: [
      "¿Cuál es el flujo recomendado de un pedido de dotación?",
      "¿En qué estado puedo enviar un pedido a SAP?",
      "¿Qué validaciones debo completar antes de enviar un pedido aprobado a SAP para evitar rechazos?",
      "No me deja enviar pedido a SAP, ¿qué reviso?",
    ],
    operationalGuidance: {
      diagnosis: "Bloqueo frecuente: pedido no cumple estado o datos obligatorios para siguiente paso.",
      actions: [
        "Confirmar estado actual del pedido en detalle.",
        "Si esta en Borrador, completar campos y enviar a aprobacion.",
        "Si esta en EnAprobacion, esperar resolucion o revisar rechazos.",
        "Enviar a SAP solo cuando estado sea Aprobado.",
      ],
      validations: [
        "El historial registra transicion de estado con fecha y usuario.",
        "El boton de Enviar a SAP solo aparece en estado Aprobado.",
      ],
      escalateWhen: [
        "El estado es Aprobado pero el portal no habilita envio a SAP.",
      ],
    },
  },
  {
    id: "dot-02",
    title: "Adjuntos y trazabilidad de pedido",
    module: "Dotacion",
    tags: ["adjuntos", "auditoria", "historial", "pedido"],
    content:
      "Cada pedido mantiene adjuntos y timeline de auditoria con eventos, usuario, fecha y mensaje.",
    sampleQuestions: [
      "Que informacion guarda la auditoria del pedido?",
      "Como se gestionan adjuntos en pedidos?",
    ],
    operationalGuidance: {
      diagnosis: "Necesidad de soporte documental para aprobacion o auditoria.",
      actions: [
        "Cargar adjuntos con nombre claro y contexto del pedido.",
        "Validar que el archivo quede visible en la lista de adjuntos.",
        "Usar historial para verificar quien hizo cambios y cuando.",
      ],
      validations: [
        "Adjunto visible y descargable tras guardar.",
        "Evento de carga o cambio aparece en timeline.",
      ],
      escalateWhen: [
        "El archivo se carga pero no aparece en detalle del pedido.",
      ],
    },
  },
  {
    id: "dot-03",
    title: "Pedido rechazado y reenvio a aprobacion",
    module: "Dotacion",
    tags: ["rechazado", "reenvio", "aprobacion", "correccion"],
    content:
      "Cuando un pedido es rechazado, se corrige en detalle y se reenviar a aprobacion con trazabilidad del motivo.",
    sampleQuestions: [
      "Que hago si un pedido fue rechazado?",
      "Como reenviar un pedido a aprobacion?",
    ],
    operationalGuidance: {
      diagnosis: "El pedido no avanza por rechazo sin correccion documentada.",
      actions: [
        "Revisar motivo de rechazo en historial.",
        "Corregir datos o adjuntos observados.",
        "Registrar comentario de correccion en evento.",
        "Reenviar a aprobacion y confirmar cambio de estado.",
      ],
      validations: [
        "Nuevo evento de reenvio visible en timeline.",
        "Estado vuelve a EnAprobacion.",
      ],
      escalateWhen: [
        "No es posible cambiar de Rechazado a EnAprobacion despues de correccion.",
      ],
    },
  },
  {
    id: "inv-01",
    title: "Movimientos de inventario",
    module: "Inventario",
    tags: ["inventario", "movimientos", "ingreso", "salida", "ajuste"],
    content:
      "Inventario registra ingreso, salida y ajuste con item, bodega, ubicacion, cantidad, motivo y estado.",
    sampleQuestions: [
      "Que datos se registran en un movimiento?",
      "Que tipos de movimiento existen?",
    ],
    operationalGuidance: {
      diagnosis: "Error frecuente: movimiento incompleto genera diferencias de stock.",
      actions: [
        "Seleccionar item, bodega y ubicacion correctos antes de guardar.",
        "Validar tipo de movimiento y signo de cantidad segun proceso.",
        "Registrar motivo operativo para trazabilidad.",
      ],
      validations: [
        "Movimiento visible en listado con estado correcto.",
        "Stock refleja cambio esperado despues de aprobar/aplicar.",
      ],
      escalateWhen: [
        "El movimiento se guarda pero no impacta stock.",
      ],
    },
  },
  {
    id: "inv-02",
    title: "Ajuste de inventario con aprobacion",
    module: "Inventario",
    tags: ["ajuste", "aprobacion", "inventario", "control"],
    content:
      "Los ajustes deben enviarse a aprobacion antes de consolidar cambios sensibles de stock.",
    sampleQuestions: [
      "Cuando un ajuste requiere aprobacion?",
      "Que control aplica para diferencias de stock?",
      "Mi ajuste quedo pendiente, como lo destrabo?",
    ],
    operationalGuidance: {
      diagnosis: "Ajuste detenido en pendiente por falta de aprobacion o datos inconsistentes.",
      actions: [
        "Revisar cantidad y motivo antes de enviar a aprobacion.",
        "Confirmar que el ajuste paso a PendienteAprobacion.",
        "Dar seguimiento al aprobador y validar resolucion.",
        "Aplicar ajuste solo con estado Aprobado.",
      ],
      validations: [
        "Historial muestra evento de envio y respuesta de aprobacion.",
        "Stock final coincide con conteo fisico validado.",
      ],
      escalateWhen: [
        "Ajuste aprobado no actualiza stock final.",
      ],
    },
  },
  {
    id: "inv-03",
    title: "Diferencia de inventario por conteo fisico",
    module: "Inventario",
    tags: ["conteo", "diferencia", "bodega", "conciliacion"],
    content:
      "Las diferencias de conteo se concilian con ajuste controlado y evidencia minima de verificacion.",
    sampleQuestions: [
      "Que hago si el conteo fisico no coincide?",
      "Como conciliar diferencia de inventario?",
    ],
    operationalGuidance: {
      diagnosis: "Descuadre entre sistema y fisico por movimiento no registrado o error de ubicacion.",
      actions: [
        "Repetir conteo en ubicacion afectada con doble validacion.",
        "Revisar ultimos movimientos del item en esa bodega.",
        "Registrar ajuste con motivo de conciliacion.",
      ],
      validations: [
        "Diferencia documentada y aprobada.",
        "Stock final igual a conteo confirmado.",
      ],
      escalateWhen: [
        "Hay variacion recurrente del mismo item en menos de 7 dias.",
      ],
    },
  },
  {
    id: "cal-01",
    title: "Inspecciones de calidad",
    module: "Calidad",
    tags: ["inspeccion", "calidad", "checklist", "defectos"],
    content:
      "Calidad maneja inspecciones con checklist y defectos. El resultado de negocio se reporta como Conforme o No conforme.",
    sampleQuestions: [
      "Que incluye una inspeccion de calidad?",
      "Como se reporta un resultado no conforme?",
    ],
    operationalGuidance: {
      diagnosis: "Registro incompleto de inspeccion afecta analisis y acciones correctivas.",
      actions: [
        "Completar checklist critico antes de cerrar inspeccion.",
        "Registrar defectos con evidencia y comentario claro.",
        "Asignar resultado final consistente con evidencia.",
      ],
      validations: [
        "Inspeccion contiene checklist y resultado final.",
        "Defectos quedan vinculados a la inspeccion.",
      ],
      escalateWhen: [
        "No es posible cerrar inspeccion aun con checklist completo.",
      ],
    },
  },
  {
    id: "cal-02",
    title: "Severidad y clasificacion de defectos",
    module: "Calidad",
    tags: ["defecto", "severidad", "clasificacion", "causa"],
    content:
      "Clasificar defectos por tipo y severidad ayuda a priorizar contencion, correccion y prevencion.",
    sampleQuestions: [
      "Para que sirve registrar severidad en defectos?",
      "Como priorizar acciones de calidad?",
    ],
    operationalGuidance: {
      diagnosis: "Sin severidad, el equipo atiende por urgencia percibida y no por riesgo real.",
      actions: [
        "Asignar severidad con criterio comun del equipo.",
        "Priorizar cierre de defectos de severidad alta.",
        "Documentar causa raiz para prevenir recurrencia.",
      ],
      validations: [
        "Defectos altos tienen accion inmediata y responsable.",
        "Tendencia mensual muestra reduccion de recurrencia.",
      ],
      escalateWhen: [
        "Defecto critico se repite sin causa raiz definida.",
      ],
    },
  },
  {
    id: "cal-03",
    title: "No conforme sin evidencia",
    module: "Calidad",
    tags: ["no conforme", "evidencia", "hallazgo"],
    content:
      "Un hallazgo No conforme debe incluir evidencia minima para permitir accion correctiva efectiva.",
    sampleQuestions: [
      "Puedo marcar No conforme sin foto o comentario?",
      "Que evidencia minima debo registrar en un hallazgo?",
    ],
    operationalGuidance: {
      diagnosis: "Hallazgo sin evidencia no permite validar ni cerrar accion.",
      actions: [
        "Adjuntar evidencia visual o descripcion tecnica objetiva.",
        "Indicar lote, punto de control y criterio incumplido.",
        "Asignar responsable de contencion inmediata.",
      ],
      validations: [
        "No conforme contiene evidencia rastreable.",
        "Accion correctiva queda vinculada al hallazgo.",
      ],
      escalateWhen: [
        "Existen No conformes repetidos sin evidencia verificable.",
      ],
    },
  },
  {
    id: "man-01",
    title: "Gestion de tickets de mantenimiento",
    module: "Mantenimiento",
    tags: ["ticket", "mantenimiento", "prioridad", "tecnico", "estado"],
    content:
      "Mantenimiento gestiona tickets correctivos y preventivos con prioridad, tecnico asignado y estado operativo.",
    sampleQuestions: [
      "Que campos minimos tiene un ticket?",
      "Como se sigue la atencion tecnica?",
    ],
    operationalGuidance: {
      diagnosis: "Ticket sin datos clave retrasa asignacion y cierre tecnico.",
      actions: [
        "Registrar equipo, sintoma, prioridad y fecha de reporte.",
        "Asignar tecnico responsable y ETA inicial.",
        "Actualizar estado durante ejecucion para visibilidad operativa.",
      ],
      validations: [
        "Ticket pasa de Abierto a EnProceso y luego Cerrado.",
        "Bitacora tiene actividades con fecha y responsable.",
      ],
      escalateWhen: [
        "Ticket critico sin asignacion por mas de una ventana operativa.",
      ],
    },
  },
  {
    id: "man-02",
    title: "Actividades y bitacora tecnica",
    module: "Mantenimiento",
    tags: ["actividad", "bitacora", "tecnico", "seguimiento"],
    content:
      "La bitacora tecnica documenta acciones, repuestos y resultados de prueba para respaldo de cierre.",
    sampleQuestions: [
      "Que se registra en actividades de mantenimiento?",
      "Como se documenta un cierre tecnico?",
    ],
    operationalGuidance: {
      diagnosis: "Cierres sin evidencia tecnica generan reaperturas frecuentes.",
      actions: [
        "Registrar actividad por cada intervencion relevante.",
        "Anotar pruebas funcionales realizadas.",
        "Cerrar ticket solo si resultado es estable.",
      ],
      validations: [
        "Bitacora contiene secuencia completa de intervencion.",
        "No hay reingreso del mismo fallo en periodo corto.",
      ],
      escalateWhen: [
        "Falla reaparece dentro de 48 horas del cierre.",
      ],
    },
  },
  {
    id: "man-03",
    title: "Ticket sin tecnico asignado",
    module: "Mantenimiento",
    tags: ["ticket", "asignacion", "tecnico", "cola"],
    content:
      "Cuando no hay tecnico asignado, el ticket permanece en cola y se prioriza por criticidad de operacion.",
    sampleQuestions: [
      "Que hago si un ticket no tiene tecnico asignado?",
      "Como priorizar tickets en cola?",
    ],
    operationalGuidance: {
      diagnosis: "Cuello de botella por asignacion tardia de recursos tecnicos.",
      actions: [
        "Revisar prioridad y criticidad del equipo afectado.",
        "Asignar tecnico disponible con mayor afinidad tecnica.",
        "Si no hay capacidad, reprogramar con ETA comunicado.",
      ],
      validations: [
        "Todo ticket critico tiene tecnico y ETA en el mismo turno.",
      ],
      escalateWhen: [
        "No existe capacidad para atender ticket critico en tiempo objetivo.",
      ],
    },
  },
  {
    id: "int-01",
    title: "Integraciones y orquestacion",
    module: "Integraciones",
    tags: ["integracion", "aprobacion", "sap", "flujo", "orquestacion"],
    content:
      "Aprobaciones y SAP se ejecutan por flujos. El portal dispara solicitudes y muestra resultado sin exponer complejidad tecnica al usuario.",
    sampleQuestions: [
      "Como se integra aprobacion y SAP en el portal?",
      "Que hace el portal y que hace la capa de flujos?",
    ],
    operationalGuidance: {
      diagnosis: "Incidencia tipica: usuario espera resultado inmediato cuando el flujo es asincrono.",
      actions: [
        "Confirmar que la solicitud de flujo fue creada.",
        "Revisar estado de ejecucion y ultimo mensaje recibido.",
        "Reintentar solo si hay estado fallido con causa transitoria.",
      ],
      validations: [
        "Evento de integracion registrado en historial.",
        "Estado final sincronizado en entidad de negocio.",
      ],
      escalateWhen: [
        "Flujo en error repetido con mismo codigo de falla.",
      ],
    },
  },
  {
    id: "int-02",
    title: "Fallback demo de continuidad",
    module: "Integraciones",
    tags: ["demo", "fallback", "credenciales", "continuidad"],
    content:
      "Cuando no hay conectividad completa, modo demo permite validar experiencia funcional y entrenamiento sin bloquear adopcion.",
    sampleQuestions: [
      "Que pasa si no hay credenciales de integracion?",
      "Como funciona el modo demo de continuidad?",
    ],
    operationalGuidance: {
      diagnosis: "Entorno temporal sin credenciales productivas.",
      actions: [
        "Operar con modo demo para validar flujo de usuario.",
        "Etiquetar evidencia como simulada para no mezclar con productivo.",
      ],
      validations: [
        "No se generan efectos reales en sistemas externos.",
      ],
      escalateWhen: [
        "Se requiere certificacion final de punta a punta en ambiente real.",
      ],
    },
  },
  {
    id: "sec-02",
    title: "Sesion, csrf y controles de API",
    module: "Seguridad",
    tags: ["csrf", "sesion", "api", "proteccion", "token"],
    content:
      "Los endpoints mutables requieren sesion valida y controles de origen/CSRF para prevenir solicitudes no autorizadas.",
    sampleQuestions: [
      "Que controles de seguridad tiene la API?",
      "Por que se valida CSRF en operaciones POST?",
    ],
    operationalGuidance: {
      diagnosis: "Operacion rechazada por sesion vencida o token CSRF invalido.",
      actions: [
        "Cerrar y abrir sesion para renovar credenciales.",
        "Evitar reusar pestañas antiguas con formularios abiertos.",
        "Reintentar la accion despues de refrescar la vista.",
      ],
      validations: [
        "La operacion POST responde sin error de autorizacion.",
      ],
      escalateWhen: [
        "Error CSRF persiste con sesion nueva en multiples usuarios.",
      ],
    },
  },
  {
    id: "gen-02",
    title: "Buenas practicas para consultas al asistente",
    module: "General",
    tags: ["asistente", "rag", "preguntas", "alcance", "autoservicio"],
    content:
      "Para respuestas de mayor calidad, indicar modulo, escenario, error observado y resultado esperado.",
    sampleQuestions: [
      "Que tipo de preguntas entiende el asistente?",
      "Como redactar una pregunta para obtener mejor respuesta?",
    ],
    operationalGuidance: {
      diagnosis: "Consulta amplia sin contexto puede producir respuesta generica.",
      actions: [
        "Incluir modulo y estado actual del proceso.",
        "Describir que accion intentabas ejecutar.",
        "Indicar mensaje de error o bloqueo observado.",
      ],
      validations: [
        "La respuesta entrega pasos concretos y criterio de cierre.",
      ],
      escalateWhen: [
        "Con contexto completo no hay ruta de solucion en autoservicio.",
      ],
    },
  },
];
