# gestion-gastos-dashboard

Aplicación web para el control de gastos e ingresos personales, con planes de extenderse a finanzas de negocio y fondo de inversión. Proyecto de Taller, 5to Perito en Informática — Centro Educativo Técnico Laboral Kinal.

**Autor:** Isaí Antonio Gómez Morales — Carné 2025-177
**Identidad de marca:** VOLTUM — Tecnología Financiera

## Descripción general

La aplicación centraliza el registro de movimientos financieros de un usuario: ingresos y gastos clasificados por categoría, con un historial filtrable por periodo, tipo y categoría, y la posibilidad de exportarlo como PDF. Sigue una arquitectura cliente-servidor: un frontend en Angular que consume una API REST en Express, con PostgreSQL como base de datos a través de Prisma.

El proyecto está pensado para crecer: los módulos de Negocio y Fondo de Inversión aparecen en el menú, pero deshabilitados y marcados como "No disponible", en vez de ocultarse u mostrar datos inventados. Esto refleja el plan de crecimiento de la aplicación sin comprometer la honestidad de lo que el usuario ve.

## Estado actual

| Módulo | Estado |
|---|---|
| Autenticación (registro, login, sesión) | Completo |
| Dashboard con datos reales | Completo |
| Personal (CRUD de movimientos, filtros, PDF) | Completo |
| Negocio | Pendiente |
| Fondo de Inversión | Pendiente |

## Stack tecnológico

**Backend:** Node.js + Express + TypeScript, Prisma 7 como ORM, PostgreSQL, JWT para sesiones, bcrypt para contraseñas.

**Frontend:** Angular 22 con standalone components, formularios reactivos, y signals con `computed()` para que los datos derivados (como los totales del dashboard) se recalculen automáticamente sin gestión manual de suscripciones. La exportación a PDF usa jsPDF.

**Gestor de paquetes:** pnpm en todo el proyecto.

## Estructura del repositorio

Monorepo con `backend/` y `frontend/` como proyectos independientes, cada uno con su propio ciclo de instalación y ejecución.

## Instalación

Requiere Node, pnpm y PostgreSQL instalados.

### Clonar

```bash
git clone https://github.com/igomez-2025177/gestion-gastos-dashboard.git
cd gestion-gastos-dashboard
```

### Backend

```bash
cd backend
pnpm install
```

La primera vez, pnpm probablemente pida aprobar scripts de instalación de paquetes que compilan código nativo (bcrypt, los engines de Prisma):

```bash
pnpm approve-builds
```

Selecciona todos con espacio y confirma que sí — si le das "No" por accidente, el proceso se queda atascado y hay que repetirlo.

El `.env` ya viene en el repo con la conexión local a PostgreSQL (usuario `postgres`, password `admin`, puerto `5432`, base `gestion_gastos`). Ajusta `DATABASE_URL` si en la otra máquina la configuración es distinta.

Aplica las migraciones y genera el cliente de Prisma:

```bash
npx prisma migrate dev
npx prisma generate
```

`npx prisma generate` no es solo un paso inicial: hay que correrlo cada vez que cambie `schema.prisma`, porque el cliente de TypeScript que genera Prisma no se actualiza solo.

Levanta el servidor:

```bash
pnpm start
```

Queda corriendo en `http://localhost:3000`.

### Frontend

```bash
cd frontend
pnpm install
pnpm start
```

Queda en `http://localhost:4200`.

## Endpoints

**Autenticación:**

POST /api/auth/register → crea un usuario (siempre con rol USER, nunca configurable desde el cliente)
POST /api/auth/login → devuelve el token JWT
GET /api/auth/me → datos del usuario autenticado


El registro solo acepta correos de `gmail.com`, `hotmail.com`, `outlook.com` o `kinal.edu.gt`; cualquier otro dominio se rechaza en el backend.

**Movimientos:**

POST /api/movements → crea un ingreso o gasto
GET /api/movements → historial del usuario autenticado
PUT /api/movements/:id → edita un movimiento existente
DELETE /api/movements/:id → elimina un movimiento


Todas las rutas de movimientos requieren el token en el header `Authorization: Bearer <token>`, y el `userId` de cada movimiento se toma siempre del token verificado, nunca del cuerpo de la petición — así ningún usuario puede leer ni modificar movimientos de otra cuenta.

