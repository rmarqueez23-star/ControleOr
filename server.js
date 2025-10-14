// server.js - Versão FINAL com CRUD completo e Rotas de Balanço Gráfico

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); 

const app = express();
const PORT = 3000;
const DB_PATH = './financeiro.db'; 

// Middleware (para processar JSON e habilitar CORS)
app.use(cors());
app.use(express.json());

// ======================================================
// 1. INICIALIZAÇÃO DO BANCO DE DADOS E CRIAÇÃO DE TABELAS
// ======================================================

let db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('ERRO CRÍTICO AO ABRIR BD:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        
        // 1.1. Tabela de Transações (ATUALIZADA para Frequência e Parcelamento)
        db.run(`
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL,         -- 'Receita' ou 'Despesa'
                valor REAL NOT NULL,
                descricao TEXT NOT NULL,
                data TEXT NOT NULL,         
                categoria TEXT,
                status TEXT DEFAULT 'A Pagar', -- 'A Pagar', 'Pago', 'A Receber', 'Recebido'
                frequencia TEXT DEFAULT 'Unica', -- 'Fixa', 'Parcelada', 'Unica'
                parcela_atual INTEGER,
                parcelas_totais INTEGER,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('ERRO AO CRIAR TABELA TRANSACOES:', err.message);
            else console.log('Tabela "transacoes" verificada/criada com sucesso.');
        });
        
        // 1.2. Tabela de Metas
        db.run(`CREATE TABLE IF NOT EXISTS metas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            valor_total REAL NOT NULL,
            valor_arrecadado REAL DEFAULT 0,
            prazo_meses INTEGER,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('ERRO AO CRIAR TABELA METAS:', err.message);
            else console.log('Tabela "metas" verificada/criada com sucesso.');
            // (Inserção de dados de exemplo...)
        });

        // 1.3. Tabela de Ativos
        db.run(`CREATE TABLE IF NOT EXISTS ativos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto TEXT NOT NULL, tipo_ativo TEXT NOT NULL, quantidade REAL NOT NULL,
            custo_medio REAL NOT NULL, instituicao TEXT, vencimento TEXT,               
            data_aquisicao DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('ERRO AO CRIAR TABELA ATIVOS:', err.message);
            else console.log('Tabela "ativos" verificada/criada com sucesso.');
            // (Inserção de dados de exemplo...)
        });
    }
});


// ======================================================
// 2. ROTAS CRUD - TRANSAÇÕES (/api/transacoes)
// (Inclui frequencia e parcelas)
// ======================================================

app.post('/api/transacoes', (req, res) => {
    const { tipo, valor, descricao, data, categoria, status, frequencia, parcela_atual, parcelas_totais } = req.body;
    if (!tipo || !valor || !descricao || !data) {
        return res.status(400).json({ error: 'Dados incompletos para a transação.' });
    }

    const finalStatus = status || (tipo === 'Receita' ? 'A Receber' : 'A Pagar');
    
    const sql = `
        INSERT INTO transacoes 
        (tipo, valor, descricao, data, categoria, status, frequencia, parcela_atual, parcelas_totais) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
        tipo, valor, descricao, data, categoria, finalStatus, 
        frequencia || 'Unica', 
        parcela_atual || null, 
        parcelas_totais || null
    ], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Transação salva com sucesso', id: this.lastID });
    });
});

app.get('/api/transacoes', (req, res) => {
    const sql = `SELECT * FROM transacoes ORDER BY data DESC, data_criacao DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); 
    });
});

app.put('/api/transacoes/:id', (req, res) => {
    const id = req.params.id;
    const { tipo, valor, descricao, data, categoria, status, frequencia, parcela_atual, parcelas_totais } = req.body;

    const sql = `
        UPDATE transacoes 
        SET tipo = ?, valor = ?, descricao = ?, data = ?, categoria = ?, status = ?, frequencia = ?, parcela_atual = ?, parcelas_totais = ? 
        WHERE id = ?
    `;
    
    db.run(sql, [
        tipo, valor, descricao, data, categoria, status, 
        frequencia || 'Unica', 
        parcela_atual || null, 
        parcelas_totais || null, 
        id
    ], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Transação não encontrada.' });
        res.json({ message: 'Transação atualizada com sucesso' });
    });
});

app.delete('/api/transacoes/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM transacoes WHERE id = ?';
    
    db.run(sql, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Transação não encontrada.' });
        res.json({ message: 'Transação excluída com sucesso' });
    });
});


// ======================================================
// 3. ROTAS CRUD - METAS (/api/metas)
// (Mantidas)
// ======================================================

app.post('/api/metas', (req, res) => {
    const { titulo, valor_total, valor_arrecadado, prazo_meses } = req.body;
    if (!titulo || !valor_total || !prazo_meses) {
        return res.status(400).json({ error: 'Dados incompletos para a meta.' });
    }

    const sql = `INSERT INTO metas (titulo, valor_total, valor_arrecadado, prazo_meses) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [titulo, valor_total, valor_arrecadado || 0, prazo_meses], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Meta salva com sucesso', id: this.lastID });
    });
});

