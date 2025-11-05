// js/lancamentos.js

document.addEventListener('DOMContentLoaded', () => {
    // ======================================================
    // FUNÇÃO DE CARREGAMENTO DO KPI DE ORÇAMENTO (Dinâmica)
    // ======================================================

    async function loadBudgetKPI() {
        try {
            // Para o KPI, precisamos de todas as transações do mês atual, independente do filtro
            const now = new Date();
            const mes = String(now.getMonth() + 1).padStart(2, '0');
            const ano = now.getFullYear();

            const response = await fetch(`${window.API_HOST}transacoes?mes=${mes}&ano=${ano}`);
            if (!response.ok) throw new Error('Falha ao buscar transações para o KPI.');
            const transactions = await response.json();
            
            let receitaTotal = 0;
            let despesaReal = 0; 
            let gastoPlanejadoInvestimento = 0; 

            transactions.forEach(t => {
                if (t.tipo === 'Receita') {
                    receitaTotal += t.valor;
                } else if (t.tipo === 'Despesa') {
                    if (t.categoria === 'Investimentos') {
                        gastoPlanejadoInvestimento += t.valor;
                    } else {
                        despesaReal += t.valor;
                    }
                }
            });

            const valorSobra = receitaTotal - despesaReal - gastoPlanejadoInvestimento;

            document.getElementById('lanc_gasto_planejado').textContent = window.formatCurrency(gastoPlanejadoInvestimento);
            document.getElementById('lanc_receita_total').textContent = window.formatCurrency(receitaTotal);
            
            const sobraElement = document.getElementById('lanc_valor_sobra');
            sobraElement.textContent = window.formatCurrency(valorSobra);
            sobraElement.classList.remove('text-status-success', 'text-status-error');
            sobraElement.classList.add(valorSobra >= 0 ? 'text-status-success' : 'text-status-error');

        } catch (error) {
            console.error('Erro ao carregar KPI de orçamento:', error);
        }
    }


    // ======================================================
    // LÓGICA DO FORMULÁRIO E LISTAGEM
    // ======================================================

    // 1. Gerenciador de estado visual para botões de segmento
    function updateSegmentButtons() {
        const allRadios = document.querySelectorAll('input[type="radio"][name="tipo"], input[type="radio"][name="frequencia"]');
        
        allRadios.forEach(radio => {
            const label = document.querySelector(`label[for="${radio.id}"]`);
            if (label) {
                if (radio.checked) {
                    label.classList.add('segment-btn-active');
                } else {
                    label.classList.remove('segment-btn-active');
                }
            }
        });

        // Controle da visibilidade dos campos de Parcelamento
        const isParcelada = document.getElementById('parcelada')?.checked;
        const fields = document.getElementById('parcela-fields');
        if (fields) {
            const fields = document.getElementById('parcela-fields');
            fields.classList.toggle('hidden', !isParcelada);
            document.querySelector('input[name="parcelas_totais"]').required = isParcelada;
            document.querySelector('input[name="parcela_atual"]').required = isParcelada;
            if (!isParcelada) {
                document.querySelector('input[name="parcelas_totais"]').value = 1;
                document.querySelector('input[name="parcela_atual"]').value = 1;
            }
        }
    }
    document.querySelectorAll('input[type="radio"][name="tipo"], input[type="radio"][name="frequencia"]').forEach(radio => {
        radio.addEventListener('change', updateSegmentButtons);
    });

    // 1.1. Lógica do botão Limpar
    document.getElementById('btn-limpar-form')?.addEventListener('click', () => {
        const form = document.getElementById('transaction-form');
        if (form) {
            form.reset();
            document.getElementById('despesa').checked = true;
            document.getElementById('unica').checked = true;
            updateSegmentButtons();
        }
    });


    // 2. Lógica de Envio do Formulário (Create)
    document.getElementById('transaction-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        data.valor = parseFloat(data.valor);
        data.parcelas_totais = (data.frequencia === 'Parcelada') ? parseInt(data.parcelas_totais) : null;
        data.parcela_atual = (data.frequencia === 'Parcelada') ? parseInt(data.parcela_atual) : null;
        data.status = (data.tipo === 'Receita') ? 'A Receber' : 'A Pagar';

        try {
            const response = await fetch(`${window.API_HOST}transacoes`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Falha na conexão ou servidor.');

            // Aguarda o usuário fechar o modal de sucesso antes de continuar
            showSuccessModalAndRefresh(event.target);
        } catch (error) {
            console.error('Erro ao salvar lançamento:', error);
            alert(`Erro ao salvar lançamento. Verifique se o servidor (Node.js) está rodando.`);
        }
        // Retornar false para garantir a interrupção de qualquer processamento adicional do formulário.
        return false;
    });
    
    // Função para exibir o modal de sucesso e aguardar a interação do usuário
    function showSuccessModalAndRefresh(formElement) {
        const modal = document.getElementById('success-lancamento-modal');
        const okButton = document.getElementById('success-modal-ok-btn');
        
        modal.style.display = 'flex';

        // Usamos .onclick para garantir que apenas um listener esteja ativo
        okButton.onclick = function() {
            modal.style.display = 'none';

            // Limpa o formulário e atualiza a UI de forma controlada
            formElement.reset();
            document.getElementById('despesa').checked = true;
            document.getElementById('unica').checked = true;
            updateSegmentButtons();

            loadTransactionsListings();
            loadBudgetKPI();
        };
    }
    
    // Função para deletar a transação
    window.deleteTransaction = async function(id) {
        if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

        try {
            const response = await fetch(`${window.API_HOST}transacoes/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha na exclusão.');
            
            alert('Lançamento excluído com sucesso!');
            loadTransactionsListings();
            loadBudgetKPI(); 
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir o lançamento. Verifique o console.');
        }
    }
    
    // Função para mudar o status (Pago/Recebido)
    window.updateTransactionStatus = async function(id, currentStatus) {
        let newStatus = '';
        if (currentStatus === 'A Pagar') newStatus = 'Pago';
        else if (currentStatus === 'A Receber') newStatus = 'Recebido';
        else return; 

        if (!confirm(`Confirma marcar como "${newStatus}"?`)) return;

        try {
            const res = await fetch(`${window.API_HOST}transacoes`);
            const allTransactions = await res.json();
            const t = allTransactions.find(item => item.id == id);

            if (!t) throw new Error('Transação não encontrada para atualização.');
            
            const payload = {
                ...t,
                status: newStatus,
                valor: parseFloat(t.valor) 
            };

            const response = await fetch(`${window.API_HOST}transacoes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Falha na atualização de status.');
            
            loadTransactionsListings(); 
            loadBudgetKPI(); 
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar o status da transação. Verifique o console.');
        }
    }


    // Função principal para carregar as listagens nas 3 tabelas
    async function loadTransactionsListings() {
        try {
            const response = await fetch(`${window.API_HOST}transacoes`);
            const transactions = await response.json();

            const tbodyReceitas = document.querySelector('#table-receitas-lancamentos tbody');
            const tbodyDespesasFixas = document.querySelector('#table-despesas-fixas tbody');
            const tbodyDespesasParceladas = document.querySelector('#table-despesas-parceladas tbody');
            
            tbodyReceitas.innerHTML = '';
            tbodyDespesasFixas.innerHTML = '';
            tbodyDespesasParceladas.innerHTML = '';

            let totalReceita = 0;
            let totalDespesaFixa = 0;
            let totalDespesaParcelada = 0;

            transactions.forEach(t => {
                const valorFormatado = window.formatCurrency(t.valor);
                const isExpense = t.tipo === 'Despesa';
                
                let tableBody;
                if (t.tipo === 'Receita') {
                    tableBody = tbodyReceitas;
                    totalReceita += t.valor;
                } else if (t.frequencia === 'Parcelada') {
                    tableBody = tbodyDespesasParceladas;
                    totalDespesaParcelada += t.valor;
                } else { 
                    tableBody = tbodyDespesasFixas;
                    totalDespesaFixa += t.valor; 
                }
                
                // Lógica para Botão de Ação (Pagar/Receber)
                let actionHTML;
                if ((isExpense && t.status === 'A Pagar') || (!isExpense && t.status === 'A Receber')) {
                    const actionText = isExpense ? 'Marcar Pago' : 'Marcar Recebido';
                    const actionClass = isExpense ? 'btn-delete' : 'btn-edit'; // Reutilizando estilos de metas.html, mas com cores diferentes
                    actionHTML = `<button class="py-2 px-3 text-xs font-bold rounded-lg transition-all duration-300 ${actionClass}" onclick="updateTransactionStatus(${t.id}, '${t.status}')">${actionText}</button>`;
                } else {
                    // Já está pago ou recebido
                    const statusColor = t.status.includes('Pago') || t.status.includes('Recebido') ? 'text-status-success' : 'text-status-error';
                    actionHTML = `<span class="${statusColor} font-bold text-xs">${t.status}</span>`;
                }
                
                const row = `
                    <tr class="border-b border-border-default hover:bg-bg-hover transition duration-200">
                        <td class="py-3 px-1">${t.descricao} (${t.categoria})</td>
                        <td class="py-3 px-1 font-bold ${isExpense ? 'text-status-error' : 'text-status-success'}">${valorFormatado}</td>
                        <td class="py-3 px-1 text-text-dim">${t.frequencia} ${t.frequencia === 'Parcelada' ? `(${t.parcela_atual}/${t.parcelas_totais})` : ''}</td>
                        <td class="py-3 px-1 text-text-dim">${t.data}</td>
                        <td class="py-3 px-1 text-center">${actionHTML}</td>
                        <td class="py-3 px-1 text-center">
                            <span class="text-text-dim cursor-pointer hover:text-status-error transition duration-200" onclick="deleteTransaction(${t.id})">&#x2715;</span>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row); 
            });
            
            document.getElementById('total-receita-lancamentos').textContent = window.formatCurrency(totalReceita);
            document.getElementById('total-despesa-fixa-lancamentos').textContent = window.formatCurrency(totalDespesaFixa);
            document.getElementById('total-despesa-parcelada-lancamentos').textContent = window.formatCurrency(totalDespesaParcelada);

        } catch (error) {
            console.error('Erro ao carregar lançamentos:', error);
        }
    }

    // Ação Inicial: Carrega listagens e o KPI
    loadTransactionsListings();
    loadBudgetKPI();
    updateSegmentButtons(); // Garante o estado visual inicial correto
});