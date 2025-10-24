// js/metas.js - Lógica da página de Metas

async function loadGoals() {
    try {
        const response = await fetch(`${window.API_HOST}metas`);
        if (!response.ok) throw new Error('Falha ao carregar metas.');
        const goals = await response.json();
        renderGoals(goals);
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('goals-container').innerHTML = `<p class="text-status-error text-center col-span-full">${error.message}</p>`;
    }
}

function renderGoals(goals) {
    const container = document.getElementById('goals-container');
    container.innerHTML = '';

    if (goals.length === 0) {
        container.innerHTML = `<p class="text-text-secondary text-center col-span-full">Nenhuma meta cadastrada ainda. Crie uma!</p>`;
        return;
    }

    goals.forEach(goal => {
        const progress = Math.min(100, (goal.valor_arrecadado / goal.valor_total) * 100);
        const isCompleted = progress >= 100;

        const card = document.createElement('div');
        card.id = `goal-${goal.id}`;
        card.className = 'goal-card-modern-pro';
        card.dataset.goalId = goal.id; // Adiciona o ID ao card principal
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-text-primary">${goal.titulo}</h3>
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between text-base mb-1 text-text-secondary">
                    <span class="text-sm">Acumulado / Total</span>
                    <span id="percentage-${goal.id}" class="${isCompleted ? 'neon-gold' : 'neon-text'} font-bold">${Math.round(progress)}%</span>
                </div>

                <div class="flex justify-between text-xl mb-3 font-extrabold text-text-primary">
                    <span id="arrecadado-${goal.id}" class="${isCompleted ? 'text-status-success' : ''}">${window.formatCurrency(goal.valor_arrecadado)}</span>
                    <span id="total-${goal.id}" class="text-text-secondary">${window.formatCurrency(goal.valor_total)}</span>
                </div>

                <div class="h-4 flex rounded-full bg-bg-surface shadow-inner border ${isCompleted ? 'border-status-success' : 'border-border-default'}">
                    <div id="progress-bar-${goal.id}" style="width: ${progress}%" class="${isCompleted ? 'progress-bar-gold' : 'progress-bar-gradient'} transition-all duration-700 ease-in-out"></div>
                </div>
            </div>
            
            <div class="flex gap-3 pt-4">
                <input type="number" id="deposit-input-${goal.id}" placeholder="${isCompleted ? 'Meta Concluída! 🎉' : 'Digite o valor a depositar (R$)'}" class="w-full p-3 border border-border-default rounded-xl bg-bg-surface text-text-primary focus:ring-brand-secondary focus:border-brand-secondary text-sm shadow-inner" step="0.01" ${isCompleted ? 'disabled' : ''}>
                <button data-action="deposit" class="${isCompleted ? 'btn-deposit-disabled' : 'btn-deposit-pro'} text-white font-bold py-3 px-4 rounded-xl flex-shrink-0 transition duration-200 uppercase" ${isCompleted ? 'disabled' : ''}>
                    DEPOSITAR
                </button>
            </div>
            
            <div id="deposit-feedback-${goal.id}" class="text-sm text-status-success mt-2 text-center h-5 opacity-0 transition duration-500"></div>

            <div class="border-t border-dashed border-border-default pt-4 mt-auto">
                <p class="text-text-secondary text-xs mb-3 text-center">
                    <span class="font-semibold ${isCompleted ? 'text-status-success' : 'text-text-dim'}">${isCompleted ? 'Objetivo Atingido!' : `${goal.prazo_meses} meses restantes`}</span>
                </p>
                <div class="card-actions-group">
                    <button data-action="edit" class="btn-edit">
                        EDITAR
                    </button>
                    <button data-action="delete" class="btn-delete">
                        EXCLUIR
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function openMetaModal(mode, id = null) {
    const modal = document.getElementById('meta-modal');
    const form = document.getElementById('meta-form');
    const title = document.getElementById('meta-modal-title');
    form.reset();
    document.getElementById('meta-id').value = '';

    if (mode === 'edit') {
        title.textContent = 'Editar Meta';
        try {
            const response = await fetch(`${window.API_HOST}metas/${id}`);
            const goal = await response.json();
            document.getElementById('meta-id').value = goal.id;
            document.getElementById('meta-titulo').value = goal.titulo;
            document.getElementById('meta-valor-total').value = goal.valor_total;
            document.getElementById('meta-valor-arrecadado').value = goal.valor_arrecadado;
            document.getElementById('meta-prazo').value = goal.prazo_meses;
        } catch (error) {
            console.error('Erro ao carregar dados da meta:', error);
            alert('Não foi possível carregar os dados da meta para edição.');
            return;
        }
    } else {
        title.textContent = 'Criar Nova Meta';
    }
    modal.style.display = 'flex';
}

function closeMetaModal() {
    document.getElementById('meta-modal').style.display = 'none';
}

async function handleDeposit(id) {
    const input = document.getElementById(`deposit-input-${id}`);
    const feedback = document.getElementById(`deposit-feedback-${id}`);
    const value = parseFloat(input.value);

    if (isNaN(value) || value <= 0) {
        feedback.textContent = "Valor inválido.";
        feedback.className = 'text-sm text-status-error mt-2 text-center h-5 opacity-100 transition duration-500';
        setTimeout(() => feedback.className = 'text-sm text-status-success mt-2 text-center h-5 opacity-0 transition duration-500', 2000);
        return;
    }

    try {
        const response = await fetch(`${window.API_HOST}metas/${id}/deposito`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: value })
        });
        if (!response.ok) throw new Error('Falha ao realizar depósito.');
        
        feedback.textContent = `Depósito de ${window.formatCurrency(value)} adicionado!`;
        feedback.className = 'text-sm text-status-success mt-2 text-center h-5 opacity-100 transition duration-500';
        setTimeout(() => feedback.className = 'text-sm text-status-success mt-2 text-center h-5 opacity-0 transition duration-500', 2500);
        input.value = '';

        loadGoals(); // Recarrega todas as metas para refletir a mudança
    } catch (error) {
        console.error('Erro no depósito:', error);
        feedback.textContent = 'Erro ao depositar.';
        feedback.className = 'text-sm text-status-error mt-2 text-center h-5 opacity-100 transition duration-500';
        setTimeout(() => feedback.className = 'text-sm text-status-success mt-2 text-center h-5 opacity-0 transition duration-500', 2000);
    }
}