app.get('/api/metas', (req, res) => {
    const sql = `SELECT * FROM metas ORDER BY valor_arrecadado / valor_total DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); 
    });
});

app.get('/api/metas/:id', (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM metas WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: 'Meta não encontrada.' });
        res.json(row);
    });
});

app.put('/api/metas/:id', (req, res) => {
    const id = req.params.id;
    const { titulo, valor_total, valor_arrecadado, prazo_meses } = req.body;

    const sql = `UPDATE metas SET titulo = ?, valor_total = ?, valor_arrecadado = ?, prazo_meses = ? WHERE id = ?`;
    
    db.run(sql, [titulo, valor_total, valor_arrecadado, prazo_meses, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Meta não encontrada.' });
        res.json({ message: 'Meta atualizada com sucesso' });
    });
});

app.delete('/api/metas/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM metas WHERE id = ?';
    
    db.run(sql, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Meta não encontrada.' });
        res.json({ message: 'Meta excluída com sucesso' });
    });
});


// ======================================================
// 4. ROTAS CRUD - ATIVOS (/api/ativos)
// (Mantidas)
// ======================================================

app.post('/api/ativos', (req, res) => {
    const { produto, tipo_ativo, quantidade, custo_medio, instituicao, vencimento } = req.body;
    if (!produto || !tipo_ativo || !quantidade || !custo_medio) {
        return res.status(400).json({ error: 'Dados incompletos para o ativo.' });
    }

    const sql = `INSERT INTO ativos (produto, tipo_ativo, quantidade, custo_medio, instituicao, vencimento) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [produto, tipo_ativo, quantidade, custo_medio, instituicao, vencimento], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Ativo salvo com sucesso', id: this.lastID });
    });
});

app.get('/api/ativos', (req, res) => {
    const sql = `SELECT * FROM ativos ORDER BY tipo_ativo, produto`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); 
    });
});

app.delete('/api/ativos/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM ativos WHERE id = ?';
    
    db.run(sql, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Ativo não encontrado.' });
        res.json({ message: 'Ativo excluído com sucesso' });
    });
});

// ROTA GET para Consolidação da Carteira (Resumo Investimentos)
app.get('/api/carteira/consolidado', (req, res) => {
    const sql = `
        SELECT 
            tipo_ativo, 
            SUM(quantidade * custo_medio) AS total_investido
        FROM ativos
        GROUP BY tipo_ativo
        ORDER BY total_investido DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const totalGeral = rows.reduce((sum, row) => sum + row.total_investido, 0);

        const consolidado = {
            totalPatrimonio: totalGeral,
            distribuicao: rows.map(row => ({
                tipo: row.tipo_ativo,
                valor: row.total_investido,
                percentual: totalGeral > 0 ? (row.total_investido / totalGeral) * 100 : 0
            }))
        };
        res.json(consolidado);
    });
});


// ======================================================
// 5. ROTAS DE CONSOLIDAÇÃO E GRÁFICOS
// ======================================================

// ROTA GET para o Balanço Mensal Projetado (Gráfico)
app.get('/api/balanco-mensal', (req, res) => {
    const sqlReceitaMedia = `SELECT IFNULL(AVG(valor), 0) AS avgReceita FROM transacoes WHERE tipo = 'Receita'`;
    const sqlDespesaMedia = `SELECT IFNULL(AVG(valor), 0) AS avgDespesa FROM transacoes WHERE tipo = 'Despesa'`;
    
    const taxaCrescimento = 0.005; 

    db.get(sqlReceitaMedia, [], (errReceita, rowReceita) => {
        if (errReceita) return res.status(500).json({ error: errReceita.message });

        db.get(sqlDespesaMedia, [], (errDespesa, rowDespesa) => {
            if (errDespesa) return res.status(500).json({ error: errDespesa.message });

            let receitaAtual = rowReceita.avgReceita;
            let despesaAtual = rowDespesa.avgDespesa;
            
            const balanco = [];
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            
            // Simula os próximos 12 meses
            for (let i = 0; i < 12; i++) {
                receitaAtual = receitaAtual * (1 + taxaCrescimento); 

                balanco.push({
                    mes: meses[i],
                    receita: Math.round(receitaAtual),
                    despesa: Math.round(despesaAtual)
                });
            }

            res.json(balanco);
        });
    });
});

// ROTA GET para o Resumo Mensal (KPIs)
app.get('/api/resumo', (req, res) => {
    const sqlReceita = `SELECT IFNULL(SUM(valor), 0) AS totalReceita FROM transacoes WHERE tipo = 'Receita'`;
    const sqlDespesa = `SELECT IFNULL(SUM(valor), 0) AS totalDespesa FROM transacoes WHERE tipo = 'Despesa'`;
    
    const planosValor = 500.00; 

    db.get(sqlReceita, [], (errReceita, rowReceita) => {
        if (errReceita) return res.status(500).json({ error: errReceita.message });

        db.get(sqlDespesa, [], (errDespesa, rowDespesa) => {
            if (errDespesa) return res.status(500).json({ error: errDespesa.message });

            const receita = rowReceita.totalReceita;
            const despesa = rowDespesa.totalDespesa;
            const saldo = receita - despesa - planosValor;

            res.json({
                receitaProgramada: receita,
                despesasFixas: despesa, 
                planos: planosValor,
                saldoProjetado: saldo
            });
        });
    });
});


// ======================================================
// 6. INICIALIZAÇÃO DO SERVIDOR EXPRESS
// ======================================================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`[ATENÇÃO] Lembre-se de manter este terminal aberto!`);
});