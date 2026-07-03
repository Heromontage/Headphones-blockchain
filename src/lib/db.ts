import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'aether_user',
  password: process.env.MYSQL_PASSWORD || 'aether_password',
  database: process.env.MYSQL_DATABASE || 'aether_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDb() {
  try {
    const connection = await pool.getConnection();

    // Create users table with new columns
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        orders_placed INT DEFAULT 0,
        wallet_address VARCHAR(255) UNIQUE NULL,
        total_points_earned DECIMAL(20, 2) DEFAULT 0,
        total_points_redeemed DECIMAL(20, 2) DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create orders table with new columns
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255),
        itemColor VARCHAR(255),
        status VARCHAR(50) DEFAULT 'PENDING',
        total DECIMAL(10, 2),
        points_earned DECIMAL(20, 2) DEFAULT 0,
        points_tx_hash VARCHAR(255) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create redemptions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS redemptions (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        points_redeemed DECIMAL(20, 2) NOT NULL,
        discount_code VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        redemption_tx_hash VARCHAR(255) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

export async function query(sql: string, values?: any[]) {
  const [rows] = await pool.execute(sql, values);
  return rows;
}