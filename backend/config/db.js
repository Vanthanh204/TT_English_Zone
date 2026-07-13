const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4",

    // TiDB Cloud bắt buộc SSL khi kết nối từ xa
    ...(process.env.DB_SSL === 'true' ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {})
});

pool.generateNextId = async (table, column, prefix, connection = pool) => {

    const [rows] = await connection.execute(
        `SELECT ${column}
         FROM ${table}
         WHERE ${column} LIKE ?
         ORDER BY ${column} DESC
         LIMIT 1`,
        [`${prefix}%`]
    );

    if (rows.length === 0)
        return `${prefix}001`;

    const lastId = rows[0][column];

    const nextNumber =
        parseInt(lastId.substring(prefix.length),10)+1;

    return `${prefix}${String(nextNumber).padStart(3,"0")}`;
};

module.exports = pool;