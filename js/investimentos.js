// js/investimentos.js

// --- Variáveis de Simulação (Para Preços Atuais e Variações) ---
const MOCK_PRICES = {
    'BOVA11': { precoAtual: 120.00, variacaoDia: 0.50 },
    'MXRF11': { precoAtual: 10.50, variacaoDia: -0.20 },
    'CDB DI': { precoAtual: 1050.00, variacaoDia: 0.05 },
    'DEFAULT': { precoAtual: 1.00, variacaoDia: 0.00 },
};
// Cores para o gráfico de rosca
const DISTRIBUTION_COLORS = {
    'Ações': '#FF8C00',      // Laranja (brand-primary)
    'FIIs': '#008080',       // Teal (brand-secondary)
    'Renda Fixa': '#28A745', // Verde (status-success)
    'Fundos': '#DC3545',     // Vermelho
    'Outros': '#A0A0A0'      // Cinza
};

// ======================================================
// FUNÇÕES DE MODAL
// ======================================================

window.openAtivoModal = function(mode, id = null) {
    const modal = document.getElementById('ativo-modal');
    const title = document.getElementById('ativo-modal-title');
    document.getElementById('ativo-form').reset();
    document.getElementById('ativo-id').value = '';

    if (mode === 'new') {
        title.textContent = 'Adicionar Novo Ativo';
        modal.style.display = 'flex';
    }
}

window.closeAtivoModal = function() {
    document.getElementById('ativo-modal').style.display = 'none';
}

// ======================================================
// FUNÇÕES CRUD E CARREGAMENTO
// ======================================================

