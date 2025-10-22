const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Importar rutas
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admins");
const productosRoutes = require("./routes/productos");
const facturasRoutes = require("./routes/facturas");
const clientesRoutes = require("./routes/clientes");
const notasRoutes = require("./routes/notas");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());



// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/notas", notasRoutes);

// Servidor
app.listen(4000, () => {
  console.log("Servidor corriendo en http://localhost:4000");
});
