const express = require('express');
const cors = require('cors');
const db = require('./database.js'); // Nosso novo conector de DB

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- ENDPOINTS DE USUÁRIOS ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (password === user.password) {
                res.json({ success: true, message: 'Login bem-sucedido!', data: { id: user.id, login: user.username, nome: user.nome, tipoAcesso: user.tipo_acesso } });
            } else {
                res.json({ success: false, message: 'Usuário ou senha inválidos.' });
            }
        } else {
            res.json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (err) {
        console.error("Erro no endpoint de login:", err);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await db.query("SELECT id, nome, username, tipo_acesso FROM usuarios ORDER BY nome");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ success: false, message: 'Erro ao buscar usuários.' });
    }
});

app.post('/api/usuarios', async (req, res) => {
    const { nome, login, senha, tipoAcesso } = req.body;
    const params = [nome, login, senha, tipoAcesso];
    try {
        const result = await db.query(`INSERT INTO usuarios (nome, username, password, tipo_acesso) VALUES ($1, $2, $3, $4) RETURNING id, nome, username, tipo_acesso`, params);
        res.json({ success: true, message: 'Usuário/Unidade adicionado!', data: result.rows[0] });
    } catch (err) {
        console.error("Erro ao salvar usuário:", err);
        res.status(400).json({ success: false, message: 'Erro ao salvar usuário. O login já pode existir.' });
    }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM unidade_insumos WHERE unidade_id = $1', [id]);
        const result = await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        res.json({ success: true, message: 'Usuário apagado com sucesso!' });
    } catch (err) {
        console.error("Erro ao apagar usuário:", err);
        res.status(500).json({ success: false, message: 'Erro ao apagar usuário.' });
    }
});


// --- ENDPOINTS DE INSUMOS ---
app.get('/api/insumos', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM insumos ORDER BY nome");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Erro ao buscar insumos:", err);
        res.status(500).json({ success: false, message: 'Erro ao buscar insumos.' });
    }
});

app.post('/api/insumos', async (req, res) => {
    const { nome, unidadeMedida, valorCompra, tipoValorCompra, itensPorEmbalagem, qtdEstoqueMatriz, qtdMinima } = req.body;
    const params = [nome, unidadeMedida, valorCompra, tipoValorCompra, itensPorEmbalagem, qtdEstoqueMatriz, qtdMinima];
    try {
        const result = await db.query(`INSERT INTO insumos (nome, unidade_medida, valor_compra, tipo_valor_compra, itens_por_embalagem, quantidade_estoque_matriz, quantidade_minima) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, params);
        res.json({ success: true, message: 'Insumo adicionado!', data: result.rows[0] });
    } catch (err) {
        console.error("Erro ao salvar insumo:", err);
        res.status(400).json({ success: false, message: 'Erro ao salvar insumo. O nome já pode existir.' });
    }
});

// --- ENDPOINTS DE GESTÃO DA UNIDADE ---
app.get('/api/unidade/:id/insumos', async (req, res) => {
    const sql = `SELECT i.*, ui.estoque_local, ui.estoque_minimo_unidade FROM insumos i JOIN unidade_insumos ui ON i.id = ui.insumo_id WHERE ui.unidade_id = $1 ORDER BY i.nome`;
    try {
        const result = await db.query(sql, [req.params.id]);
        res.json({success: true, data: result.rows });
    } catch(err) {
        console.error("Erro ao buscar dados da unidade:", err);
        res.status(500).json({success: false, message: 'Erro ao buscar dados da unidade.'});
    }
});

// --- Ligar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});