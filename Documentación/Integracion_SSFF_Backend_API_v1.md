# Integracion SSFF - Backend API v1

## 1. Objetivo

Definir el contrato tecnico entre el portal ARGOS (Next.js BFF) y el backend .NET 8 para la sincronizacion de colaboradores desde SuccessFactors (SFTP).

Este documento soporta el plan de 90 dias en la etapa de integraciones (SSFF).

## 2. Alcance de la integracion

- Consultar estado de la ultima sincronizacion SSFF.
- Ejecutar sincronizacion manual bajo demanda.
- Registrar corrida con trazabilidad operativa.

No incluye en esta version:

- Configuracion de credenciales SFTP.
- Visualizacion detallada de errores por registro (se hara en v1.1).
- Reproceso parcial por archivo especifico.

## 3. Endpoints esperados en backend .NET

### 3.1 GET `/integraciones/ssff/estado`

Respuesta 200 esperada:

```json
{
  "data": {
    "currentStatus": "Idle",
    "lastSuccessfulAt": "2026-03-02T01:00:00.000Z",
    "lastExecutionAt": "2026-03-02T01:00:00.000Z",
    "nextScheduledAt": "2026-03-02T13:00:00.000Z",
    "recentRuns": [
      {
        "id": "ssff-run-20260302-0100",
        "status": "Success",
        "startedAt": "2026-03-02T00:55:00.000Z",
        "finishedAt": "2026-03-02T01:00:00.000Z",
        "durationMs": 300000,
        "altas": 7,
        "bajas": 2,
        "cambios": 14,
        "errores": 0,
        "triggeredBy": "scheduler@argos.local",
        "source": "scheduled"
      }
    ]
  }
}
```

### 3.2 POST `/integraciones/ssff/sync`

Request body:

```json
{
  "mode": "manual",
  "sinceDate": "2026-03-01T00:00:00.000Z",
  "triggeredBy": "admin.local@argos.com"
}
```

Respuesta 202 esperada:

```json
{
  "data": {
    "accepted": true,
    "runId": "ssff-run-20260302-1530",
    "status": "Running",
    "message": "Sincronizacion SSFF iniciada"
  }
}
```

## 4. Semantica funcional

- `currentStatus`:
  - `Idle`: sin corrida en ejecucion
  - `Running`: corrida activa
  - `Success`: ultimo ciclo exitoso
  - `Failed`: ultimo ciclo fallido

- `mode` en trigger:
  - `manual`: sincronizacion normal bajo demanda
  - `retry`: reintento de ultima corrida fallida

## 5. Seguridad y trazabilidad

- El backend debe aceptar y propagar:
  - `x-correlation-id` (enviado por Next.js)
- El backend debe responder:
  - `x-request-id` por cada respuesta
- Errores deben incluir mensaje tecnico trazable para soporte L2/L3.

## 6. Reglas de negocio minimas esperadas

1. Altas: crear colaborador y asignar kit por reglas vigentes.
2. Bajas: inhabilitar colaborador (sin borrado fisico).
3. Cambios: actualizar sede/cargo y recalcular kit si aplica.
4. Idempotencia por archivo/corrida para evitar reprocesos duplicados.
5. Registro de auditoria por corrida con resumen de resultados.

## 7. Consideraciones operativas

- Frecuencia recomendada del job programado: diaria.
- Recomendado agregar corrida extraordinaria al cierre de periodos de tallas/pedidos.
- Si `errores > 0`, exponer reporte descargable de rechazos por fila en v1.1.

## 8. Relacion con el portal

Pantalla asociada en portal:

- `/admin/integraciones`

APIs BFF implementadas en este repo:

- `GET /api/integraciones/ssff/estado`
- `POST /api/integraciones/ssff/sync`
