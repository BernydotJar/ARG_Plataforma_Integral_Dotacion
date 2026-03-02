# ARGOS - Alcance Consolidado y Plan de Implementacion 90 Dias

**Fuentes de referencia**
- `Anexo 03 - Alcance- Aplicativo Dotacion_.pdf`
- `Propuesta_Tecnica_DATTICS_Argos_WebCustom.docx`
- `ARGOS_Propuesta_WebCustom_RFP.docx`

**Fecha de actualizacion:** 2 de marzo de 2026  
**Horizonte contractual:** 3 anos  
**Ventana del plan de 90 dias:** del 2 de marzo de 2026 al 31 de mayo de 2026

---

## 1. Objetivo del documento

Consolidar el alcance funcional y tecnico del programa ARGOS, reflejar la arquitectura objetivo aprobada (sin Dataverse), y establecer un plan ejecutable para los primeros 90 dias del contrato.

Este documento actua como baseline de ejecucion para negocio, arquitectura de solucion, desarrollo y gobierno del proyecto.

---

## 2. Alcance total consolidado

### 2.1 Objetivo de negocio

Digitalizar y controlar de punta a punta el proceso de dotacion para 3,000+ colaboradores, con trazabilidad operativa, cumplimiento de seguridad corporativa y capacidad de evolucion en 3 anos.

### 2.2 Arquitectura objetivo (actualizada)

La solucion objetivo es **Web Custom sobre Azure**, con este stack:

- Frontend: **Next.js + TypeScript + Fluent UI**
- BFF: **Route Handlers de Next.js** (control de sesion, RBAC, validaciones)
- Backend de negocio: **.NET 8 Web API**
- Persistencia: **Azure SQL Database**
- Auth: **Microsoft Entra ID (SSO)** + **Entra External ID/B2C** para operarios
- Integracion SSFF: **Azure Functions + SFTP**
- Orquestacion documental/notificaciones: **Power Automate**
- Integracion SAP Fase 1: **archivo plano** (preparado para API/BAPI en fase evolutiva)
- Seguridad: WAF/Front Door, Key Vault, MFA, anti-bot/captcha

### 2.3 Usuarios y roles

- Super Administrador
- Administrador Local
- Usuario Pedidos
- Usuario Final (Colaborador)
- Operario Bodega
- Inspector Calidad
- Tecnico Mantenimiento

### 2.4 Alcance funcional por fases

#### Fase 1 (objetivo de implementacion inicial)

1. Master data y migracion inicial (colaboradores, sedes, kits, tallas, CeCos, prendas, precios)
2. Actualizacion de tallas por ventana de tiempo
3. Pedido masivo por ciclo (consolidado nacional y ajustes locales)
4. Flujo de entrega con trazabilidad y evidencia
5. Reportes operativos base (por sede, consolidado, financiero, entregas)
6. Integracion con SSFF para altas/bajas/cambios
7. Integracion SAP por archivo plano
8. Seguridad minima obligatoria (headers, MFA, captcha, control de acceso)

#### Fase 2 (evolutivos)

1. Inventario intersede con aprobaciones
2. Alarmas operativas y notificaciones avanzadas
3. PQRS completo con SLA y satisfaccion
4. Gestion ampliada de proveedores
5. Reporteria avanzada y analitica

---

## 3. Estado actual del aplicativo y alineacion

## 3.1 Avance tecnico ya implementado en el repo

1. Portal enterprise Next.js con shell modular y UX responsive
2. Auth Entra + sesion segura + RBAC por rol/sede
3. Modulos activos: Pedidos, Inventario, Calidad, Mantenimiento, Admin
4. Flujos de aprobacion/SAP integrados (HTTP/stub)
5. Adjuntos en pedidos con auditoria
6. Observabilidad inicial (request id y correlation id)
7. Pivot de arquitectura ya aplicado en codigo:
- Se retiro runtime Dataverse
- Se implemento runtime real contra **Backend API**
- Se mantuvo modo demo como fallback

## 3.2 Brecha contra el alcance total

### Cobertura alta

- Portal web unificado
- Seguridad base y roles
- Estructura modular para Fase 1
- Integracion de flujos de aprobacion/SAP

### Cobertura parcial

- Contrato definitivo de endpoints con backend .NET
- Cargas masivas completas de negocio
- Reporteria formal por perfil
- Integracion documental/firma avanzada

### Cobertura baja / pendiente critica

- Integracion SSFF productiva por SFTP (job y reglas operativas)
- Motor de kits completo (genero/cargo/sede/ciclo + opcionales)
- Flujo de entrega con firma legalmente valida y custodia documental
- PQRS funcional end-to-end
- Endurecimiento de seguridad productiva (WAF, politicas completas, monitoreo)

