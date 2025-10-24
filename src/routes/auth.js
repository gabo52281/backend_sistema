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
  // extraemos email y password del body
  const { email, password } = req.body;

  try {

    // buscamos el usuario en la base de datos
    // si no existe, retornamos un error
    const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    
    // si existe, comparamos la contraseña hasheada
    // si no coincide, retornamos un error
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: "Credenciales inválidas" });

    // si todo es correcto, creamos un token JWT
    // y lo enviamos en la respuesta
    // el token expira en 7 días
    // incluimos id_usuario, rol e id_admin en el payload del token
    // para usarlos en la autenticación y autorización
    const token = jwt.sign(
      { id_usuario: user.id_usuario, rol: user.rol, id_admin: user.id_admin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // enviamos el token y el rol en la respuesta
    // Si el usuario es admin, obtener también el nombre del negocio
    let nombre_negocio = null;
    try {
      if (user.id_admin) {
        const adminRes = await pool.query(
          'SELECT nombre_negocio FROM administradores WHERE id_admin = $1',
          [user.id_admin]
        );
        nombre_negocio = adminRes.rows[0]?.nombre_negocio || null;
      }
    } catch (err) {
      console.error('Error obteniendo nombre de negocio:', err);
      // no bloqueamos el login por este error; devolvemos null en nombre_negocio
      nombre_negocio = null;
    }

    res.json({
       token,
        rol: user.rol,
        id_usuario: user.id_usuario,
        id_admin: user.id_admin,
        nombre: user.nombre,
        nombre_negocio,
        correo: user.email,
        telefono: user.telefono,    // ✅ Agregar
        direccion: user.direccion 
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en login" });
  }
});





// exportamos el router
module.exports = router;
