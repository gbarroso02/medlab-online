const pool = require('./database.js'); // Importamos a conexão direta

const createTables = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255),
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      tipo_acesso VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS insumos (
      id SERIAL PRIMARY KEY,
      nome TEXT UNIQUE,
      unidade_medida TEXT,
      valor_compra REAL,
      tipo_valor_compra TEXT,
      itens_por_embalagem INTEGER,
      quantidade_estoque_matriz INTEGER,
      quantidade_minima INTEGER
    );

    CREATE TABLE IF NOT EXISTS solicitacoes (
      id SERIAL PRIMARY KEY,
      unidade_login TEXT,
      unidade_nome TEXT,
      insumo_nome TEXT,
      data TEXT,
      status TEXT,
      quantidade_solicitada INTEGER,
      quantidade_confirmada_admin INTEGER
    );

    CREATE TABLE IF NOT EXISTS unidade_insumos (
      unidade_id INTEGER,
      insumo_id INTEGER,
      estoque_local INTEGER DEFAULT 0,
      estoque_minimo_unidade INTEGER DEFAULT 0,
      PRIMARY KEY (unidade_id, insumo_id),
      FOREIGN KEY (unidade_id) REFERENCES usuarios (id) ON DELETE CASCADE,
      FOREIGN KEY (insumo_id) REFERENCES insumos (id) ON DELETE CASCADE
    );

    INSERT INTO usuarios(nome, username, password, tipo_acesso) 
    VALUES('Administrador Principal', 'jgadm', '2501jg', 'admin_total') 
    ON CONFLICT (username) DO NOTHING;
  `;

  try {
    console.log('Criando tabelas...');
    await pool.query(queryText); // Usamos a conexão direta para fazer a query
    console.log('Configuração do banco de dados concluída com sucesso!');
    pool.end(); // Fecha a conexão
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
    pool.end(); // Fecha a conexão mesmo se der erro
  }
};

createTables();