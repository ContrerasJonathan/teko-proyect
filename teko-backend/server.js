// ========= server.js (Tu Backend Completo) =========

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

// --- 1. Middleware ---
// Habilita CORS para que tu frontend (en otro puerto) pueda hablar con este backend
app.use(cors()); 
// Permite que el servidor entienda el JSON que envían los formularios
app.use(express.json()); 

// --- 2. Conexión a PostgreSQL ---
// ¡Asegúrate de que estos datos sean correctos!
const pool = new Pool({
    user: 'postgres',           // Tu usuario de PostgreSQL
    host: 'localhost',
    database: 'teko_db',        // El nombre de tu base de datos
    password: 'eljonijonaYT',    // Tu contraseña de PostgreSQL
    port: 5433,                 // El puerto que descubrimos
});

// --- 3. Definición de Rutas (Endpoints) ---

// RUTA 1: Obtener TODOS los terrenos (para terrenos.html)
app.get('/api/terrenos', async (req, res) => {
    try {
        // Pide todos los terrenos a la base de datos
        const { rows } = await pool.query('SELECT * FROM terrenos ORDER BY creado_en DESC');
        // Devuelve los terrenos como un JSON
        res.json(rows);
    } catch (err) {
        console.error("Error en GET /api/terrenos:", err.message);
        res.status(500).send('Error en el servidor');
    }
});

// RUTA 2: Obtener UN terreno por ID (para index.html)
app.get('/api/terrenos/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID de la URL (ej. "1", "2", etc.)
    
    try {
        // Pide solo el terreno que coincida con el ID
        const { rows } = await pool.query('SELECT * FROM terrenos WHERE id = $1', [id]);
        
        if (rows.length === 0) {
            // Si no se encuentra, devuelve un error 404
            return res.status(404).json({ msg: 'Terreno no encontrado' });
        }
        
        // Devuelve el primer (y único) resultado como JSON
        res.json(rows[0]); 
        
    } catch (err) {
        console.error(`Error en GET /api/terrenos/${id}:`, err.message);
        res.status(500).send('Error en el servidor');
    }
});

// RUTA 3: Crear un nuevo terreno (para un futuro panel de admin)
app.post('/api/terrenos', async (req, res) => {
    // (Aquí faltaría la lógica de verificar que el admin esté logueado)
    
    const { nombre, ubicacion, precio, area, servicios, descripcion, imagenes, latitud, longitud } = req.body;
    
    // Validación simple
    if (!nombre || !precio) {
        return res.status(400).json({ msg: 'Nombre y precio son requeridos' });
    }

    try {
        const nuevoTerreno = await pool.query(
            `INSERT INTO terrenos (
                nombre, ubicacion, precio, area, servicios, descripcion, 
                imagenes, latitud, longitud, usuario_id
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [nombre, ubicacion, precio, area, servicios, descripcion, 
             JSON.stringify(imagenes), // Asegura que el arreglo se guarde como JSON
             latitud, longitud, 1] // Usamos 1 como el ID del admin de prueba
        );
        
        res.status(201).json(nuevoTerreno.rows[0]);

    } catch (err) {
        console.error("Error en POST /api/terrenos:", err.message);
        res.status(500).send('Error en el servidor');
    }
});

// --- 4. Iniciar el Servidor ---
app.listen(port, () => {
    console.log(`Servidor de Teko corriendo en http://localhost:${port}`);
});