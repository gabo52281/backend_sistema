const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});


// ✅ Probar conexión apenas inicie el servidor
pool.query("SELECT current_database(), NOW()", (err, res) => {
  if (err) {
    console.error("❌ Error conectando a la base de datos:", err.message);
  } else {
    console.log("✅ Conectado correctamente a la base de datos:", res.rows[0].current_database);
    console.log("🕒 Hora del servidor:", res.rows[0].now);
  }
});

console.log("📡 Conectado a:", process.env.DB_NAME);

module.exports = pool;
