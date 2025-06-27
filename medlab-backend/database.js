const { Pool } = require('pg');

// Usamos uma variável de ambiente para o endereço, para manter o segredo seguro
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Esta configuração é importante para o deploy na Render
  ssl: {
    rejectUnauthorized: false
  }
});

// Exportamos a conexão direta
module.exports = pool;