# 📸 FotoGestión - Sistema de Gestión de Clientes

> Plataforma integral para fotógrafos: gestiona tus contratos de fotografía de fin de curso, clientes, entregas, pagos y contactos en un solo lugar.

## 🎯 Descripción General

**Fotografia** es una aplicación web moderna diseñada específicamente para fotógrafos que se dedican a la **fotografía de grupos de fin de ciclo**. Centraliza la gestión de tus clientes (escuelas), eventos de fin de curso, grupos de estudiantes y el seguimiento de entregas y pagos. Con una interfaz intuitiva y segura, tendrás visibilidad total del estado de tus proyectos, clientes pendientes de entregar fotos y deudas pendientes de cobro.

### Caso de uso principal
- **Gestión de clientes**: Administra múltiples escuelas/instituciones que contratan tu servicio
- **Eventos de fin de curso**: Organiza y controla cada evento fotográfico
- **Grupos de estudiantes**: Segmenta los grupos dentro de cada evento
- **Directorio de alumnos**: Mantén registro de contactos y clientes individuales
- **Control financiero**: Monitorea entregas, pagos pendientes y saldos adeudados
- **Dashboard analítico**: Visualiza ingresos, cobranzas y proyectos en progreso

---

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
- Autenticación segura mediante **Supabase Auth**
- Gestión de sesiones y perfiles de usuario
- Rutas protegidas para acceso autorizado
- Recuperación de contraseña integrada

### 📊 Dashboard Global
```
[PLACEHOLDER: Captura del Dashboard]
- Insertar imagen del dashboard principal
- Mostrar cards de ingresos totales
- Mostrar gráfico de cobranzas
```

Estadísticas en tiempo real:
- **Ingresos totales esperados**: Monto total de todos los servicios
- **Total cobrado**: Dinero ya recibido
- **Saldo pendiente**: Dinero por cobrar
- **Eventos en progreso**: Cantidad de eventos activos
- **Gráfico de progreso de cobranzas**: Visualización de ingresos vs pagos

### 🏫 Gestión de Clientes y Eventos

#### Clientes (Escuelas/Instituciones)
```
[PLACEHOLDER: Captura de listado de Escuelas]
```
- Crear, editar y eliminar clientes (escuelas)
- Información de contacto del cliente
- Historial de eventos contratados
- Resumen de saldo adeudado por cliente
- Responsable de coordinación en cada escuela

#### Eventos de Fin de Curso (Generaciones/Proyectos)
```
[PLACEHOLDER: Captura de Eventos/Generaciones]
```
- Crear eventos dentro de cada cliente
- Fechas de sesión fotográfica
- Fechas de entrega de fotos
- Precios y paquetes contratados
- Estado del evento (Programado, En progreso, Entregado, Pagado)
- Notas específicas del evento

#### Grupos de Estudiantes
```
[PLACEHOLDER: Captura de Grupos]
```
- Crear grupos dentro de cada evento
- Nombres de grupos (ej: "5to A", "6to B")
- Cantidad de estudiantes por grupo
- Foto grupal referencia
- Notas por grupo

#### Directorio de Clientes (Alumnos/Individuos)
```
[PLACEHOLDER: Captura de Listado de Estudiantes]
```
- Registro de contactos individuales
- Email y teléfono de estudiantes/padres
- Dirección y datos de entrega
- Estado de entrega (Entregado, Pendiente, Enviado)
- Pago individual (si aplica)
- Historial de fotosessiones

### 💳 Seguimiento Financiero y Entregas

#### Control de Deudas y Pagos
```
[PLACEHOLDER: Captura de Deudas]
```
- Vista centralizada de pagos pendientes
- Filtrado por cliente, evento, grupo
- Indicadores visuales de estado de pago
- Historial de pagos recibidos
- Recordatorios de cobranza
- Métodos de pago registrados

#### Gestión de Paquetes
```
[PLACEHOLDER: Captura de Paquetes]
```
- Definición de tipos de paquetes (fotos digitales, impresas, etc.)
- Precios por paquete
- Opciones de entrega (digital, impreso, ambos)
- Asignación de paquetes a grupos o individuos
- Tracking de paquetes distribuidos
- Generación de actas de entrega

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.3**: Librería UI con hooks modernos
- **Vite 5.4**: Build tool rápido y moderno
- **React Router 6.26**: Navegación y ruteo SPA
- **Lucide React 0.44**: Iconografía escalable

