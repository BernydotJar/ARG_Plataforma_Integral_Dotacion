# ARG Plataforma Integral Dotacion

Repositorio base para el desarrollo de la plataforma integral de gestion de dotacion.

## Estado
- Rama principal (`main`) inicializada.
- Rama de desarrollo (`dev`) creada para concentrar cambios funcionales.

## Objetivo del proyecto
Centralizar el flujo de solicitudes de dotacion con:
- Alta y seguimiento de pedidos.
- Priorizacion y aprobaciones.
- Registro de observaciones y trazabilidad.
- Integracion futura con API y automatizaciones.

## Convencion de ramas
- `main`: estable/produccion.
- `dev`: integracion de cambios.
- `feature/*`: desarrollo por funcionalidad.
- `hotfix/*`: correcciones urgentes.

## Proximo paso recomendado
Subir el codigo fuente de frontend/backend a `dev` y abrir PR hacia `main` una vez validado.

## Checklist tecnico inicial
- Definir stack (frontend y backend).
- Configurar CI (lint + tests + build).
- Definir estrategia de despliegue.
- Agregar validaciones de seguridad de inputs.
