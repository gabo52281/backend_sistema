/* 
  tenemos expres para manejar las rutas
  bcrypt para hashear las contraseñas
  jsonwebtoken para crear tokens JWT y validar los usuarios
  pool para conectarnos a la base de datos
*/
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// creamos el router de express
const router = express.Router();


// ruta para login
router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  try {
    // ✅ Normalizar email
    email = email.toLowerCase().trim();

    const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id_usuario: user.id_usuario, rol: user.rol, id_admin: user.id_admin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      rol: user.rol,
      id_usuario: user.id_usuario,
      id_admin: user.id_admin,
      nombre: user.nombre,
      correo: user.email,
      telefono: user.telefono,
      direccion: user.direccion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en login" });
  }
});




// exportamos el router
module.exports = router;
