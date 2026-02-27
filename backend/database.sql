-- Script SQL para crear la base de datos
-- Ejecuta este archivo en tu servidor MySQL

CREATE DATABASE IF NOT EXISTS finanzas_db;
USE finanzas_db;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('gasto', 'ingreso') NOT NULL,
    icono VARCHAR(10) DEFAULT '📁',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    categoria_id INT,
    tipo ENUM('gasto', 'ingreso') NOT NULL,
    fecha DATE NOT NULL,
    metodo_pago VARCHAR(50),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Insertar categorías por defecto
INSERT INTO categorias (nombre, tipo, icono) VALUES
('Salario', 'ingreso', '💰'),
('Freelance', 'ingreso', '💻'),
('Inversión', 'ingreso', '📈'),
('Otro Ingreso', 'ingreso', '💵'),
('Alimentación', 'gasto', '🍔'),
('Transporte', 'gasto', '🚗'),
('Servicios', 'gasto', '💡'),
('Entretenimiento', 'gasto', '🎬'),
('Salud', 'gasto', '🏥'),
('Educación', 'gasto', '📚'),
('Otros Gastos', 'gasto', '📦');
