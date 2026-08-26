# gestion-gastos

App para llevar el control de gastos e ingresos, personales y de negocio. Es mi proyecto de Taller de 5to Perito en Informática, Kinal.

Carné 2025-177 — Isaí Antonio Gómez Morales

## De qué se trata

La idea es tener un solo lugar donde se puedan registrar gastos e ingresos, clasificarlos por categoría, poner presupuestos y ver todo en un panel, sin mezclar las finanzas personales con las de un negocio. Ahorita el proyecto todavía está en la parte de autenticación, después sigue el módulo de movimientos que es el que de verdad importa.

## Con qué está hecho

Backend: Node.js + Express + TypeScript, con Prisma 7 de ORM y PostgreSQL de base de datos. Para las sesiones se usa JWT y las contraseñas van con bcrypt.

Frontend: Angular 22 con standalone components y formularios reactivos.

Todo con pnpm, no se usa npm para nada de esto.

## Estructura del repo

Es un monorepo, un solo repositorio para las dos partes.

## Cómo levantarlo en otra computadora

Esto asume que ya tienen Node, pnpm y PostgreSQL instalados.

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

La primera vez casi seguro les va a pedir aprobar unos paquetes que compilan cosas nativas (bcrypt, prisma):

```bash
pnpm approve-builds
```

Seleccionen todos con espacio, denle enter, y cuando pregunte si aprueban díganle que sí. Ojo con esto porque si le dan "No" sin querer se queda pegado y hay que repetir todo.

El `.env` ya viene incluido en el repo con la conexión a PostgreSQL local (usuario `postgres`, password `admin`, puerto `5432`, base `gestion_gastos`). Si en la otra máquina el usuario o password de Postgres es distinto, cambien la línea `DATABASE_URL` a mano.

Después generen el cliente de Prisma:

```bash
npx prisma generate
```

**Importante:** esto no es solo un paso de la instalación inicial, hay que correrlo cada vez que cambie el `schema.prisma` (agregar un modelo, un campo, lo que sea). Si de repente TypeScript empieza a marcar error en algo que antes funcionaba y tiene que ver con Prisma, casi siempre es porque falta correr esto de nuevo.

Y levanten el servidor:

```bash
pnpm start
```

La primera vez que corre, hay un script (`ensure-db.ts`) que revisa si la base `gestion_gastos` ya existe en su Postgres, y si no la crea solo. No hace falta crearla a mano.

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

El token se manda en el header `Authorization: Bearer <token>`.

Para el registro solo se aceptan correos de gmail.com, hotmail.com, outlook.com o kinal.edu.gt, cualquier otro dominio lo rechaza.

## Cosas que dieron lata al armar esto (por si se repiten)

Prisma 7 cambió bastante respecto a lo que se ve en la mayoría de tutoriales. Ya no se pone el `url` de la base en el `schema.prisma`, ahora va en `prisma.config.ts`. Y el cliente de Prisma ya no se genera automático adentro de `node_modules`, hay que decirle a dónde generarlo con `output` en el generator.

El PrismaClient también cambió cómo se instancia, ahora pide un "adapter" (`@prisma/adapter-pg`) en vez de conectarse directo a la base.

pnpm bloquea por default los scripts de instalación que compilan cosas nativas (bcrypt, los engines de Prisma). Si `pnpm start` o `pnpm install` se traban raro, corran `pnpm approve-builds`.

El `tsconfig.json` con `rootDir: "./src"` no deja que TypeScript compile nada que esté fuera de esa carpeta, por eso el cliente de Prisma generado y el `prisma.config.ts` tuvieron que quedar excluidos o dentro de `src`.

Angular 22 ya no deja usar `ng new .` para generar el proyecto en la carpeta actual, ahora es `ng new nombre --directory=.`

Windows con CMD no reconoce comandos de Linux como `rm -rf`, hay que usar `rmdir /s /q`.

El `.gitignore` que genera Prisma al hacer `prisma init` y el que genera Angular al hacer `ng new` se pisan o duplican reglas con el `.gitignore` de la raíz del repo, mejor bórrenlos y dejen solo uno en la raíz.

## Flujo de Git que uso

Todo el trabajo diario va en mi rama (`igomez-2025177`), y de ahí se integra a `develop`.

## Qué falta

- Interceptor HTTP para que el frontend mande el token automático en cada petición
- Módulo de gastos e ingresos (el corazón del proyecto)
- Categorías y presupuestos
- Conectar el dashboard con datos reales (por ahora las tarjetas dicen "No disponible")