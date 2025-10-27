// ========= server.js (Tu Backend Completo - CORREGIDO POST) =========

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

// --- 1. Middleware ---
app.use(cors());
app.use(express.json());

// --- 2. Conexión a PostgreSQL ---
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'teko_db',
    password: 'eljonijonaYT', // Asegúrate que esta sea tu contraseña real
    port: 5433,
});

// --- 3. Definición de Rutas (Endpoints) ---

// RUTA 1: Obtener TODOS los terrenos
app.get('/api/terrenos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM terrenos ORDER BY creado_en DESC');
        res.json(rows);
    } catch (err) {
        console.error("Error en GET /api/terrenos:", err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener terrenos.' });
    }
});

// RUTA 2: Obtener UN terreno por ID
app.get('/api/terrenos/:id', async (req, res) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID inválido.' });
    }
    try {
        const { rows } = await pool.query('SELECT * FROM terrenos WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Terreno no encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error en GET /api/terrenos/${id}:`, err.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener detalles.' });
    }
});

// RUTA 3: Crear un nuevo terreno (CORREGIDA)
app.post('/api/terrenos', async (req, res) => {
    // (Falta Autenticación)
    const { nombre, ubicacion, precio, area, servicios, descripcion, imagenes, latitud, longitud } = req.body;

    // Validación
    if (!nombre || precio === undefined || precio === null || area === undefined || area === null || !ubicacion || !descripcion) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (Nombre, Ubicación, Precio, Área, Descripción).' });
    }
    if (parseFloat(precio) <= 0 || parseFloat(area) <= 0) {
        return res.status(400).json({ error: 'Precio y Área deben ser mayores a cero.' });
    }

    console.log("Recibido para crear:", req.body);

    try {
        const lat = latitud ? parseFloat(latitud) : null;
        const lon = longitud ? parseFloat(longitud) : null;
        // Asegurar que 'imagenes' sea un array
        const imagenesArray = Array.isArray(imagenes) ? imagenes : [];

        const nuevoTerreno = await pool.query(
            `INSERT INTO terrenos (
                nombre, ubicacion, precio, area, servicios, descripcion,
                imagenes, latitud, longitud, usuario_id
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                nombre, ubicacion, parseFloat(precio), parseFloat(area), servicios, descripcion,
                // ***** CORRECCIÓN AQUÍ *****
                JSON.stringify(imagenesArray), // <-- Convierte el array a JSON string
                lat, lon,
                1 // ID del admin de prueba
            ]
        );

        console.log("Terreno creado:", nuevoTerreno.rows[0]);
        res.status(201).json(nuevoTerreno.rows[0]);

    } catch (err) {
        console.error("Error en POST /api/terrenos:", err);
        res.status(500).json({ error: `Error interno del servidor al crear el terreno: ${err.message}` });
    }
});

// RUTA 4: ACTUALIZAR un terreno por ID
app.put('/api/terrenos/:id', async (req, res) => {
    // (Falta Autenticación)
    const { id } = req.params;
    const { nombre, ubicacion, precio, area, latitud, longitud, servicios, descripcion, imagenes } = req.body;

    // Validaciones (ID y datos)
    if (isNaN(parseInt(id))) { return res.status(400).json({ error: 'ID inválido.' }); }
    if (!nombre || !ubicacion || precio === undefined || precio === null || area === undefined || area === null || !descripcion) { return res.status(400).json({ error: 'Faltan campos obligatorios.' }); }
    if (parseFloat(precio) <= 0 || parseFloat(area) <= 0) { return res.status(400).json({ error: 'Precio y Área deben ser > 0.' }); }

    console.log(`Intentando actualizar ID: ${id} con datos:`, req.body);

    try {
        const lat = latitud ? parseFloat(latitud) : null;
        const lon = longitud ? parseFloat(longitud) : null;
        const imagenesArray = Array.isArray(imagenes) ? imagenes : [];

        const result = await pool.query(
            `UPDATE terrenos
             SET nombre = $1, ubicacion = $2, precio = $3, area = $4, latitud = $5, longitud = $6, servicios = $7, descripcion = $8, imagenes = $9
             WHERE id = $10
             RETURNING *`,
            [
                nombre, ubicacion, parseFloat(precio), parseFloat(area), lat, lon, servicios, descripcion,
                JSON.stringify(imagenesArray), // <-- Usa JSON.stringify aquí también
                id
            ]
        );

        if (result.rowCount === 0) {
            console.log(`Terreno ID: ${id} no encontrado para actualizar.`);
            return res.status(404).json({ error: 'Terreno no encontrado.' });
        }

        console.log(`Terreno actualizado:`, result.rows[0]);
        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('Error en PUT /api/terrenos/:id:', err);
        res.status(500).json({ error: `Error interno al actualizar: ${err.message}` });
    }
});


// RUTA 5: ELIMINAR un terreno por ID
app.delete('/api/terrenos/:id', async (req, res) => {
    // (Falta Autenticación)
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    console.log(`Intentando eliminar terreno ID: ${id}`);

    try {
        const result = await pool.query(
            'DELETE FROM terrenos WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rowCount === 0) {
            console.log(`Terreno ID: ${id} no encontrado para eliminar.`);
            return res.status(404).json({ error: 'Terreno no encontrado.' });
        }

        console.log(`Terreno eliminado:`, result.rows[0]);
        res.status(200).json({ message: `Terreno ID ${id} eliminado.` });

    } catch (err) {
        console.error('Error en DELETE /api/terrenos/:id:', err);
        res.status(500).json({ error: `Error interno al eliminar: ${err.message}` });
    }
});


// --- 4. Iniciar el Servidor ---
app.listen(port, () => {
    console.log(`Servidor de Teko corriendo en http://localhost:${port}`);
});
