# ARGOS - Demo Preview visual - 28 octubre 2026

Este artefacto es una presentación de UX, no un sistema operativo ni un entregable funcional aceptado.

## Alcance

- Vista general, Ciclos y pedidos, Inventario y Datos maestros
- Identidad gráfica ARGOS con textos orientados a dotación
- Datos totalmente ficticios, señalizados en las cuatro pantallas
- Sin login real, formularios operativos, cookies, almacenamiento, integraciones ni operaciones de escritura
- URL de entrada equivalente al piloto: /login?utm_source=chatgpt.com
- Dependencias de ejecución: Node.js estándar únicamente
- No se muestra Calidad, Mantenimiento ni Asistente RAG

## Validar localmente

Ejecutar desde la raíz del checkout:

    python3 pilot-preview/build.py
    node pilot-preview/verify.mjs

QA Playwright Chromium headless en desktop, tablet y móvil. Pruebas negativas:
las escrituras devuelven HTTP 405, las APIs de negocio HTTP 403 y los módulos
fuera de alcance HTTP 404. Evidencias locales en artifacts/qa/preview-20261027/.

## Publicación

El ZIP contiene únicamente archivos del preview. Desplegar al App Service
piloto argos-dotacion-pilot, grupo rg-argos-dotacion, sin modificar servicios
empresariales ni otros ambientes. Requiere sesión Azure autorizada y respaldo
previo del piloto para permitir recuperación.

URL destino: https://argos-dotacion-pilot.azurewebsites.net/login?utm_source=chatgpt.com

Un ZIP generado no acredita que haya sido publicado. No afirmar funcionamiento
de SAP, SuccessFactors, firmas, inventario transaccional ni SSO.
