import { Pool } from 'pg'

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || '51.195.46.40',
  port: parseInt(process.env.DB_PORT || '54320'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'MsTLvG8wNMzT6g11yAyemkOD3GgBefei',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export default pool
