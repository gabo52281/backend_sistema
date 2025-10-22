const express = require("express");
const pool = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT contenido FROM notas_prueba ORDER BY actualizado_en DESC LIMIT 1"
    );
    res.json(result.rows[0] || { contenido: "Sin notas disponibles" });
  } catch (error) {
    console.error("Error al obtener notas:", error);
    res.status(500).json({ error: "No se pudieron obtener las notas" });
  }
});

module.exports = router;
