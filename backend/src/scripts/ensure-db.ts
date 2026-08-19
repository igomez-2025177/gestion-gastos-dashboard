import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function ensureDatabaseExists() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("No se encontró DATABASE_URL en el .env");
    process.exit(1);
  }

  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace("/", "");

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  const client = new Client({ connectionString: adminUrl.toString() });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rowCount === 0) {
      console.log(`La base "${dbName}" no existe, creándola...`);
      if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
        throw new Error(`Nombre de base de datos inválido: ${dbName}`);
      }
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Base "${dbName}" creada correctamente.`);
    } else {
      console.log(`La base "${dbName}" ya existe, todo listo.`);
    }
  } catch (error) {
    console.error("Error verificando/creando la base de datos:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

ensureDatabaseExists();