## Seguridad de sesión

La sesión se cierra automáticamente en dos escenarios:

1. **Vencimiento natural del JWT**, según su `exp`.
2. **Inactividad prolongada**, mediante un mecanismo de dos fases: se escuchan eventos reales de interacción (mouse, teclado, clics); si pasan 5 minutos sin ninguno, se calcula el tiempo restante real del token y se arma un segundo conteo hacia ese momento exacto. Si el usuario no vuelve a interactuar antes de que se cumpla, la sesión se cierra sola. Cualquier actividad nueva cancela el conteo y reinicia el ciclo desde cero.

## Decisiones de diseño

**El IVA es informativo, no un descuento.** El 12% de IVA ya viene incluido en el precio de cualquier compra, así que los gastos no generan ningún cálculo de impuesto adicional. La tarjeta "IVA pagado este mes" del dashboard extrae de forma aproximada cuánto de los gastos del mes correspondía a ese impuesto (`monto × 0.12 / 1.12`), sin restarlo del balance en ningún momento.

**No se calcula IGSS ni ISR.** Se implementó en una primera versión, calculando los descuentos de ley sobre ingresos de tipo Sueldo y Bono según el Decreto 10-2012. Por indicación del profesor, se retiró: ese cálculo de nómina no corresponde al alcance de esta aplicación.

**Las tarjetas sin módulo real dicen "No disponible".** En vez de ocultar Negocio y Fondo de Inversión del menú, o de mostrarles datos de ejemplo, se dejan visibles pero deshabilitadas con ese estado explícito — es una decisión de transparencia con el usuario.

## Flujo de Git

Tres ramas: `main` → `develop` → `igomez-2025177` (mi rama de trabajo diario). Los commits usan `feat:` para funcionalidad nueva y `fix:` para correcciones.

## Historial de problemas resueltos

**Migración de repositorio.** El proyecto empezó como `gestion-gastos` (solo con login/register) y se migró a `gestion-gastos-dashboard` conservando el historial completo de commits, con `git remote set-url` y push de las tres ramas.

**Identidad de Git en computadora compartida.** La configuración global del laboratorio tenía el usuario de otro compañero, así que los commits salían con su nombre. Se corrigió configurando `user.name`/`user.email` a nivel local del repo y luego también a nivel global, y arreglando el commit ya hecho con `git commit --amend --reset-author`.

**Rutas de autenticación mal copiadas.** El registro fallaba sin ningún error visible en la terminal, porque `auth.routes.ts` tenía por accidente el contenido de `movement.routes.ts` pegado encima — la ruta `/api/auth/register` apuntaba a lógica de movimientos, no de autenticación. Se corrigió restaurando el archivo correcto.

**Dashboard que no se actualizaba solo.** Los totales del menú se calculaban una sola vez al entrar a la pantalla. Se resolvió convirtiéndolos en `computed()` de Angular, que se recalculan automáticamente cada vez que cambia el listado de movimientos, sin recargar nada.

## Notas técnicas (Prisma 7)

Prisma 7 cambió varias cosas respecto a lo que se ve en la mayoría de tutoriales:

- La conexión (`url`) ya no va en `schema.prisma`, sino en un archivo aparte, `prisma.config.ts`.
- El cliente ya no se genera dentro de `node_modules`; hay que indicarle la ruta de salida con `output` en el generator.
- `PrismaClient` necesita un adapter (`@prisma/adapter-pg`) para conectarse a PostgreSQL, en vez de conectarse de forma directa.
- Si aparece "Drift detected" al migrar, en desarrollo la solución más simple es `npx prisma migrate reset` (borra y recrea la base aplicando todas las migraciones en orden).

Otras notas sueltas: `tsconfig.json` con `rootDir: "./src"` obliga a excluir `prisma.config.ts` de la compilación; Angular 22 usa `ng new nombre --directory=.` en vez de `ng new .`; en CMD de Windows se usa `rmdir /s /q` en vez de `rm -rf`; y conviene borrar los `.gitignore` que generan Prisma y Angular por separado para dejar solo uno en la raíz del repo.

## Pendiente

- Módulo de Negocio (mismo patrón que Personal: formulario, historial, filtros, PDF)
- Módulo de Fondo de Inversión (mismo patrón)
- Habilitar ambas pestañas en el menú cuando estén listas