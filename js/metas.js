// js/metas.js - Lógica de Renderização e Interação (Metas)

const API_HOST = window.API_HOST || 'http://localhost:3000/api/';

/**
 * Adiciona Event Listeners aos botões e campos de depósito.
 */
function addEventListenersToCards() {
    document.querySelectorAll('[data-goal-id]').forEach(card => {
        const goalId = card.dataset.goalId;

        // 1. Lógica do Menu de Ações (Excluir/Editar)
        const menuButton = card.querySelector('.action-menu-button');
        const menuContent = card.querySelector('.action-menu-content');
        
        menuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            menuContent.classList.toggle('hidden');
        });

        card.querySelector('.edit-button').addEventListener('click', (e) => {
            e.preventDefault();
            // Assumimos que openMetaModal está no escopo global (ou em utils.js)
            window.openMetaModal('edit', goalId); 
            menuContent.classList.add('hidden');
        });

        card.querySelector('.delete-button').addEventListener('click', (e) => {
            e.preventDefault();
            // Chama a função de exclusão global
            window.deleteGoalWrapper(goalId); 
            menuContent.classList.add('hidden');
        });
        
        // 2. Lógica do Depósito
        const depositInput = card.querySelector('.deposit-input');
        const depositButton = card.querySelector('.deposit-button');
        
        // Ativa/Desativa o botão de depósito
        depositInput.addEventListener('input', () => {
            const value = parseFloat(depositInput.value);
            depositButton.disabled = isNaN(value) || value <= 0;
        });

        // Submissão do depósito (Chama a função central)
        depositButton.addEventListener('click', window.handleDeposit);
    });

    // Fecha todos os menus de ação se clicar fora
    document.addEventListener('click', (event) => {
        document.querySelectorAll('.action-menu-content').forEach(menu => {
            if (!menu.parentElement.contains(event.target)) {
                menu.classList.add('hidden');
            }
        });
    });
}

/**
 * Lógica do Depósito (PATCH na API e Atualização em Tempo Real)
 */
