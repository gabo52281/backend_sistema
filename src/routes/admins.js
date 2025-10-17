const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 🟣 Ruta: Crear nuevo negocio y su administrador
 * Solo el superadmin puede usarla.
 * - Crea primero el registro en "administradores"
 * - Luego crea el usuario "admin" vinculado a ese negocio
 */
router.post("/crear", authMiddleware(["superadmin"]), async (req, res) => {
  const { nombre_negocio, email_contacto, nombre_admin, email_admin, password_admin } = req.body;

  // Validar campos obligatorios
  if (!nombre_negocio || !email_contacto || !nombre_admin || !email_admin || !password_admin) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    // 1️⃣ Verificar si el negocio ya existe
    const negocioExistente = await pool.query(
      "SELECT * FROM administradores WHERE email_contacto = $1",
      [email_contacto]
    );
    if (negocioExistente.rows.length > 0) {
      return res.status(409).json({ error: "Ya existe un negocio con ese email de contacto" });
    }

    // 2️⃣ Crear el nuevo negocio
    const nuevoNegocio = await pool.query(
      "INSERT INTO administradores (nombre_negocio, email_contacto) VALUES ($1, $2) RETURNING id_admin",
      [nombre_negocio, email_contacto]
    );
    const id_admin = nuevoNegocio.rows[0].id_admin;

    // 3️⃣ Verificar si el email del admin ya existe
    const adminExistente = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email_admin]
    );
    if (adminExistente.rows.length > 0) {
      return res.status(409).json({ error: "El email del administrador ya está en uso" });
    }

    // 4️⃣ Crear hash seguro de la contraseña
    const password_hash = await bcrypt.hash(password_admin, 10);

    // 5️⃣ Insertar el usuario administrador vinculado al negocio
    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol, id_admin) VALUES ($1, $2, $3, $4, $5)",
      [nombre_admin, email_admin, password_hash, "admin", id_admin]
    );

    res.status(201).json({
      mensaje: "Negocio y administrador creados correctamente",
      negocio: {
        id_admin,
        nombre_negocio,
        email_contacto,
      },
      administrador: {
        nombre: nombre_admin,
        email: email_admin,
      },
    });
  } catch (error) {
    console.error("❌ Error al crear negocio y administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * 📋 Listar todos los administradores y negocios
 * Solo el superadmin puede ver esta información
 */
router.get("/", authMiddleware(["superadmin"]), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id_admin, a.nombre_negocio, a.email_contacto,
             u.nombre AS admin_nombre, u.email AS admin_email
      FROM administradores a
      LEFT JOIN usuarios u ON a.id_admin = u.id_admin AND u.rol = 'admin'
      ORDER BY a.id_admin DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al listar administradores:", error);
    res.status(500).json({ error: "Error al listar administradores" });
  }
});

module.exports = router;
