// server.js - Versão FINAL com Filtro de Mês/Ano

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); 

const app = express();
const PORT = 3000;
const DB_PATH = './financeiro.db'; 

// Middleware
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
        
        // 1.1. Tabela de Transações (Continua a mesma estrutura)
        db.run(`
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL,         
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
            else console.log('Tabela "transacoes" verificada/criada com sucesso.');
        });
        // ... (Criação de Metas e Ativos omitida aqui por brevidade, assumindo que está completa no seu arquivo)
    }
});


// ======================================================
// FUNÇÃO AUXILIAR DE FILTRO DE DATA
// ======================================================

// Cria a cláusula WHERE para filtrar pelo ano e mês da transação
function getMonthYearFilter(req) {
    const { mes, ano } = req.query;
    if (mes && ano) {
        // Formato esperado no DB: 'YYYY-MM-DD'. Usamos substr para filtrar pela string 'YYYY-MM'
        const monthFilter = `${ano}-${mes.padStart(2, '0')}`;
        return { clause: `WHERE substr(data, 1, 7) = ?`, params: [monthFilter] };
    }
    // Retorna o mês e ano atual se não for especificado (fallback)
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());
    const monthFilter = `${currentYear}-${currentMonth}`;
    return { clause: `WHERE substr(data, 1, 7) = ?`, params: [monthFilter] };
}


// ======================================================
// 2. ROTAS CRUD - TRANSAÇÕES (/api/transacoes)
// (ATUALIZADA com filtro de mês/ano)
// ======================================================

// ROTA GET (R): Ler/Buscar Todas as Transações (Filtrada)
app.get('/api/transacoes', (req, res) => {
    const { clause, params } = getMonthYearFilter(req);
    const sql = `SELECT * FROM transacoes ${clause} ORDER BY data DESC, data_criacao DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); 
    });
});
// (Rotas POST, PUT, DELETE de transações continuam iguais, pois não precisam de filtro)


// ======================================================
// 3. ROTAS DE CONSOLIDAÇÃO E GRÁFICOS
// ======================================================

// ROTA GET para o Resumo Mensal (KPIs) (ATUALIZADA com filtro de mês/ano)
app.get('/api/resumo', (req, res) => {
    const { clause, params } = getMonthYearFilter(req);
    
    // Consulta de Receitas no mês filtrado
    const sqlReceita = `SELECT IFNULL(SUM(valor), 0) AS totalReceita FROM transacoes ${clause} AND tipo = 'Receita'`;
    // Consulta de Despesas no mês filtrado
    const sqlDespesa = `SELECT IFNULL(SUM(valor), 0) AS totalDespesa FROM transacoes ${clause} AND tipo = 'Despesa'`;
    
    const planosValor = 500.00; // Mantido fixo
    
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

// ROTA GET para o Balanço Mensal Projetado (Gráfico) (Não mudamos, pois a projeção é baseada na média GERAL, não no mês atual)
app.get('/api/balanco-mensal', (req, res) => {
    // ... (Mantida a lógica de média e simulação de 12 meses)
});


// ... (Rotas CRUD de Metas e Ativos mantidas iguais, pois são gerenciais, não de período)

// ======================================================
// 6. INICIALIZAÇÃO DO SERVIDOR EXPRESS
// ======================================================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});