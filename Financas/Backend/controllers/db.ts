import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + "/../.env" });

const pool = new Pool({
  host: process.env.BD_HOST,
  port: parseInt(process.env.BD_PORT!),
  user: process.env.BD_USER,
  password: process.env.BD_PASSWORD,
  database: process.env.BD_DATABASE,
});

export default pool;