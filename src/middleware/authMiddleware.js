const jwt = require("jsonwebtoken");

function authMiddleware(roles = []) {
  return (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token requerido" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).json({ error: "No autorizado" });
      }
     
      // if (roles.length && !roles.includes(decoded.rol)) {
      //   // ⚠️ Excepción temporal para pruebas: permitir al superadmin
      //   if (decoded.rol !== "superadmin") {
      //     return res.status(403).json({ error: "No autorizado" });
      //   }
      // }

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ error: "Token inválido" });
    }
  };
}

module.exports = authMiddleware;
