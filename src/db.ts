import "dotenv/config";
import { Pool } from "pg";

// Connect to the local PostgreSQL container (values come from .env)
export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT ?? 5432),
});

// If the database stops while the server is running, log it instead of crashing
pool.on("error", (err) => {
  console.error("Database connection error:", err.message);
});
