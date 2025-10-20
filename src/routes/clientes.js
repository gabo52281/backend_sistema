const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 🟢 Crear cliente
 * Solo pueden hacerlo admin o cajeros
 */
router.post("/crear", authMiddleware(["admin", "cajero"]), async (req, res) => {
  const { nombre, telefono, cedula, direccion } = req.body;
  const { id_admin } = req.user;

  if (!nombre) {
    return res.status(400).json({ error: "El nombre del cliente es obligatorio" });
  }

  try {
    // Si se envía cedula, verificar unicidad dentro del mismo negocio
    if (cedula) {
      const existeCedula = await pool.query(
        "SELECT id_cliente FROM clientes WHERE cedula = $1 AND id_admin = $2",
        [cedula, id_admin]
      );
      if (existeCedula.rows.length > 0) {
        return res.status(409).json({ error: "La cédula ya está registrada para este negocio" });
      }
    }

    await pool.query(
      `INSERT INTO clientes (nombre, telefono, cedula, direccion, id_admin)
       VALUES ($1, $2, $3, $4, $5)`,
      [nombre, telefono || null, cedula || null, direccion || null, id_admin]
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
      "SELECT id_cliente, nombre, telefono, cedula, direccion, creado_en FROM clientes WHERE id_admin = $1 ORDER BY creado_en DESC",
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
  const { nombre, telefono, direccion, cedula } = req.body;
  const { id_admin } = req.user;

  try {
    // Si se proporciona cedula, asegurarse que no la tenga otro cliente del mismo negocio
    if (cedula) {
      const existe = await pool.query(
        "SELECT id_cliente FROM clientes WHERE cedula = $1 AND id_admin = $2 AND id_cliente != $3",
        [cedula, id_admin, id_cliente]
      );
      if (existe.rows.length > 0) {
        return res.status(409).json({ error: "La cédula ya está registrada en otro cliente" });
      }
    }

    const result = await pool.query(
      `UPDATE clientes 
       SET nombre = $1, telefono = $2, direccion = $3, cedula = $4
       WHERE id_cliente = $5 AND id_admin = $6`,
      [nombre, telefono, direccion, cedula || null, id_cliente, id_admin]
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
