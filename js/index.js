// js/index.js

// Nomes dos meses para o seletor
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];


// ======================================================
// FUNÇÕES DE FILTRO E INICIALIZAÇÃO
// ======================================================

// 1. Preenche os seletores de Mês e Ano
function initializeFilters() {
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1 a 12
    const currentYear = now.getFullYear();

    // Preenche os meses
    monthSelect.innerHTML = monthNames.map((name, index) => 
        `<option value="${index + 1}" ${index + 1 === currentMonth ? 'selected' : ''}>${name}</option>`
    ).join('');

    // Preenche os anos (últimos 5 anos e próximos 5)
    yearSelect.innerHTML = '';
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const isCurrent = year === currentYear ? 'selected' : '';
        yearSelect.innerHTML += `<option value="${year}" ${isCurrent}>${year}</option>`;
    }
}

// 2. Obtém os parâmetros de data selecionados
function getFilterParams() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-select').value;
    return `mes=${month}&ano=${year}`;
}

// 3. Atualiza o Título do Resumo com o Mês/Ano Selecionado
function updateSummaryTitle(month, year) {
    const monthIndex = parseInt(month) - 1;
    const titleElement = document.querySelector('#resumo-mensal h2');
    if (titleElement) {
        titleElement.textContent = `Resumo de ${monthNames[monthIndex]} ${year}`;
    }
}


// ======================================================
// FUNÇÕES DE TRANSAÇÕES E CRUD
// ======================================================

async function deleteTransaction(id) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
        const response = await fetch(`${API_HOST}transacoes/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha na exclusão.');
        
        alert('Transação excluída com sucesso!');
        refreshUI();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir a transação. Verifique o console.');
    }
}

async function handleEdit(event, id, field) {
    const row = event.target.closest('tr');
    const tipo = row.getAttribute('data-tipo');
    const dataTransacao = row.getAttribute('data-data');

    const newValueText = event.target.textContent;
    let finalValue;
    
    if (field === 'valor') {
        const numericValue = parseFloat(newValueText.replace(/[^0-9,-]+/g, "").replace(',', '.'));
        if (isNaN(numericValue)) {
            alert('Valor inválido. Edição cancelada.');
            refreshUI(); 
            return; 
        }
        finalValue = numericValue;
    } else {
        finalValue = newValueText;
    }

    const payload = {
        tipo: tipo,
        valor: parseFloat(row.querySelector(`[data-field="valor"]`).textContent.replace(/[^0-9,-]+/g, "").replace(',', '.')),
        descricao: row.querySelector(`[data-field="descricao"]`).textContent.split('(')[0].trim(),
        data: dataTransacao,
        categoria: 'Outros', 
        status: 'Pago'
    };
    
    payload[field] = finalValue;

    try {
        const response = await fetch(`${API_HOST}transacoes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Falha na atualização.');
        
        if (field === 'valor') {
            event.target.textContent = formatCurrency(finalValue);
        }
        refreshUI();
    } catch(error) {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao atualizar a transação. Verifique o console.');
        refreshUI(); 
    }
}


// ======================================================
// FUNÇÕES DE CARREGAMENTO DE DADOS (READ COM FILTRO)
// ======================================================

async function loadSummary() {
    const params = getFilterParams();
    
    try {
        const response = await fetch(`${API_HOST}resumo?${params}`);
        const data = await response.json();

        document.getElementById('receita-programada').textContent = formatCurrency(data.receitaProgramada);
        document.getElementById('despesas-lancadas').textContent = formatCurrency(data.despesasFixas); 
        document.getElementById('saldo-projetado').textContent = formatCurrency(data.saldoProjetado);
        
        document.getElementById('total-receita').textContent = formatCurrency(data.receitaProgramada);
        document.getElementById('total-despesa').textContent = formatCurrency(data.despesasFixas); 
    } catch(error) {
        console.error('Erro ao carregar o Resumo Mensal:', error);
    }
}

