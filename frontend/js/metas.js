// metas.js - SISTEMA PREMIUM DE METAS FINANCEIRAS ATUALIZADO

class MetasManager {
    constructor() {
        this.API_HOST = window.API_HOST || 'http://localhost:3000/api/';
        this.container = document.getElementById('goals-container');
        this.modal = document.getElementById('meta-modal');
        this.deleteModal = document.getElementById('delete-confirm-modal');
        this.form = document.getElementById('meta-form');
        this.loadingState = document.getElementById('loading-state');
        this.emptyState = document.getElementById('empty-state');
        this.goals = [];
        this.currentFilter = 'all';
        this.currentSort = 'recent';
        this.goalToDeleteId = null;
        this.init();
    }

    async init() {
        this.setupModalHandlers();
        this.setupEventListeners();
        await this.loadGoals();
        this.hideLoadingState();
    }

    // ======================================================
    // CARREGAMENTO E RENDERIZAÇÃO DE METAS
    // ======================================================

    async loadGoals() {
        this.showLoadingState();
        
        try {
            const response = await fetch(this.API_HOST + 'metas');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.goals = await response.json();
            
            this.applyFiltersAndSort();
            this.updateStats();
            
        } catch (error) {
            console.error('Erro ao carregar metas:', error);
            this.renderError('Erro ao carregar metas. Verifique a conexão com o servidor.');
        }
    }

