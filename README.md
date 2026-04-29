# RifaGestión

Aplicación web para gestionar rifas y sorteos: campañas, boletos, participantes, cobros y sorteo de ganadores.

## ¿Qué hace?

- **Campañas y sorteos**: organiza múltiples rifas dentro de campañas.
- **Cuadrícula de boletos**: vista visual del estado de cada boleto (disponible, apartado, liquidado, vencido).
- **Participantes**: registro de compradores con historial de boletos y pagos.
- **Cobros**: abonos parciales, liquidación completa, historial de pagos por boleto.
- **Sorteo**: elige ganadores al azar entre boletos liquidados con animación de tómbola.
- **Importar / Exportar CSV**: carga masiva de boletos o exporta el listado.
- **PDF**: genera un reporte imprimible de la rifa.
- **Página pública**: los participantes pueden consultar sus boletos por teléfono sin necesidad de cuenta.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Backend / BD | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deploy | GitHub Pages (`gh-pages`) |

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (plan gratuito es suficiente)

## Configuración

### 1. Clona el repositorio

```bash
git clone https://github.com/tu-usuario/RifaGestion.git
cd RifaGestion
npm install
```

### 2. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR...
```

Encuentra estos valores en tu proyecto de Supabase → **Settings → API**.

### 3. Base de datos

Ejecuta el archivo SQL en el **SQL Editor** de Supabase:

- `supabase/rifas-schema.sql` — crea las tablas, vistas y políticas RLS.

### 4. Inicia el servidor de desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Compilación para producción |
| `npm run preview` | Vista previa del build local |
| `npm run deploy` | Build + publica en GitHub Pages |

## Deploy en GitHub Pages

El proyecto está configurado con `base: '/RifaGestion/'` en `vite.config.js`.

1. Asegúrate de que el repositorio sea público (o que tengas GitHub Pages habilitado).
2. En **Settings → Secrets → Actions** del repo, agrega las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` si quieres automatizar el deploy con CI. Para deploy manual simplemente corre:

```bash
npm run deploy
```

## Estructura del proyecto

```
src/
  pages/            # Vistas principales (Dashboard, BoletoGrid, Participantes…)
  components/       # Componentes reutilizables (modales, drawer, topbar…)
  lib/              # Queries de Supabase, hooks, utilidades
  styles/           # Temas (claro, oscuro)
supabase/
  rifas-schema.sql  # Esquema completo de la BD
```

## Primer usuario

Supabase no crea usuarios automáticamente. Regístralos desde:  
**Supabase → Authentication → Users → Invite user** o usando el formulario de registro si lo habilitas en las políticas de Auth.

## 🤝 Contribuir

Las contribuciones son bienvenidas.

---

**Última actualización**: Abril 2026

`RifaGestión v1.0` | Sistema de Gestión de Rifas y Sorteos | Powered by React + Vite + Supabase
