const express = require('express');
const cors = require('cors');
const db = require('./database.js');

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
                res.json({ success: true, data: { id: user.id, login: user.username, nome: user.nome, tipoAcesso: user.tipo_acesso } });
            } else { res.json({ success: false, message: 'Usuário ou senha inválidos.' }); }
        } else { res.json({ success: false, message: 'Usuário ou senha inválidos.' }); }
    } catch (err) { res.status(500).json({ success: false, message: 'Erro no servidor.' }); }
});
app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await db.query("SELECT id, nome, username, tipo_acesso FROM usuarios ORDER BY nome");
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: 'Erro ao buscar usuários.' }); }
});
app.post('/api/usuarios', async (req, res) => {
    const { nome, login, senha, tipoAcesso } = req.body;
    try {
        const result = await db.query(`INSERT INTO usuarios (nome, username, password, tipo_acesso) VALUES ($1, $2, $3, $4) RETURNING id, nome, username, tipo_acesso`, [nome, login, senha, tipoAcesso]);
        res.json({ success: true, message: 'Usuário/Unidade adicionado!', data: result.rows[0] });
    } catch (err) { res.status(400).json({ success: false, message: 'Erro ao salvar usuário. O login já pode existir.' }); }
});
app.delete('/api/usuarios/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM unidade_insumos WHERE unidade_id = $1', [id]);
        const result = await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        res.json({ success: true, message: 'Usuário apagado com sucesso!' });
    } catch (err) { res.status(500).json({ success: false, message: 'Erro ao apagar usuário.' }); }
});

// --- ENDPOINTS DE INSUMOS ---
app.get('/api/insumos', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM insumos ORDER BY nome");
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: 'Erro ao buscar insumos.' }); }
});
app.post('/api/insumos', async (req, res) => {
    const { nome, unidadeMedida, valorCompra, tipoValorCompra, itensPorEmbalagem, qtdEstoqueMatriz, qtdMinima } = req.body;
    const params = [nome, unidadeMedida, valorCompra, tipoValorCompra, itensPorEmbalagem, qtdEstoqueMatriz, qtdMinima];
    try {
        const result = await db.query(`INSERT INTO insumos (nome, unidade_medida, valor_compra, tipo_valor_compra, itens_por_embalagem, quantidade_estoque_matriz, quantidade_minima) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, params);
        res.json({ success: true, message: 'Insumo adicionado!', data: result.rows[0] });
    } catch (err) { res.status(400).json({ success: false, message: 'Erro ao salvar insumo. O nome já pode existir.' }); }
});
app.delete('/api/insumos/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM unidade_insumos WHERE insumo_id = $1', [id]);
        const result = await db.query('DELETE FROM insumos WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Insumo não encontrado.' });
        res.json({ success: true, message: 'Insumo apagado com sucesso!' });
    } catch (err) { res.status(500).json({ success: false, message: 'Erro ao apagar insumo.' }); }
});
app.put('/api/insumos/estoque/:id', async (req, res) => {
    const { quantidadeAdicional } = req.body;
    try {
        const result = await db.query(`UPDATE insumos SET quantidade_estoque_matriz = quantidade_estoque_matriz + $1 WHERE id = $2 RETURNING *`, [quantidadeAdicional, req.params.id]);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: 'Erro ao atualizar estoque.' }); }
});


// --- ENDPOINTS DE SOLICITAÇÕES ---
app.get('/api/solicitacoes', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM solicitacoes ORDER BY id DESC");
        res.json({success: true, data: result.rows});
    } catch (err) { res.status(500).json({success: false, message: 'Erro ao buscar solicitações.'}); }
});
app.post('/api/solicitacoes', async (req, res) => {
    const { unidadeLogin, unidadeNome, insumoNome } = req.body;
    const params = [unidadeLogin, unidadeNome, insumoNome, new Date().toISOString(), "Pendente", 0];
    try {
        const result = await db.query(`INSERT INTO solicitacoes (unidade_login, unidade_nome, insumo_nome, data, status, quantidade_solicitada) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, params);
        res.json({ success: true, message: 'Solicitação criada!', data: result.rows[0] });
    } catch (err) { res.status(400).json({ success: false, message: 'Erro ao criar solicitação.' }); }
});
app.put('/api/solicitacoes/:id/confirmar', async (req, res) => {
    const { quantidadeConfirmadaAdmin } = req.body;
    try {
        const result = await db.query(`UPDATE solicitacoes SET status = 'Confirmado', quantidade_confirmada_admin = $1 WHERE id = $2`, [quantidadeConfirmadaAdmin, req.params.id]);
        if(result.rowCount === 0) return res.status(404).json({success: false, message: 'Solicitação não encontrada.'});
        res.json({success: true, message: 'Solicitação confirmada!'});
    } catch (err) { res.status(500).json({success: false, message: 'Erro ao confirmar solicitação.'}); }
});

// --- ENDPOINTS DE GESTÃO DA UNIDADE ---
app.get('/api/unidade/:id/insumos', async (req, res) => {
    const sql = `SELECT i.*, ui.estoque_local, ui.estoque_minimo_unidade FROM insumos i JOIN unidade_insumos ui ON i.id = ui.insumo_id WHERE ui.unidade_id = $1 ORDER BY i.nome`;
    try {
        const result = await db.query(sql, [req.params.id]);
        res.json({success: true, data: result.rows });
    } catch(err) { res.status(500).json({success: false, message: 'Erro ao buscar dados da unidade.'}); }
});
app.post('/api/unidade-insumos', async (req, res) => {
    const { unidadeId, associacoes } = req.body;
    try {
        await db.query('DELETE FROM unidade_insumos WHERE unidade_id = $1', [unidadeId]);
        if (associacoes.length > 0) {
            const values = associacoes.map(a => `(${unidadeId}, ${a.insumoId}, ${a.minimo})`).join(',');
            await db.query(`INSERT INTO unidade_insumos (unidade_id, insumo_id, estoque_minimo_unidade) VALUES ${values}`);
        }
        res.json({ success: true, message: 'Associações salvas com sucesso!' });
    } catch (err) { res.status(500).json({ success: false, message: 'Erro ao salvar associações.' }); }
});
app.put('/api/unidade/estoque', async (req, res) => {
    const { unidadeId, insumoId, novaQuantidade } = req.body;
    try {
        const result = await db.query(`UPDATE unidade_insumos SET estoque_local = $1 WHERE unidade_id = $2 AND insumo_id = $3`, [novaQuantidade, unidadeId, insumoId]);
        res.json({success: true, message: 'Estoque atualizado!'});
    } catch(err) { res.status(500).json({success: false, message: 'Erro ao atualizar estoque.'}); }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}.`));