window.handleDeposit = async function(event) {
    event.preventDefault();
    const card = event.target.closest('[data-goal-id]');
    const goalId = card.dataset.goalId;
    const input = card.querySelector('.deposit-input');
    const depositValue = parseFloat(input.value);

    // Validação já ocorreu, mas repetimos por segurança
    if (isNaN(depositValue) || depositValue <= 0) return;

    const currentAmount = parseFloat(card.dataset.currentValue);
    const newAmount = currentAmount + depositValue;

    const payload = { 
        valor_arrecadado: newAmount,
        // (Em um sistema real, você também ajustaria o prazo restante)
    };

    try {
        // Microanimação de clique no botão
        event.target.classList.add('animate-ping-once'); 
        
        const response = await fetch(`${API_HOST}metas/${goalId}`, {
            method: 'PUT', // Usamos PUT/PATCH para atualizar o valor
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Falha ao atualizar a meta.');

        // Microanimação de feedback
        const feedback = card.querySelector('.deposit-feedback');
        feedback.classList.remove('hidden', 'text-status-error');
        feedback.classList.add('text-status-success', 'animate-pulse');
        feedback.textContent = `+${window.formatCurrency(depositValue)} adicionado!`;
        
        input.value = ''; // Limpa o input
        event.target.classList.remove('animate-ping-once');
        event.target.disabled = true; // Desabilita o botão até o próximo input

        // Recarrega todas as metas para refletir a mudança visualmente
        window.loadGoals(); 
        
    } catch (error) {
        event.target.classList.remove('animate-ping-once');
        const feedback = card.querySelector('.deposit-feedback');
        feedback.classList.remove('hidden', 'text-status-success');
        feedback.classList.add('text-status-error');
        feedback.textContent = `Erro: ${error.message}`;
        console.error('Erro ao depositar na meta:', error);
    }
};


/**
 * Renderiza todos os cards de meta.
 */
window.loadGoals = async function() {
    try {
        const response = await fetch(`${API_HOST}metas`);
        const goals = await response.json();
        const container = document.getElementById('goals-list-container');
        
        if (!container) return;

        container.innerHTML = ''; 

        if (goals.length === 0) {
            container.innerHTML = '<p class="text-text-secondary text-center col-span-full">Nenhuma meta cadastrada.</p>';
            return;
        }

        goals.forEach(goal => {
            const total = parseFloat(goal.valor_total);
            const arrecadado = parseFloat(goal.valor_arrecadado);
            const progress = (arrecadado / total) * 100;
            const progressDisplay = Math.min(100, progress).toFixed(0);
            const isComplete = progress >= 100;
            
            // Estilos sofisticados
            const titleColor = isComplete ? 'text-status-success' : 'text-aqua';
            const progressBarClass = isComplete ? 'progress-bar-gold' : 'progress-bar-animated';

            const cardHtml = `
                <div class="card-glow-border bg-bg-card light:bg-white p-6 rounded-2xl border border-border-default light:border-slate-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                     data-goal-id="${goal.id}" data-current-value="${arrecadado}" data-total-value="${total}">
                    
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold ${titleColor}">${goal.titulo}</h3>
                        <div class="relative action-menu">
                            <button class="action-menu-button text-text-secondary hover:text-accent-main transition duration-200 focus:outline-none">
                                <svg class="w-6 h-6"><use xlink:href="#icon-dots"></use></svg>
                            </button>
                            <div class="action-menu-content hidden absolute right-0 mt-2 w-32 bg-bg-card light:bg-white border border-border-default rounded-lg shadow-lg z-10">
                                <a href="#" onclick="event.preventDefault(); window.openMetaModal('edit', ${goal.id})" class="edit-button block px-4 py-2 text-sm text-text-primary hover:bg-bg-hover light:hover:bg-slate-100">Editar</a>
                                <a href="#" onclick="event.preventDefault(); window.deleteGoalWrapper(${goal.id})" class="delete-button block px-4 py-2 text-sm text-status-error hover:bg-red-900/20 light:hover:bg-red-50">Excluir</a>
                            </div>
                        </div>
                    </div>

                    <div class="flex-grow space-y-3 mb-6">
                        <p class="text-text-secondary text-sm">
                            Arrecadado: <span class="text-2xl font-light text-text-primary">${window.formatCurrency(arrecadado)}</span>
                            / ${window.formatCurrency(total)}
                        </p>
                        
                        <div class="goal-progress-bar-container bg-border-default">
                            <div class="${progressBarClass} goal-progress-fill" style="width: ${percentDisplay}%;"></div>
                        </div>
                        
                        <div class="flex justify-between text-xs text-text-secondary">
                            <span class="font-semibold text-text-primary">${percentDisplay}% Concluído</span>
                            <span class="text-text-secondary">Faltam: ${goal.prazo_meses} meses</span>
                        </div>
                    </div>

                    <div class="mt-auto pt-5 border-t border-border-default light:border-slate-200">
                        <div class="flex gap-3 relative">
                            <input type="number" placeholder="Valor do depósito" class="deposit-input w-full p-3 border border-border-default rounded-xl focus:ring-2 focus:ring-brand-secondary focus:border-transparent transition placeholder-text-secondary bg-bg-surface light:bg-slate-50">
                            <button class="deposit-button bg-brand-secondary text-white font-bold px-5 rounded-xl hover:bg-brand-primary transition-transform duration-150 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed" disabled>Depositar</button>
                        </div>
                        <p class="deposit-feedback hidden text-xs text-center mt-2"></p>
                    </div>
                </div>
            `;
            container.innerHTML += cardHtml;
        });

        addEventListenersToCards(); // Reanexa os eventos após a injeção do HTML

    } catch (error) {
        console.error('Erro ao carregar metas:', error);
        document.getElementById('goals-container').innerHTML = '<p class="text-status-error text-center col-span-full">Erro ao carregar metas. Verifique o servidor.</p>';
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Exposição necessária para o HTML (onclicks)
    window.formatCurrency = window.formatCurrency || formatCurrency;
    window.deleteGoalWrapper = async (id) => {
        const success = await deleteGoal(id, 'loadGoals');
        if (success) loadGoals();
    };

    // Assumindo que openMetaModal, closeMetaModal, deleteGoal são globais ou importados
    // Se eles estão no utils.js, eles precisam ser importados e expostos.
    // Para simplificar, estamos chamando diretamente o loadGoals.
    
    // Anexar o listener de submissão do formulário de metas (no metas.html)
    const goalForm = document.getElementById('meta-form');
    if (goalForm) {
        goalForm.addEventListener('submit', submitGoal);
    }

    loadGoals();
});