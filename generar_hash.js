const bcrypt = require("bcrypt");

const password = "123456"; // puedes cambiarla si quieres

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error("❌ Error al generar el hash:", err);
  } else {
    console.log("✅ Hash generado para la contraseña:", password);
    console.log(hash);
  }
});