async function deleteMeta(id) {
    if (!confirm('Tem certeza que deseja EXCLUIR permanentemente esta Meta?')) return;

    try {
        const response = await fetch(`${window.API_HOST}metas/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha ao excluir.');

        const goalElement = document.getElementById(`goal-${id}`);
        if (goalElement) {
            goalElement.style.transition = 'opacity 0.3s, transform 0.3s';
            goalElement.style.opacity = '0';
            goalElement.style.transform = 'scale(0.9)';
            setTimeout(() => goalElement.remove(), 300);
        }
    } catch (error) {
        console.error('Erro ao excluir meta:', error);
        alert('Erro ao excluir a meta.');
    }
}

document.getElementById('meta-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const id = form.querySelector('#meta-id').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${window.API_HOST}metas/${id}` : `${window.API_HOST}metas`;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.valor_total = parseFloat(data.valor_total);
    data.valor_arrecadado = parseFloat(data.valor_arrecadado);
    data.prazo_meses = parseInt(data.prazo_meses);

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Falha ao salvar meta.`);
        alert(`Meta ${id ? 'atualizada' : 'salva'} com sucesso!`);
        closeMetaModal();
        loadGoals();
    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        alert('Erro ao salvar meta. Verifique o console.');
    }
});

// Torna as funções do modal acessíveis globalmente para os botões no HTML
window.openMetaModal = openMetaModal;
window.closeMetaModal = closeMetaModal;

function handleCardClick(event) {
    const target = event.target;
    const action = target.dataset.action;
    if (!action) return;

    const goalContainer = target.closest('.goal-card-modern-pro');
    if (!goalContainer) return;

    // Garante que o ID seja um número inteiro para a chamada da API.
    const id = parseInt(goalContainer.dataset.goalId, 10);

    if (action === 'deposit') {
        handleDeposit(id);
    } else if (action === 'edit') {
        openMetaModal('edit', id);
    } else if (action === 'delete') {
        deleteMeta(id);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
    document.getElementById('goals-container').addEventListener('click', handleCardClick);
});
