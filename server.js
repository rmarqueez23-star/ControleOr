// server.js - Versão FINAL, Corrigida e Consolidada

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
        
        // 1.1. Tabela de Transações (Chave primária corrigida e campos de frequência)
        db.run(`
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL,         -- 'Receita' ou 'Despesa'
                valor REAL NOT NULL,
                descricao TEXT NOT NULL,
                data TEXT NOT NULL,         
                categoria TEXT,
                status TEXT DEFAULT 'A Pagar', 
                frequencia TEXT DEFAULT 'Unica', 
                parcela_atual INTEGER,
                parcelas_totais INTEGER,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('ERRO AO CRIAR TABELA TRANSACOES:', err.message);
            else {
                console.log('Tabela "transacoes" verificada/criada com sucesso.');
                
                // 1.2. Tabela de Metas (Aninhada)
                db.run(`CREATE TABLE IF NOT EXISTS metas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo TEXT NOT NULL,
                    valor_total REAL NOT NULL,
                    valor_arrecadado REAL DEFAULT 0,
                    prazo_meses INTEGER,
                    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) console.error('ERRO AO CRIAR TABELA METAS:', err.message);
                    else {
                        console.log('Tabela "metas" verificada/criada com sucesso.');

                        // 1.3. Tabela de Ativos (Aninhada)
                        db.run(`CREATE TABLE IF NOT EXISTS ativos (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            produto TEXT NOT NULL, tipo_ativo TEXT NOT NULL, quantidade REAL NOT NULL,
                            custo_medio REAL NOT NULL, instituicao TEXT, vencimento TEXT,               
                            data_aquisicao DATETIME DEFAULT CURRENT_TIMESTAMP
                        )`, (err) => {
                            if (err) console.error('ERRO AO CRIAR TABELA ATIVOS:', err.message);
                            else {
                                console.log('Tabela "ativos" verificada/criada com sucesso.');

                                // OPCIONAL: Inserção de dados de exemplo (Para Metas e Ativos)
                                db.get("SELECT COUNT(*) AS count FROM metas", (err, row) => {
                                    if (row && row.count === 0) {
                                        db.run(`INSERT INTO metas (titulo, valor_total, valor_arrecadado, prazo_meses) VALUES 
                                                ('Reforma da Casa', 50000.00, 15000.00, 24),
                                                ('Viagem Europa', 10000.00, 8000.00, 12)`);
                                    }
                                });
                                db.get("SELECT COUNT(*) AS count FROM ativos", (err, row) => {
                                    if (row && row.count === 0) {
                                        db.run(`INSERT INTO ativos (produto, tipo_ativo, quantidade, custo_medio, instituicao, vencimento) VALUES 
                                                ('BOVA11', 'Ações', 10, 115.50, 'XP Investimentos', NULL),
                                                ('MXRF11', 'FIIs', 50, 10.20, 'Clear', NULL),
                                                ('CDB DI', 'Renda Fixa', 1, 1000.00, 'Banco Inter', '2028-12-31')`);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});


// ======================================================
// 2. FUNÇÃO AUXILIAR DE FILTRO DE DATA
// ======================================================

function getMonthYearFilter(req) {
    const { mes, ano } = req.query;
    if (mes && ano) {
        const monthFilter = `${ano}-${mes.padStart(2, '0')}`;
        return { clause: `WHERE substr(data, 1, 7) = ?`, params: [monthFilter] };
    }
    // Fallback para o mês/ano atual
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());
    const monthFilter = `${currentYear}-${currentMonth}`;
    return { clause: `WHERE substr(data, 1, 7) = ?`, params: [monthFilter] };
}


// ======================================================
// 3. ROTAS CRUD - TRANSAÇÕES (/api/transacoes)
// ======================================================

// ROTA POST (C): Criar/Salvar Nova Transação
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

// ROTA GET (R): Ler/Buscar Todas as Transações (Filtrada por Mês/Ano)
app.get('/api/transacoes', (req, res) => {
    const { clause, params } = getMonthYearFilter(req);
    const sql = `SELECT * FROM transacoes ${clause} ORDER BY data DESC, data_criacao DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); 
    });
});

// ROTA PUT (U): Atualizar Transação
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

// ROTA DELETE (D): Deletar Transação
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
// 4. ROTAS CRUD - METAS (/api/metas)
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

// ROTA PATCH para depositar em uma meta
app.patch('/api/metas/:id/deposito', (req, res) => {
    const id = req.params.id;
    // Aceita tanto 'valor' quanto 'valor_arrecadado' para flexibilidade
    const valorDeposito = req.body.valor || req.body.valor_arrecadado;

    if (typeof valorDeposito !== 'number' || valorDeposito <= 0) {
        return res.status(400).json({ error: 'Valor de depósito inválido.' });
    }

    // Atomically update the value
    const sql = `UPDATE metas SET valor_arrecadado = valor_arrecadado + ? WHERE id = ?`;

    db.run(sql, [valorDeposito, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Meta não encontrada.' });
        
        res.json({ message: 'Depósito realizado com sucesso' });
    });
});


// ======================================================
// 5. ROTAS CRUD - ATIVOS (/api/ativos)
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
// 6. ROTAS DE CONSOLIDAÇÃO E GRÁFICOS
// ======================================================

// ROTA GET para o Balanço Mensal Projetado (Gráfico)
app.get('/api/balanco-mensal', (req, res) => {
    const sqlReceitaMedia = `SELECT IFNULL(AVG(valor), 0) AS avgReceita FROM transacoes WHERE tipo = 'Receita'`;
    const sqlDespesaMedia = `SELECT IFNULL(AVG(valor), 0) AS avgDespesa FROM transacoes WHERE tipo = 'Despesa'`;
    
    // NOTA: Removida a taxa de crescimento. O Balanço será uma média histórica constante.

    db.get(sqlReceitaMedia, [], (errReceita, rowReceita) => {
        if (errReceita) return res.status(500).json({ error: errReceita.message });

        db.get(sqlDespesaMedia, [], (errDespesa, rowDespesa) => {
            if (errDespesa) return res.status(500).json({ error: errDespesa.message });

            let receitaMedia = rowReceita.avgReceita;
            let despesaMedia = rowDespesa.avgDespesa;
            
            const balanco = [];
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            
            // Simula os próximos 12 meses com valores MÉDIOS CONSTANTES
            for (let i = 0; i < 12; i++) {
                balanco.push({
                    mes: meses[i],
                    receita: Math.round(receitaMedia),
                    despesa: Math.round(despesaMedia)
                });
            }

            res.json(balanco);
        });
    });
});

// ROTA GET para o Resumo Mensal (KPIs) (Filtrada por Mês/Ano)
app.get('/api/resumo', (req, res) => {
    const { clause, params } = getMonthYearFilter(req);
    
    const sqlReceita = `SELECT IFNULL(SUM(valor), 0) AS totalReceita FROM transacoes ${clause} AND tipo = 'Receita'`;
    const sqlDespesa = `SELECT IFNULL(SUM(valor), 0) AS totalDespesa FROM transacoes ${clause} AND tipo = 'Despesa'`;
    
    const planosValor = 0.00; // Valor fixo removido (é 0 para o cálculo de saldo)

    db.get(sqlReceita, params, (errReceita, rowReceita) => {
        if (errReceita) return res.status(500).json({ error: errReceita.message });

        db.get(sqlDespesa, params, (errDespesa, rowDespesa) => {
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
// 7. INICIALIZAÇÃO DO SERVIDOR EXPRESS
// ======================================================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`[ATENÇÃO] Lembre-se de manter este terminal aberto!`);
});