// Deleta o ativo
window.deleteAtivo = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) return;

    try {
        const response = await fetch(`${API_HOST}ativos/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha na exclusão.');
        
        alert('Ativo excluído com sucesso!');
        loadPortfolio(); 
    } catch (error) {
        console.error('Erro ao excluir ativo:', error);
        alert('Erro ao excluir o ativo. Verifique a conexão com o servidor.');
    }
}

// Carrega o Resumo e Distribuição (Donut Chart)
async function loadConsolidatedSummary() {
    try {
        const response = await fetch(`${API_HOST}carteira/consolidado`);
        const data = await response.json();
        
        const totalGeral = data.totalPatrimonio;
        let cssGradient = '';
        let currentDegree = 0;
        
        const distribuicaoContainer = document.getElementById('invest-distribuicao-container');
        distribuicaoContainer.innerHTML = '';
        
        // Variáveis para cálculo de KPIs Secundários
        let custoTotalInvestido = 0;
        const ativosResponse = await fetch(`${API_HOST}ativos`);
        const ativos = await ativosResponse.json();

        // 1. Calcular Custo Total (Valor Investido)
        ativos.forEach(a => {
            custoTotalInvestido += a.quantidade * a.custo_medio;
        });
        
        // 2. Calcular o Lucro e Rentabilidade (Baseado em mock prices)
        const mockPatrimonioAtual = ativos.reduce((sum, a) => {
            const priceData = MOCK_PRICES[a.produto] || MOCK_PRICES['DEFAULT'];
            return sum + (a.quantidade * priceData.precoAtual);
        }, 0);

        const lucroTotal = mockPatrimonioAtual - custoTotalInvestido;
        const rentabilidadeTotal = (mockPatrimonioAtual / custoTotalInvestido - 1) * 100 || 0;
        
        const lucroClass = lucroTotal >= 0 ? 'text-status-success' : 'text-status-error';
        const rentabilidadeClass = rentabilidadeTotal >= 0 ? 'text-status-success' : 'text-status-error';

        // 3. Gerar o Gráfico de Rosca
        data.distribuicao.forEach(item => {
            const color = DISTRIBUTION_COLORS[item.tipo] || DISTRIBUTION_COLORS['Outros'];
            const percentage = totalGeral > 0 ? (item.valor / totalGeral) : 0;
            const endDegree = currentDegree + (percentage * 360);

            cssGradient += `${color} ${currentDegree}deg ${endDegree}deg, `;
            currentDegree = endDegree;

            distribuicaoContainer.innerHTML += `
                <div class="flex justify-between items-center text-sm">
                    <span class="text-text-primary flex items-center">
                        <span class="w-2 h-2 rounded-full mr-2" style="background-color: ${color};"></span>
                        ${item.tipo}
                    </span>
                    <span class="font-semibold text-text-secondary">${formatPercent(item.percentual)}</span>
                </div>
            `;
        });
        
        document.getElementById('invest-donut-chart').style.background = `conic-gradient(${cssGradient.slice(0, -2)})`;
        document.getElementById('invest-donut-total').textContent = `${formatPercent(100)}`;

        // 4. Atualiza KPIs Principais e Secundários
        document.getElementById('kpi-total-patrimonio').textContent = formatCurrency(mockPatrimonioAtual); 
        document.getElementById('kpi-valor-investido').textContent = formatCurrency(custoTotalInvestido); 
        
        const lucroElement = document.getElementById('kpi-lucro-total');
        lucroElement.textContent = formatCurrency(lucroTotal);
        lucroElement.classList.add(lucroClass);
        document.getElementById('kpi-ganhos-liquidos').textContent = `Ganhos: ${formatCurrency(lucroTotal > 0 ? lucroTotal : 0)}`;

        const rentabElement = document.getElementById('kpi-rentabilidade');
        rentabElement.textContent = formatPercent(rentabilidadeTotal);
        rentabElement.classList.add(rentabilidadeClass);

        document.getElementById('kpi-proventos').textContent = formatCurrency(80.26);
        document.getElementById('kpi-variacao-dia').textContent = formatPercent(3.07);
        
    } catch(error) {
        console.error('Erro ao carregar consolidado:', error);
        document.getElementById('kpi-total-patrimonio').textContent = 'R$ Erro';
    }
}

// 5. Carrega a Tabela Detalhada de Ativos
async function loadAtivosTable() {
     try {
        const response = await fetch(`${API_HOST}ativos`);
        const ativos = await response.json();

        const tbody = document.querySelector('#table-ativos tbody');
        tbody.innerHTML = ''; 

        if (ativos.length === 0) {
             tbody.innerHTML = '<tr><td colspan="7" class="text-text-secondary text-center py-4">Nenhum ativo cadastrado.</td></tr>';
            return;
        }

        ativos.forEach(a => {
            const priceData = MOCK_PRICES[a.produto] || MOCK_PRICES['DEFAULT'];
            const valorAtual = a.quantidade * priceData.precoAtual;
            const custoTotal = a.quantidade * a.custo_medio;
            const variacaoTotal = valorAtual - custoTotal;
            const rentabilidade = (valorAtual / custoTotal - 1) * 100 || 0;
            const rentabilidadeDia = priceData.variacaoDia;
            
            const rentabClass = rentabilidade >= 0 ? 'text-status-success' : 'text-status-error';
            const variacaoClass = rentabilidadeDia >= 0 ? 'text-status-success' : 'text-status-error';

            tbody.innerHTML += `
                <tr class="border-b border-border-default hover:bg-bg-hover transition duration-200">
                    <td class="py-2 px-2 font-semibold">${a.produto}</td>
                    <td class="py-2 px-2 text-text-secondary">${a.quantidade.toFixed(a.tipo_ativo === 'Renda Fixa' ? 0 : 2)}</td>
                    <td class="py-2 px-2 text-right text-text-secondary">${formatCurrency(a.custo_medio)}</td>
                    <td class="py-2 px-2 text-right font-bold">${formatCurrency(priceData.precoAtual)}</td>
                    <td class="py-2 px-2 text-right ${variacaoClass}">${formatPercent(rentabilidadeDia)}</td>
                    <td class="py-2 px-2 text-right ${rentabClass} font-bold">${formatCurrency(custoTotal)}</td>
                    <td class="py-2 px-2 text-center">
                        <span class="icon-action hover:text-status-error" onclick="deleteAtivo(${a.id})">&#x2715;</span>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar ativos:', error);
    }
}

// Função principal de carregamento
function loadPortfolio() {
    loadConsolidatedSummary();
    loadAtivosTable();
}

// Lógica de Envio do Formulário (Create Ativo)
document.getElementById('ativo-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    data.quantidade = parseFloat(data.quantidade);
    data.custo_medio = parseFloat(data.custo_medio);

    try {
        const response = await fetch(`${API_HOST}ativos`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) throw new Error('Falha ao salvar ativo.');

        alert('Ativo salvo com sucesso!');
        closeAtivoModal();
        event.target.reset();
        loadPortfolio(); 
    } catch(error) {
        console.error('Erro ao salvar ativo:', error);
        alert(`Erro ao salvar ativo. Verifique o console e a conexão com o servidor.`);
    }
});

// Ação Inicial
document.addEventListener('DOMContentLoaded', loadPortfolio);