### Backend & Database
- **Supabase**: Backend as a Service (Auth + PostgreSQL)
- **PostgreSQL**: Base de datos relacional

### Herramientas
- **TypeScript** (configurado): Type safety
- **Vite + React Plugin**: Desarrollo HMR (Hot Module Replacement)

---

## 📦 Instalación

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase configurada

### Pasos de Instalación

1. **Clonar repositorio**
```bash
git clone <repository-url>
cd fotografia
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env.local
touch .env.local
```

Agregar variables:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo con hot reload
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview

# Deploy a GitHub Pages
npm run deploy
```

---

## 📁 Estructura del Proyecto

```
fotografia/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Breadcrumbs.jsx       # Navegación breadcrumbs
│   │   ├── ConfirmModal.jsx      # Modal de confirmación
│   │   ├── ErrorModal.jsx        # Modal de errores
│   │   ├── LoadingSpinner.jsx    # Indicador de carga
│   │   ├── ProgressBar.jsx       # Barra de progreso
│   │   ├── ProtectedRoute.jsx    # Wrapper de rutas protegidas
│   │   ├── StatusBadge.jsx       # Indicadores de estado
│   │   ├── TagsInput.jsx         # Input de tags/múltiples valores
│   │   ├── Topbar.jsx            # Barra superior de navegación
│   │   └── WhatsAppBtn.jsx       # Botón flotante WhatsApp
│   │
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Login.jsx             # Página de login
│   │   ├── Dashboard.jsx         # Dashboard principal
│   │   ├── Instituciones.jsx     # Listado de instituciones
│   │   ├── Generaciones.jsx      # Proyectos por institución
│   │   ├── Grupos.jsx            # Grupos dentro de proyecto
│   │   ├── AlumnosList.jsx       # Estudiantes de un grupo
│   │   ├── AlumnoDetail.jsx      # Detalle de estudiante
│   │   ├── Deudas.jsx            # Control de deudas
│   │   └── Paquetes.jsx          # Gestión de paquetes
│   │
│   ├── lib/                 # Utilidades y contextos
│   │   ├── auth.js               # Funciones de autenticación
│   │   ├── AuthContext.jsx       # Contexto de autenticación
│   │   ├── supabase.js           # Configuración de Supabase
│   │   ├── queries.js            # Consultas a base de datos
│   │   ├── formatters.js         # Funciones de formato (moneda, etc)
│   │   ├── parseError.js         # Parseo de errores
│   │   ├── toast.jsx             # Notificaciones toast
│   │   ├── useBreadcrumbs.js     # Hook para breadcrumbs
│   │   └── useQuery.js           # Hook personalizado de queries
│   │
│   ├── assets/              # Recursos estáticos (imágenes, etc)
│   ├── App.jsx              # Componente raíz
│   ├── main.jsx             # Punto de entrada React
│   ├── index.css            # Estilos globales
│   └── style.css            # Estilos adicionales
│
├── supabase/                # Scripts SQL
│   ├── seed.sql            # Datos iniciales (seed)
│   └── fix-rls.sql         # Configuración de políticas RLS
│
├── public/                  # Archivos públicos estáticos
├── package.json
├── vite.config.js
├── tsconfig.json
└── index.html
```

---

## 🔐 Autenticación

### Flujo de Login
```
[PLACEHOLDER: Captura de Pantalla de Login]
```

El sistema utiliza **Supabase Auth** con las siguientes características:

1. **Email + Contraseña**: Autenticación tradicional
2. **Recuperación de contraseña**: Integrada en Supabase
3. **Sesión persistente**: Se mantiene entre recargas
4. **Logout**: Cierre de sesión seguro

---

## 📊 Navegación y Flujo de Datos

```
┌─ Login
│
└─ Dashboard Global
    ├─ Clientes (Escuelas)
    │   └─ Eventos de Fin de Curso
    │       ├─ Grupos de Estudiantes
    │       │   └─ Estudiantes Individuales
    │       │       └─ Información de Entrega y Pago
    │       │
    │       └─ Paquetes Fotográficos
    │
    ├─ Control de Pagos (Deudas y Cobranzas)
    │   └─ Historial de Transacciones
    │
    └─ Base de Datos de Clientes (Estudiantes)
        └─ Directorio de Contactos
