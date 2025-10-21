const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 💰 Crear una nueva factura (venta)
 * Solo pueden hacerlo los admin o cajeros
 */
router.post("/crear", authMiddleware(["admin", "cajero"]), async (req, res) => {
  const { productos, id_cliente } = req.body; // productos: [{ id_producto, cantidad }]
  const { id_usuario, id_admin } = req.user;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let total = 0;
    let ganancia_total = 0; // 🆕 nueva variable

    // 🔹 Validar, actualizar stock y calcular ganancia
    for (const item of productos) {
      const { id_producto, cantidad } = item;

      // Bloquear el producto durante la transacción
      const prodRes = await client.query(
        "SELECT precio, precio_compra, stock FROM productos WHERE id_producto = $1 AND id_admin = $2 FOR UPDATE",
        [id_producto, id_admin]
      );

      if (prodRes.rows.length === 0) {
        throw new Error(`Producto ${id_producto} no encontrado`);
      }

      const { precio, precio_compra, stock } = prodRes.rows[0];
      if (stock < cantidad) {
        throw new Error(`Stock insuficiente para el producto ${id_producto}`);
      }

      total += precio * cantidad;
      ganancia_total += (precio - precio_compra) * cantidad; // 🆕 calcular ganancia

      // Actualizar stock
      await client.query(
        `UPDATE productos
         SET stock = stock - $1
         WHERE id_producto = $2
           AND id_admin = $3
           AND stock >= $1`,
        [cantidad, id_producto, id_admin]
      );
    }

    // 🔹 Crear la factura con la ganancia incluida
    const facturaResult = await client.query(
      "INSERT INTO facturas (id_cliente, id_usuario, id_admin, total, ganancia) VALUES ($1, $2, $3, $4, $5) RETURNING id_factura",
      [id_cliente || null, id_usuario, id_admin, total, ganancia_total]
    );

    const id_factura = facturaResult.rows[0].id_factura;

    // 🔹 Insertar los detalles
    for (const item of productos) {
      const { id_producto, cantidad } = item;
      const precioRes = await client.query(
        "SELECT precio FROM productos WHERE id_producto = $1 AND id_admin = $2",
        [id_producto, id_admin]
      );
      const precio_unitario = precioRes.rows[0].precio;

      await client.query(
        "INSERT INTO detalle_factura (id_factura, id_producto, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)",
        [id_factura, id_producto, cantidad, precio_unitario]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
        mensaje: "Factura registrada correctamente",
        id_factura,
        fecha: fechaFactura,
        total,
        cliente: clienteNombre,
        vendedor: vendedorRes.rows[0].nombre,
        ganancia_total
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear factura:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});


// 📋 Listar todas las facturas
router.get("/", authMiddleware(["admin", "superadmin", "cajero", "vendedor"]), async (req, res) => {
  const { id_admin, rol, id_usuario } = req.user;

  try {
    let query = `
      SELECT f.id_factura, f.fecha, f.total,
             COALESCE(c.nombre, 'Sin cliente') AS cliente,
             u.nombre AS vendedor
      FROM facturas f
      LEFT JOIN clientes c ON f.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON f.id_usuario = u.id_usuario
      WHERE f.id_admin = $1
      ORDER BY f.fecha DESC
    `;
    let params = [id_admin];

    if (rol === "cajero" || rol === "vendedor") {
      query = `
        SELECT f.id_factura, f.fecha, f.total,
               COALESCE(c.nombre, 'Sin cliente') AS cliente,
               u.nombre AS vendedor
        FROM facturas f
        LEFT JOIN clientes c ON f.id_cliente = c.id_cliente
        LEFT JOIN usuarios u ON f.id_usuario = u.id_usuario
        WHERE f.id_admin = $1 AND f.id_usuario = $2
        ORDER BY f.fecha DESC
      `;
      params = [id_admin, id_usuario];
    }

    const facturasRes = await pool.query(query, params);
    res.json(facturasRes.rows);
  } catch (error) {
    console.error("❌ Error al listar facturas:", error);
    res.status(500).json({ error: "Error al listar facturas" });
  }
});




/**
 * 📋 Listar facturas del negocio
 * Solo el admin puede verlas
 */
router.get("/:id_factura", authMiddleware(["admin", "cajero"]), async (req, res) => {
  const { id_factura } = req.params;
  const { id_admin, rol, id_usuario } = req.user;

  try {
    const facturaRes = await pool.query(
      `SELECT f.id_factura, f.fecha, f.total, f.id_usuario,
              COALESCE(c.nombre, 'Sin cliente') AS cliente,
              u.nombre AS vendedor
       FROM facturas f
       LEFT JOIN clientes c ON f.id_cliente = c.id_cliente
       LEFT JOIN usuarios u ON f.id_usuario = u.id_usuario
       WHERE f.id_factura = $1 AND f.id_admin = $2`,
      [id_factura, id_admin]
    );

    if (facturaRes.rows.length === 0) {
      return res.status(404).json({ error: "Factura no encontrada o no pertenece a este negocio" });
    }

    const factura = facturaRes.rows[0];

    // ✅ Comparación por ID real, no por nombre
    if (rol === "cajero" && factura.id_usuario !== id_usuario) {
      return res.status(403).json({ error: "No autorizado para ver esta factura" });
    }

    const detallesRes = await pool.query(
      `SELECT p.nombre, d.cantidad, d.precio_unitario, d.subtotal
       FROM detalle_factura d
       INNER JOIN productos p ON d.id_producto = p.id_producto
       WHERE d.id_factura = $1`,
      [id_factura]
    );

    res.json({
      factura: {
        id_factura: factura.id_factura,
        cliente: factura.cliente,
        vendedor: factura.vendedor,
        fecha: factura.fecha,
        total: factura.total,
        productos: detallesRes.rows,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener factura:", error);
    res.status(500).json({ error: "Error al obtener factura" });
  }
});



module.exports = router;
