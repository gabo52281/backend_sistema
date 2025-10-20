CREATE TABLE administradores (
    id_admin SERIAL PRIMARY KEY,
    nombre_negocio VARCHAR(100) NOT NULL,
    email_contacto VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo', -- activo, suspendido, eliminado
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- se guarda con bcrypt/argon2
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('superadmin','admin','cajero','vendedor')),
    id_admin INT REFERENCES administradores(id_admin) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    cedula VARCHAR(20) UNIQUE,
    direccion TEXT,
    id_admin INT NOT NULL REFERENCES administradores(id_admin) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(12,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    id_admin INT NOT NULL REFERENCES administradores(id_admin) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facturas (
    id_factura SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(id_cliente) ON DELETE SET NULL,
    id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    id_admin INT NOT NULL REFERENCES administradores(id_admin) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12,2) NOT NULL
);
CREATE TABLE detalle_factura (
    id_detalle SERIAL PRIMARY KEY,
    id_factura INT NOT NULL REFERENCES facturas(id_factura) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES productos(id_producto),
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES (
  'Superadmin',
  'super@admin.com',
  '$2b$10$4b4y7yXJzNJHgfj.SpcB4OPFvbBgCXSZL3gQZEW79UsgcQrgRFxSO',
  'superadmin'
);