```

---

## 💾 Base de Datos

### Tablas Principales
```
[PLACEHOLDER: Diagrama ER (Entity Relationship)]
```

Tablas configuradas en Supabase:
- `perfiles` - Perfil de usuarios/fotógrafos
- `instituciones` - Clientes (escuelas que contratan el servicio)
- `proyectos` - Eventos de fin de curso
- `grupos` - Grupos de estudiantes dentro de cada evento
- `alumnos` - Base de datos de clientes individuales (estudiantes)
- `deudas` - Registro de pagos pendientes y cobranzas
- `paquetes` - Tipos de paquetes fotográficos ofrecidos
- `pagos` - Historial de transacciones y cobranzas

### Row Level Security (RLS)
Las políticas RLS están configuradas en `supabase/fix-rls.sql` para garantizar que solo el fotógrafo/administrador acceda a la información de sus clientes y eventos.

---

## 🎨 Interfaz de Usuario

### Componentes Principales

**Topbar (Barra de Navegación)**
- Menú principal
- Usuario conectado
- Logout
- Navegación rápida

**Breadcrumbs**
- Navegación por niveles
- Contexto visual de ubicación

**Modales**
- Confirmación de acciones
- Gestión de errores
- Diálogos interactivos

**Status Badges**
- Indicadores visuales de estado
- Código de colores

**Loading Spinner**
- Indicador de carga de datos
- Mensajes informativos

### Paleta de Colores
```
[PLACEHOLDER: Especificar colores principales]
- Colores primarios
- Colores de estado (éxito, error, advertencia)
- Colores de fondo
```

---

## 🔧 Configuración

### Variables de Entorno
```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anonima

