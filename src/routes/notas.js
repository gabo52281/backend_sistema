const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// ✅ Obtener la nota más reciente
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, contenido FROM notas_prueba ORDER BY actualizado_en DESC LIMIT 1"
    );
    res.json(result.rows[0] || { id: null, contenido: "" });
  } catch (error) {
    console.error("❌ Error al obtener notas:", error);
    res.status(500).json({ error: "No se pudieron obtener las notas" });
  }
});

// ✅ Actualizar o crear nota (público, sin autenticación)
router.post("/", async (req, res) => {
  const { contenido } = req.body;

  if (!contenido) {
    return res.status(400).json({ error: "Contenido requerido" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO notas_prueba (contenido)
      VALUES ($1)
      ON CONFLICT (id) DO UPDATE SET contenido = $1, actualizado_en = NOW()
      RETURNING id, contenido
    `,
      [contenido]
    );

    res.json({ mensaje: "Nota guardada ✅", data: result.rows[0] });
  } catch (error) {
    console.error("❌ Error al guardar nota:", error);
    res.status(500).json({ error: "No se pudo guardar la nota" });
  }
});

module.exports = router;