---

## 4. Plan de implementacion de 90 dias (marzo-mayo 2026)

## 4.1 Objetivo de la ventana

Salir de los primeros 90 dias con una **Fase 1 operable para piloto ampliado**, con integraciones base, seguridad corporativa minima y trazabilidad auditable.

## 4.2 Plan por etapas (alineado a propuesta DATTICS)

### Etapa 1 - Levantamiento y diseno funcional

- Semanas: 1 a 3 (2 al 22 de marzo de 2026)
- Entregable: wireframes finales + historias priorizadas + criterios de aceptacion
- Resultado: backlog funcional aprobado por negocio

### Etapa 2 - Setup de infraestructura y CI/CD

- Semanas: 2 a 4 (9 al 29 de marzo de 2026)
- Entregable: ambientes DEV/QA, pipeline CI/CD, seguridad base de plataforma
- Resultado: base operativa para desarrollo continuo

### Etapa 3 - Identidad y accesos (SSO + B2C)

- Semanas: 4 a 7 (23 de marzo al 19 de abril de 2026)
- Entregable: login corporativo + login operario + MFA/politicas
- Resultado: control de acceso por rol/sede validado

### Etapa 4 - Integracion SFTP con SuccessFactors

- Semanas: 6 a 8 (6 al 26 de abril de 2026)
- Entregable: job SFTP para altas, bajas y cambios + auditoria de sincronizacion
- Resultado: ciclo de vida de colaboradores automatizado

### Etapa 5 - Modulos core de Fase 1

- Semanas: 8 a 12 (20 de abril al 31 de mayo de 2026)
- Entregable: motor de kits, maestro de tallas, pedido masivo, flujo de entrega, reportes base
- Resultado: Fase 1 lista para UAT final y go-live controlado por olas

---

## 5. Backlog priorizado de 90 dias

## 5.1 Must Have (go-live Fase 1)

1. Contrato API versionado (frontend <-> backend .NET)
2. Motor de kits por cargo/genero/sede/ciclo
3. Cargas masivas criticas (colaboradores, tallas, kits, ajustes)
4. Usuario Pedidos: consolidado + archivo SAP plano
5. Flujo de entrega con evidencia + trazabilidad completa
6. Integracion SSFF productiva (SFTP)
7. Reportes operativos minimos por rol/sede
8. Seguridad base productiva (captcha, MFA, headers, hardening)

## 5.2 Should Have

1. Certificado/constancia descargable de entrega
2. Flujo base de devolucion/garantia
3. Notificaciones operativas de eventos criticos

## 5.3 Could Have

1. PQRS completo con bandeja e interaccion
2. Alarmas avanzadas de inventario y periodos
3. Dashboard ejecutivo avanzado

---

## 6. Plan de 3 anos (macro)

- Ano 1: implementacion + estabilizacion + adopcion operativa
- Ano 2: escalamiento funcional (Fase 2) + automatizacion adicional
- Ano 3: optimizacion continua, eficiencia operativa, mejora de costo/rendimiento

---

## 7. Riesgos y mitigaciones

1. Retraso en credenciales/rutas SFTP SSFF
- Mitigacion: gestion temprana de dependencias y plan alterno de carga controlada.

2. Definicion tardia del layout SAP/plano
- Mitigacion: cerrar contrato de interfaz en semanas 1-2.

3. Falta de contrato API estable entre equipos
- Mitigacion: OpenAPI versionado, mock server y pruebas de contrato.

4. Aprobacion legal/tactica de firma digital
- Mitigacion: entrega por etapas (evidencia primero, firma avanzada luego) sin bloquear flujo principal.

5. Crecimiento de alcance en Fase 1
- Mitigacion: gobierno estricto Must/Should/Could y control formal de cambios.

---

## 8. Gobierno y metricas

### 8.1 Gobierno

- Comite tecnico-funcional semanal
- Comite ejecutivo quincenal
- Demo por sprint con acta de aceptacion

### 8.2 KPIs

- % historias criticas completadas por sprint
- % cobertura de alcance Fase 1
- Defectos criticos abiertos/cerrados
- Lead time de requerimiento a despliegue
- Exito UAT por rol
- Disponibilidad de integraciones SSFF/SAP

---

## 9. Recomendacion ejecutiva

La ruta recomendada es mantener el enfoque **Web Custom + .NET API + Azure SQL**, cerrar en 90 dias una Fase 1 realmente operable y luego escalar en el trimestre siguiente con Fase 2.

Para proteger el contrato de 3 anos, se debe priorizar integracion SSFF, motor de kits, flujo de entrega trazable y seguridad productiva como condiciones de salida de la fase inicial.
