// src/routes/usuarios.js
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🟢 Crear cajero o vendedor (solo para admin)
router.post("/crear", authMiddleware(["admin"]), async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const id_admin = req.user.id_admin;

  // Solo se permiten roles de empleados
  const rolesPermitidos = ["cajero", "vendedor"];
  if (!rolesPermitidos.includes(rol)) {
    return res.status(403).json({ error: "Rol no permitido" });
  }

   if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }
  try {
    const existe = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // id_admin viene del token del admin logueado
   

    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol, id_admin) VALUES ($1, $2, $3, $4, $5)",
      [nombre, email, password_hash, rol, id_admin]
    );

    res.status(201).json({ mensaje: "Empleado creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear empleado" });
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