async function loadTransactionsTable() {
    const params = getFilterParams();
    
    try {
        const response = await fetch(`${API_HOST}transacoes?${params}`);
        const transactions = await response.json();
        
        const tbodyReceitas = document.getElementById('table-receitas-tbody');
        const tbodyDespesas = document.getElementById('table-despesas-tbody');
        
        tbodyReceitas.innerHTML = ''; 
        const staticRowHtml = `<tr class="font-semibold text-status-error border-b border-border-default hover:bg-bg-hover transition duration-200"><td class="py-2">Despesas Fixas (Exemplo Estático)</td><td class="py-2">R$ 4.000,00</td><td class="py-2">-</td><td class="py-2">-</td></tr>`;
        tbodyDespesas.innerHTML = staticRowHtml; 

        transactions.forEach(t => {
            const isExpense = t.tipo === 'Despesa';
            const tableBody = isExpense ? tbodyDespesas : tbodyReceitas;
            const rowClass = isExpense ? 'text-status-error' : 'text-status-success';
            const valorFormatado = formatCurrency(t.valor);
            
            const newRow = `
                <tr class="border-b border-border-default hover:bg-bg-hover transition duration-200" data-id="${t.id}" data-tipo="${t.tipo}" data-data="${t.data}">
                    <td class="py-2 ${rowClass}" data-field="descricao" contenteditable="true" onblur="handleEdit(event, ${t.id}, 'descricao')">${t.descricao} (${t.categoria})</td>
                    <td class="py-2 ${rowClass}" data-field="valor" contenteditable="true" onblur="handleEdit(event, ${t.id}, 'valor')">${valorFormatado}</td>
                    <td class="py-2 text-text-secondary">${t.data}</td>
                    <td class="py-2">
                        <span class="text-text-secondary cursor-pointer hover:text-status-error transition duration-200" onclick="deleteTransaction(${t.id})">&#x2715;</span>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('afterbegin', newRow); 
        });
    } catch(error) {
        console.error('Erro ao carregar a tabela de transações:', error);
    }
}

async function loadGoalsSummary() {
    try {
        const response = await fetch(`${API_HOST}metas`);
        const goals = await response.json();
        
        const container = document.getElementById('goals-summary-container');
        container.innerHTML = ''; 

        if (goals.length === 0) {
            container.innerHTML = '<p class="text-text-secondary text-center">Nenhuma meta cadastrada.</p><a href="metas.html" class="bg-brand-primary text-white font-bold py-2 px-4 rounded block text-center mt-3 hover:bg-orange-700 shadow-smooth">Criar Nova Meta</a>';
            return;
        }

        const topGoals = goals.slice(0, 3); 

        topGoals.forEach(goal => {
            const percent = (goal.valor_arrecadado / goal.valor_total) * 100;
            const percentDisplay = Math.min(100, percent).toFixed(0); 
            const isComplete = percent >= 100;
            
            const titleColor = isComplete ? 'text-status-success' : 'text-brand-secondary';
            const progressColor = isComplete ? 'bg-status-success' : 'bg-brand-secondary'; 

            const cardHtml = `
                <div class="py-3 border-b border-border-default last:border-b-0">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-semibold ${titleColor} text-sm">${goal.titulo}</span>
                        <span class="text-text-secondary text-sm font-semibold">${percentDisplay}%</span>
                    </div>
                    <div class="w-full bg-border-default rounded-full h-1.5">
                        <div class="${progressColor} h-1.5 rounded-full transition-all duration-500" style="width: ${percentDisplay}%;"></div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHtml;
        });
        
        if (goals.length > 3) {
            container.innerHTML += `<p class="text-center mt-3"><a href="metas.html" class="text-text-secondary text-sm hover:text-brand-primary">Ver todas (${goals.length})</a></p>`;
        }
    } catch(error) {
         console.error('Erro ao carregar resumo de metas:', error);
         document.getElementById('goals-summary-container').innerHTML = '<p class="text-text-secondary text-center">Erro ao carregar metas.</p>';
    }
}

async function loadInvestmentSummary() {
    try {
        const response = await fetch(`${API_HOST}carteira/consolidado`);
        const data = await response.json();
        
        document.getElementById('total-patrimonio-resumo').textContent = formatCurrency(data.totalPatrimonio);
        
        const container = document.getElementById('portfolio-distribution-container');
        container.innerHTML = '';
        
        if (data.distribuicao.length === 0) {
            container.innerHTML = '<p class="text-text-secondary">Nenhum investimento cadastrado.</p>';
            return;
        }

        data.distribuicao.forEach(item => {
            const percentualTexto = item.percentual.toFixed(1);

            container.innerHTML += `
                <div class="flex justify-between text-sm py-1">
                    <span class="text-text-secondary">${item.tipo}</span>
                    <span class="font-semibold">${percentualTexto}%</span>
                </div>
            `;
        });
    } catch(error) {
        console.error('Erro ao carregar resumo de investimentos:', error);
        document.getElementById('total-patrimonio-resumo').textContent = 'R$ Erro';
    }
}

async function loadBalanceChart() {
    try {
        const response = await fetch(`${API_HOST}balanco-mensal`);
        const data = await response.json();
        
        const container = document.getElementById('balance-chart-container');
        container.innerHTML = '';
        
        if (data.length === 0 || data.every(d => d.receita === 0 && d.despesa === 0)) {
            container.innerHTML = '<p class="text-text-secondary text-center w-full">Lance Receitas e Despesas para gerar a comparação anual.</p>';
            return;
        }

        const allValues = data.flatMap(item => [item.receita, item.despesa]).filter(v => v !== 0);
        const maxVal = Math.max(...allValues);
        const maxHeight = 230;
        const MIN_HEIGHT = 2; 

        data.forEach(item => {
            const heightReceita = item.receita > 0 
                ? Math.max(MIN_HEIGHT, (item.receita / maxVal) * maxHeight) 
                : 0;
            const heightDespesa = item.despesa > 0 
                ? Math.max(MIN_HEIGHT, (item.despesa / maxVal) * maxHeight) 
                : 0;
            
            const column = document.createElement('div');
            column.className = 'w-1/12 text-center flex flex-col items-center relative';

            column.innerHTML = `
                <div class="flex h-full items-end gap-0.5 w-11/12 mb-1 justify-center">
                    <div class="w-1/2 rounded-t-sm bg-status-error shadow-none" style="height: ${heightDespesa.toFixed(2)}px;"></div>
                    <div class="w-1/2 rounded-t-sm bg-status-success shadow-none" style="height: ${heightReceita.toFixed(2)}px;"></div>
                </div>
                <span class="text-xs text-text-secondary">${item.mes}</span>
            `;

            container.appendChild(column);
        });
    } catch(error) {
        console.error('Erro ao carregar o gráfico de balanço:', error);
        document.getElementById('balance-chart-container').innerHTML = '<p class="text-text-secondary text-center w-full">Erro ao carregar o gráfico de projeção.</p>';
    }
}


// Função de atualização geral da interface
function refreshUI() {
    // Leitura do filtro
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-select').value;
    
    // Atualiza o título
    updateSummaryTitle(month, year);
    
    // Carrega os dados filtrados
    loadSummary();
    loadTransactionsTable();
    
    // Carrega dados não filtrados
    loadGoalsSummary(); 
    loadInvestmentSummary(); 
    loadBalanceChart();
}

// Ação Inicial
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters(); // Primeiro, preenche os seletores
    refreshUI();         // Depois, carrega os dados
});