// src/routes/usuarios.js
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🟢 Crear cajero o vendedor (solo para admin)
router.post("/crear", authMiddleware(["admin"]), async (req, res) => {
  let { nombre, email, password, rol, direccion, telefono } = req.body;
  const id_admin = req.user.id_admin;

  if (!nombre || !email || !password || !rol ) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    // ✅ Normalizar email
    email = email.toLowerCase().trim();

    const existe = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol, id_admin, direccion, telefono) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [nombre, email, password_hash, rol, id_admin, direccion || null , telefono || null]
    );

    res.status(201).json({ mensaje: "Empleado creado correctamente" });
  } catch (error) {
    console.error("Error al crear empleado:", error);
    res.status(500).json({ error: "Error al crear empleado" });
  }
});


// ✅ Editar perfil del usuario logueado
router.put("/perfil", authMiddleware(["admin", "superadmin", "cajero"]), async (req, res) => {
  const { id_usuario } = req.user; // viene del token
  const { nombre, telefono, direccion } = req.body;

  try {
    await pool.query(
      "UPDATE usuarios SET nombre = $1, telefono = $2, direccion = $3 WHERE id_usuario = $4",
      [nombre, telefono || null, direccion || null, id_usuario]
    );

    res.json({ mensaje: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

// ➕ Editar empleado (nombre, email, rol o contraseña)
router.put("/:id_usuario", authMiddleware(["admin"]), async (req, res) => {
  const { id_usuario } = req.params;
  const { nombre, email, password, rol, direccion, telefono } = req.body;
  const id_admin = req.user.id_admin;

  try {
    // Verificar si pertenece a su negocio
    const existe = await pool.query(
      "SELECT * FROM usuarios WHERE id_usuario = $1 AND id_admin = $2",
      [id_usuario, id_admin]
    );
    if (existe.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no pertenece a este negocio" });
    }

    // Hash opcional de contraseña
    let password_hash = existe.rows[0].password_hash;
    if (password) password_hash = await bcrypt.hash(password, 10);

    // ✅ CORREGIDO: 6 placeholders para 6 campos + 2 condiciones
    await pool.query(
      `UPDATE usuarios SET nombre = $1, email = $2, password_hash = $3, rol = $4, direccion = $5, telefono = $6 
       WHERE id_usuario = $7 AND id_admin = $8`,
      [nombre, email, password_hash, rol, direccion, telefono, id_usuario, id_admin]
    );

    res.json({ mensaje: "Empleado actualizado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar empleado" });
  }
});

// 🗑️ Eliminar empleado
router.delete("/:id_usuario", authMiddleware(["admin"]), async (req, res) => {
  const { id_usuario } = req.params;
  const id_admin = req.user.id_admin;

  try {
    const result = await pool.query(
      "DELETE FROM usuarios WHERE id_usuario = $1 AND id_admin = $2",
      [id_usuario, id_admin]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Empleado no encontrado o no pertenece a este negocio" });
    }
    res.json({ mensaje: "Empleado eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar empleado" });
  }
});

/**
 * 📋 Listar empleados (cajeros y vendedores) del negocio del admin
 */
router.get("/", authMiddleware(["admin"]), async (req, res) => {
  const id_admin = req.user.id_admin;

  try {
    const result = await pool.query(
      "SELECT id_usuario, nombre, email, rol FROM usuarios WHERE id_admin = $1 AND rol IN ('cajero', 'vendedor') ORDER BY id_usuario DESC",
      [id_admin]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al listar empleados:", error);
    res.status(500).json({ error: "Error al listar empleados" });
  }
});

module.exports = router;