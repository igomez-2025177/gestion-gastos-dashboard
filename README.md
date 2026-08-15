# gestion-gastos

App para llevar el control de gastos e ingresos, personales y de negocio. Es mi proyecto de Taller de 5to Perito en Informática, Kinal.

Carné 2025-177 — Isaí Antonio Gómez Morales

## De qué se trata

La idea es tener un solo lugar donde se puedan registrar los gastos e ingresos, clasificarlos por categoría, poner presupuestos y ver todo en un panel, sin mezclar las finanzas personales con las de un negocio. Ahora mismo el proyecto todavía está en la parte de autenticación, después viene el módulo de movimientos.

## Con qué está hecho

**Backend:**
- Node.js + Express + TypeScript
- Prisma 7 (ORM) + PostgreSQL
- JWT para las sesiones, bcrypt para las contraseñas

**Frontend:**
- Angular 22, standalone components
- Formularios reactivos

Todo se maneja con pnpm en vez de npm.

## Estructura del repo

```
gestion-gastos/
  backend/     -> API en Express
  frontend/    -> Angular
```

Está armado como monorepo, un solo repositorio para las dos partes.

## Cómo levantarlo en otra computadora

Esto asume que ya tienes Node, pnpm y PostgreSQL instalados.

### 1. Clonar

```bash
git clone https://github.com/igomez-2025177/gestion-gastos.git
cd gestion-gastos
```

### 2. Backend

```bash
cd backend
pnpm install
```

La primera vez que instales, es probable que pnpm te pida aprobar unos paquetes que compilan cosas nativas (bcrypt, prisma). Corre:

```bash
pnpm approve-builds
```

Selecciona todos con espacio, dale enter, y cuando pregunte "Do you approve?" contesta que sí (ojo con esto, si le das a "No" sin querer se queda pegado).

El `.env` ya viene incluido en el repo con la conexión a PostgreSQL local (usuario `postgres`, password `admin`, puerto `5432`, base `gestion_gastos`). Si en la otra máquina el usuario o password de Postgres es distinto, hay que cambiar la línea `DATABASE_URL` a mano.

Genera el cliente de Prisma:

```bash
npx prisma generate
```

Y levanta el servidor:

```bash
pnpm start
```

La primera vez que corre, un script (`ensure-db.ts`) revisa si la base `gestion_gastos` existe en tu Postgres, y si no, la crea solo. No hay que crearla a mano.

Debería quedar corriendo en `http://localhost:3000`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
pnpm install
pnpm start
```

Queda en `http://localhost:4200`.

## Endpoints que hay ahorita

```
POST /api/auth/register    -> crea un usuario (siempre como rol USER)
POST /api/auth/login       -> devuelve el token
GET  /api/auth/me          -> datos del usuario logueado (necesita token)
```

El token se manda en el header: `Authorization: Bearer <token>`

## Cosas que fueron dando lata al armar esto (por si se repiten)

- **Prisma 7 cambió bastante cosas** respecto a lo que se ve normalmente en tutoriales. Ya no se pone el `url` de la base en el `schema.prisma`, ahora va en `prisma.config.ts`. Y el cliente de Prisma ya no se genera automático en `node_modules`, hay que decirle a dónde generarlo con `output` en el generator.

- El **PrismaClient también cambió** cómo se instancia — ahora pide un "adapter" (`@prisma/adapter-pg`) en vez de conectarse directo.

- pnpm bloquea por default los scripts de instalación de paquetes que compilan cosas nativas (bcrypt, los engines de Prisma). Si `pnpm start` o `pnpm install` se traba raro, correr `pnpm approve-builds`.

- El `tsconfig.json` con `rootDir: "./src"` no deja que TypeScript compile nada que esté fuera de esa carpeta — por eso el cliente de Prisma generado y el `prisma.config.ts` tuvieron que quedar excluidos o dentro de `src`.

- Angular 22 ya no deja usar `ng new .` para generar el proyecto en la carpeta actual, ahora es `ng new nombre --directory=.`

- Windows con CMD no reconoce comandos de Linux como `rm -rf`, hay que usar `rmdir /s /q` o similar.

- El `.gitignore` que genera Prisma al hacer `prisma init` y el que genera Angular al hacer `ng new` pueden pisar o duplicar reglas del `.gitignore` de la raíz del repo — mejor borrarlos y dejar solo uno en la raíz.

## Flujo de Git que uso

```
main -> develop -> igomez-2025177
```

Todo el trabajo diario va en mi rama (`igomez-2025177`), y de ahí se integra a `develop`.

## Qué falta

- Interceptor HTTP para que el frontend mande el token automático en cada petición
- Módulo de gastos e ingresos (el corazón del proyecto)
- Categorías y presupuestos
- Conectar el dashboard (por ahora es solo la idea visual, sin datos reales)
