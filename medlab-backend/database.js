require('dotenv').config();
const { Pool, native } = require('pg'); // Importamos o 'native'

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Esta configuração usa o conector nativo se disponível, o que é mais robusto
  Client: native ? native.Client : undefined, 
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;