# Doscientos para Raycast

Extensión local para usar las herramientas anunciadas por el MCP de Doscientos desde Raycast. Está pensada para uso personal y no necesita publicarse en la Store.

## Comandos

- **Doscientos**: menú de accesos rápidos.
- **Buscar leads**: búsqueda en vivo, filtro por estado, resultados por última actualización, detalle básico y enlace a la ficha del backoffice.
- **Operativa diaria**: resumen de prioridades devuelto por `get_daily_operations`.
- **Explorar herramientas MCP**: lista automáticamente las herramientas que publique el servidor. Los campos se generan desde el JSON Schema MCP. Los campos complejos aceptan JSON. Las acciones de escritura piden confirmación antes de enviarse.

## Requisitos

- Raycast para Windows.
- Node.js 22.14 o posterior disponible en el `PATH` (o ruta a `node.exe` configurada en preferencias).
- MCP local de Doscientos construido, con `scripts/start-stdio.mjs`, `dist/server.js` y `.env.local` presente.
- Dependencias de la extensión instaladas con `npm install`.

## Desarrollo local

Desde esta carpeta:

```powershell
npm install
npm run dev
```

En Raycast, busca **Doscientos**, **Buscar leads**, **Operativa diaria** o **Explorar herramientas MCP**. Para cambios en el código, deja `npm run dev` activo; Raycast aplica las actualizaciones de desarrollo.

## Preferencias

En Raycast > Preferences > Extensions > Doscientos:

- **Carpeta del MCP local**: carpeta raíz del MCP, que contiene `scripts/start-stdio.mjs` y `.env.local`.
- **Ejecutable de Node.js**: normalmente `node`. Usa la ruta completa a `node.exe` si Raycast no lo encuentra en el `PATH`.

La extensión inicia `node scripts/start-stdio.mjs` con esa carpeta como directorio de trabajo. El MCP carga `.env.local` por sí mismo. Las claves no se copian a preferencias de Raycast ni al código de la extensión.

## Instalar en otro ordenador

1. Instala Raycast y Node.js 22.14+.
2. Clona o copia el repositorio privado de Doscientos y configura el MCP con sus credenciales locales en `.env.local` siguiendo su README.
3. Instala las dependencias del MCP y compílalo (`pnpm install` y `pnpm build`).
4. Abre esta carpeta de extensión en Raycast con **Import Extension**, o ejecútala desde el terminal con `npm install` y `npm run dev`.
5. Ajusta **Carpeta del MCP local** y **Ejecutable de Node.js** en preferencias.

## Límites actuales

- El explorador refleja automáticamente nuevas herramientas del MCP, pero ofrece formularios genéricos. Para una experiencia más rápida, se pueden ir creando comandos dedicados para tareas recurrentes.
- Las listas y formularios se construyen desde las herramientas y esquemas MCP disponibles en el momento; todavía no hay conexión de IA dentro de Raycast.
- No hay acceso directo a la base de datos desde la extensión: cada lectura o escritura atraviesa el servidor MCP.
