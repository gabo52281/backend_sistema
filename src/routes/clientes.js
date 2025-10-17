const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 🟢 Crear cliente
 * Solo pueden hacerlo admin o cajeros
 */
router.post("/crear", authMiddleware(["admin", "cajero"]), async (req, res) => {
  const { nombre, telefono, direccion } = req.body;
  const { id_admin } = req.user;

  if (!nombre) {
    return res.status(400).json({ error: "El nombre del cliente es obligatorio" });
  }

  try {
    await pool.query(
      `INSERT INTO clientes (nombre, telefono, direccion, id_admin)
       VALUES ($1, $2, $3, $4)`,
      [nombre, telefono || null, direccion || null, id_admin]
    );

    res.status(201).json({ mensaje: "Cliente registrado correctamente" });
  } catch (error) {
    console.error("❌ Error al registrar cliente:", error);
    res.status(500).json({ error: "Error al registrar cliente" });
  }
});

/**
 * 📋 Listar clientes del negocio
 */
router.get("/", authMiddleware(["admin", "cajero"]), async (req, res) => {
  const { id_admin } = req.user;

  try {
    const result = await pool.query(
      "SELECT * FROM clientes WHERE id_admin = $1 ORDER BY creado_en DESC",
      [id_admin]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al listar clientes:", error);
    res.status(500).json({ error: "Error al listar clientes" });
  }
});

/**
 * ✏️ Editar cliente
 * Solo el admin del negocio puede hacerlo
 */
router.put("/:id_cliente", authMiddleware(["admin"]), async (req, res) => {
  const { id_cliente } = req.params;
  const { nombre, telefono, direccion } = req.body;
  const { id_admin } = req.user;

  try {
    const result = await pool.query(
      `UPDATE clientes 
       SET nombre = $1, telefono = $2, direccion = $3
       WHERE id_cliente = $4 AND id_admin = $5`,
      [nombre, telefono, direccion, id_cliente, id_admin]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado o no pertenece a este negocio" });
    }

    res.json({ mensaje: "Cliente actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar cliente:", error);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

/**
 * 🗑️ Eliminar cliente
 * Solo el admin puede hacerlo
 */
router.delete("/:id_cliente", authMiddleware(["admin"]), async (req, res) => {
  const { id_cliente } = req.params;
  const { id_admin } = req.user;

  try {
    const result = await pool.query(
      "DELETE FROM clientes WHERE id_cliente = $1 AND id_admin = $2",
      [id_cliente, id_admin]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado o no pertenece a este negocio" });
    }

    res.json({ mensaje: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar cliente:", error);
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
});

module.exports = router;