# [Agregar otras variables según necesite]
VITE_APP_NAME=Fotografia
VITE_APP_VERSION=0.1.0
```

### Vite Configuration
Base URL para deployment en subdirectorio:
```javascript
base: '/FotografiaGestion/'
```

---

## 📱 Características Adicionales

### Notificaciones
```
[PLACEHOLDER: Captura de Toast/Notificaciones]
```
Sistema de notificaciones tipo **toast** para:
- Confirmación de acciones
- Alertas de errores
- Mensajes informativos

### Integración WhatsApp
Botón flotante para contacto directo:
- Componente `WhatsAppBtn.jsx`
- Link compartible para mensajes

### Exportación y Reportes
```
[PLACEHOLDER: Captura de opciones de exportación]
```

---

## 🐛 Gestión de Errores

### Error Handling
- Parsing centralizado de errores en `parseError.js`
- Mensajes amigables al usuario
- Logging de errores en consola
- Modal de error para casos críticos

---

## 🚀 Deployment

### GitHub Pages
```bash
npm run deploy
```

Automáticamente:
1. Compila la aplicación
2. Genera archivos en `dist/`
3. Publica en rama `gh-pages`

### Requisitos
- Repositorio con permisos de Pages habilitados
- Variable `base` en `vite.config.js` correcta

---

## 📚 Guía de Uso

### Para Fotógrafos / Dueños del Negocio

#### 1. Acceso Inicial
```
[PLACEHOLDER: Captura Login]
- Ingresar email y contraseña
- Recordar credenciales
```

#### 2. Revisión del Dashboard
```
[PLACEHOLDER: Captura Dashboard con números]
- Ver estado de ingresos esperados vs cobrados
- Identificar eventos activos
- Detectar clientes con pagos pendientes
```

#### 3. Gestión de Clientes (Escuelas)
```
[PLACEHOLDER: Captura CRUD Instituciones]
- Agregar nueva escuela/institución cliente
- Registrar datos de contacto del responsable
- Editar información de cliente
- Eliminar cliente (con confirmación)
```

#### 4. Creación de Eventos Fotográficos
```
[PLACEHOLDER: Captura creación de Eventos/Generaciones]
- Crear nuevo evento de fin de curso
- Establecer fecha de sesión fotográfica
- Establecer fecha de entrega
- Definir paquetes y precios
- Asignar grupos de estudiantes
```

#### 5. Registro de Grupos y Participantes
```
[PLACEHOLDER: Captura creación de Grupos]
- Crear grupos dentro del evento
- Registrar estudiantes por grupo
- Datos de contacto de estudiantes/padres
- Información de entrega (dirección, email)
```

#### 6. Control de Entregas
```
[PLACEHOLDER: Captura estado de entregas]
- Marcar grupos/individuos como fotografiados
- Registrar fotos enviadas
- Actualizar estado de entrega
- Generar acta de entrega
```

#### 7. Seguimiento de Pagos y Cobranzas
```
[PLACEHOLDER: Captura Deudas con filtros]
- Ver todos los pagos pendientes
- Filtrar por cliente o evento
- Registrar pagos recibidos
- Generar recordatorios de cobranza
- Exportar comprobantes
```

---

## 💡 Tips y Mejores Prácticas

1. **Organización por cliente**: Siempre comienza desde el listado de Clientes (Escuelas) para mantener todo organizado
2. **Registra datos completos**: Incluye email, teléfono y dirección de padres/responsables para contacto y entrega
3. **Actualiza entregas regularmente**: Marca como entregado apenas envíes las fotos para mantener control
4. **Revisa deudas pendientes**: Consulta el apartado de deudas al menos 1 vez por semana
5. **Usa el breadcrumb**: Navega entre niveles usando los breadcrumbs para entender dónde estás
6. **Confirma cambios**: Presta atención a los toasts de confirmación cuando guardes cambios
7. **Contacto directo**: Usa el botón de WhatsApp para contactar rápidamente a clientes
8. **Genera reportes**: Usa exportación para generar reportes de entrega y cobranzas
9. **Paleta de colores**: Observa los indicadores visuales (colores) para entender rápidamente estados

---

## 📞 Soporte y Contacto

```
[PLACEHOLDER: Información de contacto - Personaliza con tus datos]
- Tu email de contacto
- Tu teléfono/WhatsApp
- Tu sitio web (si aplica)
- Tus redes sociales
- Horarios de atención
```

---

## 🗺️ Roadmap Futuro

- [ ] Galería fotográfica integrada con previsualizaciones
- [ ] Exportar reportes de entregas a PDF
- [ ] Notificaciones automáticas por email/WhatsApp
- [ ] Generador de actas de entrega digital
- [ ] Descarga en lote de fotos por grupo
- [ ] Sistema de recordatorios de cobranza automáticos
- [ ] Análisis de rentabilidad por evento

---

## ❓ FAQ

**P: ¿Cómo registro un nuevo cliente (escuela)?**
R: Ve a la sección "Clientes" y haz clic en "Agregar Nuevo Cliente". Completa datos de contacto del responsable.

**P: ¿Puedo crear múltiples eventos con la misma escuela?**
R: Sí, cada escuela puede tener varios eventos (uno por año o por nivel escolar). Crea eventos desde el detalle del cliente.

**P: ¿Puedo exportar listados de clientes?**
R: Sí, hay opción de exportación en los listados principales para generar reportes en PDF/Excel.

**P: ¿Los clientes pueden ver sus fotos directamente en la app?**
R: No, esta versión es solo para administración. Las fotos se comparten de otra forma (enlace directo, galería externa, etc).

**P: ¿Qué navegadores están soportados?**
R: Chrome, Firefox, Safari y Edge en sus versiones recientes.

**P: ¿Puedo acceder desde mi teléfono?**
R: Sí, la aplicación es responsive y funciona en móviles, aunque está optimizada para desktop.

---

## 📝 Changelog

### v0.1.0 (Actual)
- ✅ Autenticación segura con Supabase
- ✅ Dashboard con estadísticas de ingresos y cobranzas
- ✅ Gestión de clientes (escuelas/instituciones)
- ✅ Creación de eventos fotográficos
- ✅ Organización de grupos y estudiantes
- ✅ Registro de contactos de clientes
- ✅ Control de entregas de fotos
- ✅ Gestión de pagos y deudas pendientes
- ✅ Sistema de notificaciones (toast)
- ✅ Integración con WhatsApp para contacto
- ✅ Exportación de datos
- ✅ Responsive design para móviles


## 🤝 Contribuir

Las contribuciones son bienvenidas.

---

**Última actualización**: Abril 2026

`Fotografia v0.1.0` | Sistema de Gestión para Fotógrafos | Powered by React + Vite + Supabase
