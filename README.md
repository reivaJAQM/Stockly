# Stockly - Sistema de Gestion de Inventario, Ventas y Punto de Venta (POS)

Stockly es una solucion integral para la administracion y control operativo de comercios minoristas y pequenas empresas. Proporciona herramientas avanzadas para la gestion de inventario, registro de ventas en tiempo real, control de gastos, administracion de clientes y emision de comprobantes digitales.

---

## Tabla de Contenidos

1. [Caracteristicas Principales](#caracteristicas-principales)
2. [Arquitectura y Tecnologias](#arquitectura-y-tecnologias)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalacion y Configuracion](#instalacion-y-configuracion)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Scripts Disponibles](#scripts-disponibles)
7. [Modelo de Datos](#modelo-de-datos)
8. [Licencia](#licencia)

---

## Caracteristicas Principales

### Punto de Venta (POS)
- Registro agil de transacciones en caja con soporte para multiples metodos de pago (Efectivo, Tarjeta, Transferencia).
- Calculo automatico de subtotales, descuentos, impuestos y cambio en efectivo.
- Generacion instantanea de comprobantes digitales.

### Control de Inventario y Catalogo
- Administracion detallada de productos (SKU, codigos de barra, categorias, costos y precios de venta).
- Ajuste rapido de existencias mediante controles directos en tabla y ajustes por lote (entradas por compra, salidas por merma, conteos fisicos).
- Metricas de valuacion en tiempo real: valor total a costo e ingreso potencial retail.
- Alertas automaticas de productos con stock bajo o agotado.

### Gestion Financiera y Gastos
- Registro categorizado de egresos y gastos operativos.
- Panel analitico con indicadores clave de rendimiento (KPIs) sobre ingresos, egresos y balance neto.
- Graficas dinamicas de tendencias de ventas y ranking de productos con mayor rotacion.

### Administracion de Clientes y Proveedores
- Directorio centralizado de clientes con historial de compras y contacto telefonico.
- Registro de proveedores asociados al abastecimiento de mercaderia.

---

## Arquitectura y Tecnologias

### Frontend
- **React 18**: Biblioteca principal para interfaces de usuario reactivas.
- **Vite**: Entorno de desarrollo rapido y empaquetador de produccion.
- **Tailwind CSS**: Framework de estilos para interfaces limpias y adaptativas.
- **Lucide React**: Conjunto de iconografia vectorial optimizada.

### Backend
- **Node.js**: Entorno de ejecucion del lado del servidor.
- **Express.js**: Framework para la creacion de servicios y endpoints RESTful.
- **pg (node-postgres)**: Cliente de conexion de alto rendimiento para PostgreSQL.
- **Dotenv**: Gestion segura de variables de entorno.

### Base de Datos
- **PostgreSQL**: Sistema de gestion de bases de datos relacional transaccional (ACID).

---

## Requisitos Previos

Antes de iniciar el proyecto en un entorno local, asegurese de contar con:

- **Node.js**: Version 18.0.0 o superior.
- **npm**: Version 9.0.0 o superior.
- **PostgreSQL**: Version 14 o superior en ejecucion local o remota.

---

## Instalacion y Configuracion

### 1. Clonar el repositorio
```bash
git clone https://github.com/reivaJAQM/Stockly.git
cd Stockly
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Cree un archivo `.env` en la raiz del proyecto tomando como referencia `.env.example`:

```bash
cp .env.example .env
```

Edite el archivo `.env` con las credenciales de su entorno:

```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://usuario:password@localhost:5432/stockly_db
```

### 4. Inicializar la Base de Datos
Cree la base de datos en PostgreSQL:

```bash
createdb stockly_db
```

Las tablas e indices relacionales se inicializan de forma automatica al arrancar el servidor backend por primera vez.

### 5. Iniciar la aplicacion en desarrollo
```bash
npm run dev
```

- Interfaz Web: `http://localhost:3000`
- API Backend: `http://localhost:5001`

---

## Estructura del Proyecto

```text
Stockly/
├── server/
│   ├── db.js                 # Configuracion del pool y esquema relacional PostgreSQL
│   ├── index.js              # Punto de entrada de la API Express
│   ├── routes/               # Endpoints REST (productos, ventas, gastos, clientes, etc.)
│   └── services/             # Servicios auxiliares del backend
├── src/
│   ├── components/
│   │   ├── common/           # Componentes UI reutilizables
│   │   ├── customers/        # Vistas y modales de gestion de clientes
│   │   ├── dashboard/        # Panel principal con metricas y graficas
│   │   ├── expenses/         # Modulo de egresos y control de gastos
│   │   ├── inventory/        # Catalogo, ajuste de stock y valorizacion
│   │   ├── layout/           # Sidebar, Navbar y estructura global
│   │   ├── sales/            # Punto de venta (POS), historial y recibos
│   │   ├── settings/         # Configuraciones generales del negocio
│   │   └── suppliers/        # Gestion de proveedores
│   ├── context/              # Context API para el estado global de la aplicacion
│   ├── services/             # Cliente API para consumo de endpoints backend
│   ├── utils/                # Utilidades de formato y fechas
│   ├── App.jsx               # Enrutamiento y vistas principales
│   └── main.jsx              # Punto de entrada de React
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Reglas de exclusion de Git
├── package.json              # Dependencias y scripts del proyecto
├── tailwind.config.js        # Configuracion de diseno y estilos
└── vite.config.js            # Configuracion de Vite
```

---

## Scripts Disponibles

- `npm run dev`: Inicia concurrentemente el servidor de desarrollo de Vite y la API backend.
- `npm run build`: Genera el paquete optimizado de produccion en la carpeta `dist`.
- `npm run preview`: Previsualiza localmente la compilacion de produccion.

---

## Modelo de Datos

El sistema utiliza las siguientes entidades principales en PostgreSQL:

- **products**: Catalogo de articulos, precios, costos y stock disponible.
- **orders**: Registro maestro de transacciones de venta.
- **order_items**: Detalle de articulos vendidos por cada orden.
- **expenses**: Registro de egresos y gastos clasificados.
- **customers**: Clientes registrados y datos de contacto.
- **suppliers**: Proveedores y empresas de distribucion.
- **stock_movements**: Registro de auditoria para entradas y salidas de bodega.
- **activity_logs**: Trazabilidad de eventos y operaciones del sistema.
- **store_settings**: Configuracion institucional del negocio.

---

## Licencia

Este proyecto esta bajo licencia privada para uso comercial y administrativo.
