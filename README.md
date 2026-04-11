# Frontend - frontAlumno

Frontend de la aplicación `frontAlumno`, construido con Next.js y Tailwind CSS.

## Tecnologías principales

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- ESLint
- Node.js/npm

## Qué incluye este proyecto

- Rutas basadas en `app/`
- Página principal en `app/page.js`
- Dashboard y subrutas para alumnos
- Configuración inicial de ESLint y Tailwind CSS
- Desarrollo con puerto local `3001`

## Instalación desde cero

1. Clona el repositorio o copia el proyecto a tu equipo.
2. Abre una terminal en la carpeta del proyecto:

```bash
cd frontAlumno
```

3. Instala dependencias con npm:

```bash
npm install
```

> Si prefieres usar `yarn` o `pnpm`, asegúrate de tenerlos instalados y ajusta los comandos según corresponda.

## Ejecutar en desarrollo

Inicia el servidor de desarrollo con:

```bash
npm run dev
```

Luego abre en tu navegador:

```text
http://localhost:3001
```

## Compilar para producción

Para generar la versión de producción:

```bash
npm run build
```

Y para ejecutarla localmente:

```bash
npm start
```

## Linting

Verifica el código con ESLint:

```bash
npm run lint
```

## Estructura básica de carpetas

- `app/` - rutas y páginas de Next.js
- `public/` - archivos estáticos
- `src/` - código fuente de la aplicación
- `package.json` - dependencias y scripts del proyecto

## Notas

- El script de desarrollo usa `next dev -p 3001`, por eso el proyecto corre en el puerto `3001`.
- Si necesitas cambiar el puerto, ajusta el script `dev` en `package.json` o usa la variable de entorno `PORT`.
