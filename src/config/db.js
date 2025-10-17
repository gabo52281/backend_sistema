const { Pool } = require("pg");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
  // 🌐 Conexión a Neon (producción)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log("🌍 Conectando a base de datos Neon...");
} else {
  // 💻 Conexión local
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });
  console.log("💻 Conectando a base de datos local...");
}

// ✅ Prueba inmediata
pool.query("SELECT current_database(), NOW()", (err, res) => {
  if (err) {
    console.error("❌ Error conectando a la base de datos:", err.message);
  } else {
    console.log("✅ Conectado correctamente a la base de datos:", res.rows[0].current_database);
    console.log("🕒 Hora del servidor:", res.rows[0].now);
  }
});

module.exports = pool;