    renderGoals() {
        if (!this.container) return;

        if (!this.goals || this.goals.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        
        const filteredGoals = this.getFilteredGoals();
        const sortedGoals = this.sortGoals(filteredGoals);
        
        this.container.innerHTML = sortedGoals.map((goal, index) => 
            this.createGoalCard(goal, index)
        ).join('');
        
        this.initializeGoalInteractions();
    }

    createGoalCard(goal, index) {
        const progress = (goal.valor_arrecadado / goal.valor_total) * 100;
        const isComplete = progress >= 100;
        const progressPercent = Math.min(100, Math.round(progress));
        const remaining = goal.valor_total - goal.valor_arrecadado;
        const progressDecimal = progress / 100;
        
        return `
            <div id="goal-${goal.id}" 
                 class="goal-card-modern-pro goal-card-entrance ${isComplete ? 'goal-completed-glow' : ''}" 
                 style="animation-delay: ${index * 0.1}s"
                 data-id="${goal.id}" 
                 data-valor-total="${goal.valor_total}" 
                 data-valor-arrecadado="${goal.valor_arrecadado}" 
                 data-prazo-meses="${goal.prazo_meses}"
                 data-progress="${progressDecimal}">
                
                <!-- Header com Título e Status -->
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-bold text-gray-900 mb-1">${this.escapeHtml(goal.titulo)}</h3>
                        <p class="text-gray-600 text-sm mt-1">Criada em ${this.formatDate(goal.data_criacao)}</p>
                    </div>
                    <span class="status-badge-premium ${isComplete ? 'status-badge-completed' : 'status-badge-active'}">
                        ${isComplete ? '🏆 Concluída' : '🎯 Em Andamento'}
                    </span>
                </div>
                
                <!-- Seção de Progresso -->
                <div class="mb-4">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso da Meta</span>
                        <span id="progress-percentage-${goal.id}" class="font-bold ${isComplete ? 'text-green-600' : 'text-teal-600'}">
                            ${progressPercent}%
                        </span>
                    </div>

                    <div class="flex justify-between text-sm mt-2 mb-3">
                        <span id="arrecadado-value-${goal.id}" class="font-bold text-gray-900">${window.formatCurrency(goal.valor_arrecadado)}</span>
                        <span class="text-gray-600">${window.formatCurrency(goal.valor_total)}</span>
                    </div>

                    <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div id="progress-bar-${goal.id}" 
                             class="h-full ${isComplete ? 'progress-bar-gold' : 'progress-bar-gradient'}"
                             style="width: ${progress}%">
                        </div>
                    </div>
                </div>
                
                <!-- Seção de Depósito (APENAS UMA) -->
                <div id="deposit-section-wrapper-${goal.id}" class="mb-4">
                    ${isComplete ? this.createCompletedDepositSection() : this.createActiveDepositSection(goal, remaining)}
                </div>
                
                <!-- Ações do Card -->
                <div class="card-actions-group">
                    <button type="button" onclick="metasManager.openModal('edit', ${goal.id})" class="btn-edit focus-ring" aria-label="Editar meta ${this.escapeHtml(goal.titulo)}">
                        <span>✏️</span>
                        Editar
                    </button>
                    <button type="button" onclick="metasManager.openDeleteModal(${goal.id})" class="btn-delete focus-ring" aria-label="Excluir meta ${this.escapeHtml(goal.titulo)}">
                        <span>🗑️</span>
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }

    createActiveDepositSection(goal, remaining) {
        const canDeposit = remaining > 0;
        
        return `
            <div class="p-4 bg-gray-100 rounded-xl border border-gray-300">
                <div class="text-center mb-3">
                    <p class="text-teal-600 font-semibold text-sm">Faltam ${window.formatCurrency(remaining)} para concluir</p>
                </div>
                ${goal.prazo_meses > 0 ? 
                    `<div class="text-center mb-3">
                        <p class="text-gray-600 text-sm">${goal.prazo_meses} meses restantes</p>
                    </div>` : 
                    ''
                }
                
                <!-- APENAS UM BOTÃO DEPOSITAR -->
                <div class="flex gap-2">
                    <input type="number" 
                           id="deposit-input-${goal.id}" 
                           placeholder="${canDeposit ? 'Valor do depósito' : 'Meta concluída!'}" 
                           class="deposit-input-premium flex-1 ${!canDeposit ? 'bg-yellow-50 border-yellow-200' : ''}"
                           step="0.01"
                           min="0.01"
                           max="${remaining}"
                           ${!canDeposit ? 'disabled' : ''}>
                    <button type="button" 
                            onclick="metasManager.handleDeposit(${goal.id})" 
                            class="btn-deposit-pro ${!canDeposit ? 'btn-deposit-disabled' : ''}"
                            ${!canDeposit ? 'disabled' : ''}>
                        <span>💰</span>
                        ${canDeposit ? 'Depositar' : 'Concluído!'}
                    </button>
                </div>
                <div id="deposit-feedback-${goal.id}" class="deposit-feedback-premium mt-2"></div>
            </div>
        `;
    }

    createCompletedDepositSection() {
        return `
            <div class="p-4 bg-green-50 rounded-xl border border-green-200">
                <div class="text-center mb-3">
                    <p class="text-green-600 font-semibold text-sm">🎉 Meta Concluída com Sucesso!</p>
                </div>
                <div class="text-center">
                    <p class="text-gray-600 text-sm">Objetivo alcançado com sucesso</p>
                </div>
            </div>
        `;
    }

    // ======================================================
    // GERENCIAMENTO DE DEPÓSITOS
    // ======================================================

    async handleDeposit(goalId) {
        const input = document.getElementById(`deposit-input-${goalId}`);
        const feedback = document.getElementById(`deposit-feedback-${goalId}`);
        const value = parseFloat(input.value);

        // Validação visual
        input.classList.remove('border-red-300', 'bg-red-50');
        
        if (!this.validateDeposit(value, goalId, feedback)) {
            input.classList.add('border-red-300', 'bg-red-50');
            this.shakeElement(input);
            return;
        }

        await this.processDeposit(goalId, value, feedback);
        input.value = '';
    }

    validateDeposit(value, goalId, feedback) {
        if (isNaN(value) || value <= 0) {
            this.showFeedback(feedback, "❌ Por favor, digite um valor válido maior que zero", true);
            return false;
        }

        const goalElement = document.getElementById(`goal-${goalId}`);
        if (!goalElement) {
            this.showFeedback(feedback, "❌ Meta não encontrada no sistema", true);
            return false;
        }

        const valorArrecadado = parseFloat(goalElement.getAttribute('data-valor-arrecadado'));
        const valorTotal = parseFloat(goalElement.getAttribute('data-valor-total'));
        const remaining = valorTotal - valorArrecadado;
        
        if (value > remaining) {
            this.showFeedback(feedback, `❌ Valor excede o necessário. Faltam ${window.formatCurrency(remaining)}`, true);
            return false;
        }

        if (value < 1) {
            this.showFeedback(feedback, "❌ O depósito mínimo é de R$ 1,00", true);
            return false;
        }

        return true;
    }

    async processDeposit(goalId, value, feedback) {
        const goalIndex = this.goals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) {
            this.showFeedback(feedback, "❌ Erro: Meta não encontrada", true);
            return;
        }

        try {
            const goal = this.goals[goalIndex];
            const novoValorArrecadado = parseFloat((goal.valor_arrecadado + value).toFixed(2));

            // Chamar a API para registrar o depósito
            const response = await fetch(`${this.API_HOST}metas/${goalId}/deposito`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ valor: value })
            });

            if (!response.ok) {
                throw new Error('Falha ao registrar depósito no servidor.');
            }

            // Atualizar estado local após sucesso da API
            this.goals[goalIndex].valor_arrecadado = novoValorArrecadado;

            // Atualizar interface com animação
            await this.animateDepositSuccess(goalId, value);
            this.updateGoalUI(goalId, this.goals[goalIndex]);
            
            this.showFeedback(feedback, `✅ Depósito de ${window.formatCurrency(value)} realizado com sucesso!`);
            this.updateStats();

        } catch (error) {
            console.error('Erro ao processar depósito:', error);
            this.showFeedback(feedback, "❌ Erro ao processar o depósito. Tente novamente.", true);
        }
    }

    async animateDepositSuccess(goalId, value) {
        const card = document.getElementById(`goal-${goalId}`);
        const progressBar = document.getElementById(`progress-bar-${goalId}`);
        
        if (!card || !progressBar) return;

        // Efeito de confete visual
        this.createConfettiEffect(card);
        
        // Animação do card
        card.style.transform = 'translateY(-8px) scale(1.02)';
        card.style.boxShadow = '0 25px 50px -12px rgba(0, 224, 255, 0.4)';
        
        // Animação da barra de progresso
        progressBar.style.transform = 'scale(1.05)';
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Restaurar estado normal
        card.style.transform = '';
        card.style.boxShadow = '';
        progressBar.style.transform = '';
    }

    createConfettiEffect(element) {
        const confettiCount = 8;
        const colors = ['#00E0FF', '#008080', '#FF8C00', '#10B981'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'absolute w-2 h-2 rounded-full animate-bounce';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '0';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            
            element.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 1000);
        }
    }

    shakeElement(element) {
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => element.style.animation = '', 500);
    }

    updateGoalUI(goalId, goal) {
        const goalElement = document.getElementById(`goal-${goalId}`);
        if (!goalElement) return;

        // Atualizar atributos
        goalElement.setAttribute('data-valor-arrecadado', goal.valor_arrecadado);
        
        const progress = (goal.valor_arrecadado / goal.valor_total) * 100;
        const progressPercent = Math.min(100, Math.round(progress));
        const isComplete = progress >= 100;
        const progressDecimal = progress / 100;

        // Atualizar elementos de texto
        const arrecadadoElement = document.getElementById(`arrecadado-value-${goalId}`);
        const percentageElement = document.getElementById(`progress-percentage-${goalId}`);
        
        if (arrecadadoElement) {
            arrecadadoElement.textContent = window.formatCurrency(goal.valor_arrecadado);
        }
        
        if (percentageElement) {
            percentageElement.textContent = `${progressPercent}%`;
            percentageElement.className = `font-bold ${isComplete ? 'text-green-600' : 'text-teal-600'}`;
        }

        // Atualizar barra de progresso com animação
        const progressBar = document.getElementById(`progress-bar-${goalId}`);
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            
            // Atualizar classes da barra
            if (isComplete) {
                progressBar.className = 'h-full progress-bar-gold';
                goalElement.classList.add('goal-completed-glow');
            } else {
                progressBar.className = 'h-full progress-bar-gradient';
                goalElement.classList.remove('goal-completed-glow');
            }
        }

        // Atualizar status badge
        const statusBadge = goalElement.querySelector('.status-badge-premium');
        if (statusBadge) {
            if (isComplete) {
                statusBadge.className = 'status-badge-premium status-badge-completed';
                statusBadge.textContent = '🏆 Concluída';
            } else {
                statusBadge.className = 'status-badge-premium status-badge-active';
                statusBadge.textContent = '🎯 Em Andamento';
            }
        }

        // Atualizar seção de depósito se necessário
        if (isComplete) {
            this.updateToCompletedState(goalId);
        } else {
            this.updateActiveState(goalId, goal);
        }
    }

    updateToCompletedState(goalId) {
        const depositSection = document.getElementById(`deposit-section-wrapper-${goalId}`);
        if (depositSection) {
            depositSection.innerHTML = this.createCompletedDepositSection();
        }
    }

    updateActiveState(goalId, goal) {
        const remaining = goal.valor_total - goal.valor_arrecadado;
        const depositSection = document.getElementById(`deposit-section-wrapper-${goalId}`);

        if (depositSection) {
            depositSection.innerHTML = this.createActiveDepositSection(goal, remaining);
        }
    }

    // ======================================================
    // FILTROS E ORDENAÇÃO
    // ======================================================

    getFilteredGoals() {
        let filteredGoals = [...this.goals];

        switch (this.currentFilter) {
            case 'active':
                filteredGoals = filteredGoals.filter(goal => 
                    (goal.valor_arrecadado / goal.valor_total) < 1
                );
                break;
            case 'completed':
                filteredGoals = filteredGoals.filter(goal => 
                    (goal.valor_arrecadado / goal.valor_total) >= 1
                );
                break;
        }

        return filteredGoals;
    }

    sortGoals(goals) {
        const sortedGoals = [...goals];

        switch (this.currentSort) {
            case 'recent':
                sortedGoals.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
                break;
            case 'oldest':
                sortedGoals.sort((a, b) => new Date(a.data_criacao) - new Date(b.data_criacao));
                break;
            case 'name':
                sortedGoals.sort((a, b) => a.titulo.localeCompare(b.titulo));
                break;
            case 'progress':
                sortedGoals.sort((a, b) => {
                    const progressA = a.valor_arrecadado / a.valor_total;
                    const progressB = b.valor_arrecadado / b.valor_total;
                    return progressB - progressA;
                });
                break;
        }

        return sortedGoals;
    }

    applyFiltersAndSort() {
        this.renderGoals();
        this.updateStats();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.applyFiltersAndSort();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.applyFiltersAndSort();
    }

    // ======================================================
    // GERENCIAMENTO DO MODAL (CRUD)
    // ======================================================

    openModal(mode, id = null) {
        this.resetModal();
        
        if (mode === 'edit' && id) {
            this.loadGoalForEdit(id);
            document.getElementById('meta-modal-title').textContent = '✏️ Editar Meta';
        } else {
            document.getElementById('meta-modal-title').textContent = '✨ Criar Nova Meta';
        }
        
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.resetModal();
    }

    resetModal() {
        this.form.reset();
        document.getElementById('meta-id').value = '';
        this.updateModalPreview();
    }

    loadGoalForEdit(id) {
        const goal = this.goals.find(g => g.id === id);
        if (goal) {
            this.populateModal(goal);
        }
    }

    populateModal(goal) {
        document.getElementById('meta-id').value = goal.id;
        document.getElementById('meta-titulo').value = goal.titulo;
        document.getElementById('meta-valor-total').value = goal.valor_total;
        document.getElementById('meta-valor-arrecadado').value = goal.valor_arrecadado;
        document.getElementById('meta-prazo').value = goal.prazo_meses;
        
        this.updateModalPreview();
    }

    updateModalPreview() {
        const total = parseFloat(document.getElementById('meta-valor-total').value) || 0;
        const arrecadado = parseFloat(document.getElementById('meta-valor-arrecadado').value) || 0;
        const progress = total > 0 ? Math.min(100, (arrecadado / total) * 100) : 0;
        
        document.getElementById('preview-percentage').textContent = progress.toFixed(0) + '%';
        document.getElementById('preview-progress-bar').style.width = progress + '%';
        document.getElementById('preview-arrecadado').textContent = window.formatCurrency(arrecadado);
        document.getElementById('preview-total').textContent = window.formatCurrency(total);
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar loading
        submitBtn.innerHTML = '<span class="animate-spin">⏳</span> Salvando...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(this.form);
            const data = {
                titulo: formData.get('titulo').trim(),
                valor_total: parseFloat(formData.get('valor_total')),
                valor_arrecadado: parseFloat(formData.get('valor_arrecadado')),
                prazo_meses: parseInt(formData.get('prazo_meses')) || 0
            };

            const errors = this.validateFormData(data);
            if (errors.length > 0) {
                this.showModalError('❌ Corrija os seguintes erros:\n' + errors.join('\n'));
                return;
            }

            await this.saveGoal(data, formData.get('id'));
            
        } finally {
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateFormData(data) {
        const errors = [];

        if (!data.titulo || data.titulo.length < 2) {
            errors.push('• Título deve ter pelo menos 2 caracteres');
        }

        if (data.titulo.length > 100) {
            errors.push('• Título não pode ter mais de 100 caracteres');
        }

        if (!data.valor_total || data.valor_total <= 0) {
            errors.push('• Valor total deve ser maior que zero');
        }

        if (data.valor_arrecadado < 0) {
            errors.push('• Valor arrecadado não pode ser negativo');
        }

        if (data.valor_arrecadado > data.valor_total) {
            errors.push('• Valor arrecadado não pode ser maior que o valor total');
        }

        if (data.prazo_meses < 0) {
            errors.push('• Prazo não pode ser negativo');
        }

        if (data.prazo_meses > 600) { // 50 anos
            errors.push('• Prazo muito longo (máximo 600 meses)');
        }

        return errors;
    }

    async saveGoal(data, id = null) {
        try {
            let response;
            let savedGoal;

            if (id) {
                // Editar meta existente
                response = await fetch(`${this.API_HOST}metas/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('Falha ao atualizar a meta.');
                
                // Atualiza o objeto no array local
                const goalIndex = this.goals.findIndex(g => g.id === parseInt(id, 10));
                if (goalIndex > -1) {
                    this.goals[goalIndex] = { ...this.goals[goalIndex], ...data };
                }
            } else {
                // Criar nova meta
                response = await fetch(`${this.API_HOST}metas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('Falha ao criar a meta.');
                
                // Adiciona o novo objeto retornado pela API ao array local
                savedGoal = await response.json();
                this.goals.push(savedGoal);
            }

            this.closeModal();
            this.applyFiltersAndSort();
            
            this.showTemporaryMessage(
                `✅ Meta "${data.titulo}" ${id ? 'atualizada' : 'criada'} com sucesso!`, 
                'success'
            );
            
        } catch (error) {
            console.error('Erro ao salvar meta:', error);
            this.showTemporaryMessage('❌ Erro ao salvar meta. Tente novamente.', 'error');
        }
    }

    openDeleteModal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        this.goalToDeleteId = id;
        const messageElement = this.deleteModal.querySelector('#delete-modal-message');
        if (messageElement) {
            messageElement.innerHTML = `Você tem certeza que deseja excluir a meta "<strong>${this.escapeHtml(goal.titulo)}</strong>"?<br><br>Esta ação não pode ser desfeita.`;
        }

        this.deleteModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeDeleteModal() {
        this.deleteModal.style.display = 'none';
        document.body.style.overflow = '';
        this.goalToDeleteId = null;
    }

    async confirmDelete() {
        const id = this.goalToDeleteId;
        if (!id) return;

        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        const confirmBtn = document.getElementById('confirm-delete-btn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="animate-spin">⏳</span> Excluindo...';
        
        try {
            const response = await fetch(`${this.API_HOST}metas/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Falha ao excluir no servidor.');

            // Animação de exclusão
            const goalElement = document.getElementById(`goal-${id}`);
            if (goalElement) {
                goalElement.style.opacity = '0';
                goalElement.style.transform = 'scale(0.8) translateY(20px)';
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Remover da lista
            this.goals = this.goals.filter(goal => goal.id !== id);
            this.applyFiltersAndSort();
            this.closeDeleteModal();
            this.showTemporaryMessage(`✅ Meta "${goal.titulo}" excluída com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao excluir meta:', error);
            this.showTemporaryMessage('❌ Erro ao excluir meta.', 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Sim, Excluir';
        }
    }



    // ======================================================
    // ESTATÍSTICAS E DASHBOARD
    // ======================================================

    updateStats() {
        const totalGoals = this.goals.length;
        const completedGoals = this.goals.filter(goal => 
            (goal.valor_arrecadado / goal.valor_total) >= 1
        ).length;
        const activeGoals = totalGoals - completedGoals;
        const totalValue = this.goals.reduce((sum, goal) => sum + goal.valor_total, 0);
        const totalCollected = this.goals.reduce((sum, goal) => sum + goal.valor_arrecadado, 0);
        const overallProgress = totalValue > 0 ? (totalCollected / totalValue) * 100 : 0;

        // Atualizar elementos do dashboard
        const elements = {
            'total-goals-count': totalGoals,
            'completed-goals-count': completedGoals,
            'active-goals-count': activeGoals,
            'total-value': window.formatCurrency(totalValue),
            'overall-progress': `${Math.round(overallProgress)}%`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // ======================================================
    // UTILITÁRIOS
    // ======================================================

    showLoadingState() {
        if (this.loadingState) this.loadingState.style.display = 'block';
        if (this.container) this.container.style.display = 'none';
        if (this.emptyState) this.emptyState.classList.add('hidden');
    }

    hideLoadingState() {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.container) this.container.style.display = 'grid';
    }

    showEmptyState() {
        this.hideLoadingState();
        if (this.emptyState) this.emptyState.classList.remove('hidden');
        if (this.container) this.container.style.display = 'none';
    }

    hideEmptyState() {
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.container) this.container.style.display = 'grid';
    }

    showFeedback(element, message, isError = false) {
        if (!element) return;
        
        element.textContent = message;
        element.className = `deposit-feedback-premium ${isError ? 'feedback-error' : 'feedback-success'}`;
        
        setTimeout(() => {
            element.textContent = '';
        }, 4000);
    }

    showModalError(message) {
        alert(message);
    }

    showTemporaryMessage(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    renderError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <div class="text-6xl mb-6">😕</div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado</h3>
                    <p class="text-gray-600 mb-8 text-lg">${message}</p>
                    <button onclick="metasManager.loadGoals()" 
                            class="btn-futuristic-pro">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    formatDate(dateString) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    initializeGoalInteractions() {
        // Event listeners para inputs de depósito
        document.querySelectorAll('.deposit-input-premium').forEach(input => {
            if (input.id.startsWith('deposit-input-')) {
                // Enter para depositar
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const goalId = parseInt(input.id.replace('deposit-input-', ''));
                        this.handleDeposit(goalId);
                    }
                });

                // Placeholder dinâmico
                input.addEventListener('focus', function() {
                    const max = this.getAttribute('max');
                    if (max && parseFloat(max) > 0) {
                        this.setAttribute('placeholder', `Máx: ${window.formatCurrency(parseFloat(max))}`);
                    }
                });

                input.addEventListener('blur', function() {
                    this.setAttribute('placeholder', 'Valor do depósito');
                });
            }
        });
    }

    setupEventListeners() {
        // Botão nova meta
        const newGoalButton = document.getElementById('btn-new-goal');
        if (newGoalButton) {
            newGoalButton.onclick = () => this.openModal('new');
        }

        // Botão estado vazio
        const emptyStateButton = document.getElementById('btn-empty-state');
        if (emptyStateButton) {
            emptyStateButton.onclick = () => this.openModal('new');
        }

        // Filtros
        const filterStatus = document.getElementById('filter-status');
        const sortBy = document.getElementById('sort-by');
        
        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                this.setFilter(e.target.value);
            });
        }
        
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.setSort(e.target.value);
            });
        }

        // Preview do modal em tempo real
        const modalInputs = ['meta-titulo', 'meta-valor-total', 'meta-valor-arrecadado', 'meta-prazo'];
        modalInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateModalPreview());
            }
        });
    }

    setupModalHandlers() {
        if (!this.form || !this.modal) return;

        // Submit do formulário
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Fechar modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Fechar modal de exclusão
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.closeDeleteModal();
            }
        });

        // Botão de confirmar exclusão
        document.getElementById('confirm-delete-btn')?.addEventListener('click', () => this.confirmDelete());

        // ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.style.display === 'flex') {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.deleteModal.style.display === 'flex') {
                this.closeDeleteModal();
            }
        });
    }
}

// ======================================================
// INICIALIZAÇÃO E COMPATIBILIDADE
// ======================================================

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.metasManager = new MetasManager();
});

// Funções globais para compatibilidade
window.openMetaModal = (mode, id) => {
    if (window.metasManager) {
        window.metasManager.openModal(mode, id);
    }
};

window.handleDeposit = (goalId) => {
    if (window.metasManager) {
        window.metasManager.handleDeposit(goalId);
    }
};

window.openDeleteModal = (goalId) => {
    if (window.metasManager) {
        window.metasManager.openDeleteModal(goalId);
    }
};

window.closeDeleteModal = () => {
    if (window.metasManager) {
        window.metasManager.closeDeleteModal();
    }
};

// Adicionar animação de shake ao CSS global
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
