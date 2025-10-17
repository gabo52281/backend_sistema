const fs = require("fs");
const path = require("path");

const directorio = "."; // raíz del proyecto
const extensiones = [".js", ".env"]; // tipos de archivo a incluir
const salida = "codigo_completo.txt";

function listarArchivos(dir) {
  const archivos = fs.readdirSync(dir);
  let contenido = "";

  for (const archivo of archivos) {
    const ruta = path.join(dir, archivo);
    const stat = fs.statSync(ruta);

    if (stat.isDirectory() && archivo !== "node_modules") {
      contenido += listarArchivos(ruta); // recursivo
    } else if (extensiones.includes(path.extname(archivo))) {
      contenido += `\n\n// ===== ${ruta} =====\n\n`;
      contenido += fs.readFileSync(ruta, "utf-8");
    }
  }
  return contenido;
}

fs.writeFileSync(salida, listarArchivos(directorio));
console.log("✅ Código exportado a", salida);
