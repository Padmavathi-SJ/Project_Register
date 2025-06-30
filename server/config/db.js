const mysql = require('mysql2/promise');
const { db } = require('./envConfig');
console.log(db.password, "password");
const pool = mysql.createPool({
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.name,
    port: db.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
// Test the connection when the server starts
pool.getConnection()
    .then(connection => {
        console.log("Database connected successfully");
        connection.release();
    })
    .catch(error => {
        console.error("Database connection failed:", error);
        process.exit(1); // Exit if DB connection fails
    });

module.exports = pool;