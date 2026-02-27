const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finanzas_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==================== RUTAS ====================

// --- TRANSACCIONES (Gastos e Ingresos) ---

// Obtener todas las transacciones
app.get('/api/transacciones', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, c.nombre as categoria_nombre, c.tipo as categoria_tipo
      FROM transacciones t
      LEFT JOIN categorias c ON t.categoria_id = c.id
      ORDER BY t.fecha DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obtener transacción por ID
app.get('/api/transacciones/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transacciones WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Transacción no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Crear transacción
app.post('/api/transacciones', async (req, res) => {
  const { descripcion, monto, categoria_id, tipo, fecha, metodo_pago, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO transacciones (descripcion, monto, categoria_id, tipo, fecha, metodo_pago, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [descripcion, monto, categoria_id, tipo, fecha, metodo_pago || null, notas || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Transacción creada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar transacción
app.put('/api/transacciones/:id', async (req, res) => {
  const { descripcion, monto, categoria_id, tipo, fecha, metodo_pago, notas } = req.body;
  try {
    await pool.query(
      'UPDATE transacciones SET descripcion=?, monto=?, categoria_id=?, tipo=?, fecha=?, metodo_pago=?, notas=? WHERE id=?',
      [descripcion, monto, categoria_id, tipo, fecha, metodo_pago, notas, req.params.id]
    );
    res.json({ message: 'Transacción actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar transacción
app.delete('/api/transacciones/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM transacciones WHERE id = ?', [req.params.id]);
    res.json({ message: 'Transacción eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CATEGORÍAS ---

// Obtener todas las categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY tipo, nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear categoría
app.post('/api/categorias', async (req, res) => {
  const { nombre, tipo, icono } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO categorias (nombre, tipo, icono) VALUES (?, ?, ?)',
      [nombre, tipo, icono || '📁']
    );
    res.status(201).json({ id: result.insertId, message: 'Categoría creada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- REPORTES/DASHBOARD ---

// Resumen general
app.get('/api/dashboard/resumen', async (req, res) => {
  try {
    const [[{ total_ingresos }]] = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) as total_ingresos FROM transacciones WHERE tipo = 'ingreso'"
    );
    const [[{ total_gastos }]] = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) as total_gastos FROM transacciones WHERE tipo = 'gasto'"
    );
    
    res.json({
      total_ingresos: parseFloat(total_ingresos),
      total_gastos: parseFloat(total_gastos),
      balance: parseFloat(total_ingresos) - parseFloat(total_gastos)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gastos por categoría
app.get('/api/dashboard/gastos-por-categoria', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.nombre, c.icono, SUM(t.monto) as total
      FROM transacciones t
      JOIN categorias c ON t.categoria_id = c.id
      WHERE t.tipo = 'gasto'
      GROUP BY c.id, c.nombre, c.icono
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ingresos por categoría
app.get('/api/dashboard/ingresos-por-categoria', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.nombre, c.icono, SUM(t.monto) as total
      FROM transacciones t
      JOIN categorias c ON t.categoria_id = c.id
      WHERE t.tipo = 'ingreso'
      GROUP BY c.id, c.nombre, c.icono
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Últimos 6 meses (para gráfico de tendencia)
app.get('/api/dashboard/tendencia', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(fecha, '%Y-%m') as mes,
        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
      FROM transacciones
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
      ORDER BY mes
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar base de datos (crear tablas si no existen)
app.get('/api/init', async (req, res) => {
  try {
    // Crear base de datos si no existe
    await pool.query('CREATE DATABASE IF NOT EXISTS finanzas_db');
    await pool.query('USE finanzas_db');
    
    // Tabla de categorías
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        tipo ENUM('gasto', 'ingreso') NOT NULL,
        icono VARCHAR(10) DEFAULT '📁',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla de transacciones
    await pool.query(`
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
      )
    `);
    
    // Insertar categorías por defecto si no existen
    const [existing] = await pool.query('SELECT COUNT(*) as count FROM categorias');
    if (existing[0].count === 0) {
      await pool.query(`
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
        ('Otros Gastos', 'gasto', '📦')
      `);
    }
    
    res.json({ message: 'Base de datos inicializada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
