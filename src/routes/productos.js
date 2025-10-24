const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 🟢 Crear producto (solo admin)
 */
router.post("/crear", authMiddleware(["admin"]), async (req, res) => {
  const { nombre, precio, stock, precio_compra } = req.body;
  const id_admin = req.user.id_admin; // viene del token JWT

  // Normalizar valores numéricos
  const precioNum = Number(precio);
  const precioCompraNum = precio_compra !== undefined && precio_compra !== null ? Number(precio_compra) : 0;
  const stockNum = stock !== undefined && stock !== null ? Number(stock) : 0;

  if (!nombre || isNaN(precioNum)) {
    return res.status(400).json({ error: "El nombre y el precio son obligatorios y deben ser numéricos" });
  }

  try {
    await pool.query(
      "INSERT INTO productos (nombre, precio, precio_compra, stock, id_admin) VALUES ($1, $2, $3, $4, $5)",
      [nombre, precioNum, precioCompraNum || 0, stockNum || 0, id_admin]
    );

    res.status(201).json({ mensaje: "Producto creado correctamente" });
  } catch (error) {
    console.error("❌ Error al crear producto:", error);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

/**
 * 🔹 Listar productos (admin, cajero o vendedor)
 */
router.get("/", authMiddleware(["admin", "cajero"]), async (req, res) => {
  const id_admin = req.user.id_admin;

  try {
    const result = await pool.query(
      "SELECT * FROM productos WHERE id_admin = $1 ORDER BY id_producto DESC",
      [id_admin]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al listar productos:", error);
    res.status(500).json({ error: "Error al listar productos" });
  }
});

/**
 * ✏️ Editar producto (solo admin)
 */
router.put("/:id", authMiddleware(["admin"]), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;
  const id_admin = req.user.id_admin;

  try {
    const result = await pool.query(
      "UPDATE productos SET nombre = $1, precio = $2, stock = $3 WHERE id_producto = $4 AND id_admin = $5",
      [nombre, precio, stock, id, id_admin]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado o no pertenece a este negocio" });
    }

    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});



/**
 * ➕ Añadir existencias a un producto (solo admin)
 */
router.put("/:id/anadir-stock", authMiddleware(["admin"]), async (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;
  const id_admin = req.user.id_admin;

  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
  }

  try {
    const result = await pool.query(
      `UPDATE productos 
       SET stock = stock + $1 
       WHERE id_producto = $2 AND id_admin = $3 
       RETURNING *`,
      [cantidad, id, id_admin]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado o no pertenece a este negocio" });
    }

    res.json({
      mensaje: `Se anadieron ${cantidad} unidades al producto "${result.rows[0].nombre}"`,
      producto: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al anadir stock:", error);
    res.status(500).json({ error: "Error al añadir stock" });
  }
});


/**
 * 🗑️ Eliminar producto (solo admin)
 */
router.delete("/:id", authMiddleware(["admin"]), async (req, res) => {
  const { id } = req.params;
  const id_admin = req.user.id_admin;

  try {
    const result = await pool.query(
      "DELETE FROM productos WHERE id_producto = $1 AND id_admin = $2",
      [id, id_admin]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado o no pertenece a este negocio" });
    }

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

module.exports = router;
