const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Настройки подключения берутся из переменных окружения
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
});

// Эндпоинт для выполнения запросов
app.post('/query', async (req, res) => {
    const { sql } = req.body;

    // Безопасность: разрешаем только SELECT
    const trimmed = sql.trim().toLowerCase();
    if (!trimmed.startsWith('select')) {
        return res.status(400).json({ error: 'Разрешены только SELECT-запросы' });
    }

    // Запрещаем опасные конструкции
    const dangerous = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate'];
    if (dangerous.some(word => trimmed.includes(word))) {
        return res.status(400).json({ error: 'Запрос содержит запрещённые операции' });
    }

    try {
        const result = await pool.query(sql);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Ошибка выполнения запроса:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});