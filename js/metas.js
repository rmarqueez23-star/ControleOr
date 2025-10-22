const goals = [
  { id: 1, title: "Reforma da Casa", total: 50000, collected: 15000, months: 24 },
  { id: 2, title: "Viagem Europa", total: 10000, collected: 10000, months: 0 },
  { id: 3, title: "Setup Home Office", total: 8000, collected: 3200, months: 10 },
  { id: 4, title: "Reserva de Emergência", total: 15000, collected: 4200, months: 36 }
];

const grid = document.getElementById("goalsGrid");

function renderGoals() {
  grid.innerHTML = "";
  goals.forEach(goal => {
    const pct = percent(goal);
    const card = document.createElement("div");
    card.className = `
      bg-white border border-slate-200 shadow-lg rounded-2xl p-6 
      hover:shadow-2xl hover:-translate-y-1 transition-all duration-300
      flex flex-col gap-4
    `;
    card.dataset.id = goal.id;

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <h3 class="font-semibold text-xl text-slate-800">${goal.title}</h3>
        <button data-action="delete" class="text-slate-500 hover:text-red-500 text-sm font-medium transition">Excluir</button>
      </div>

      <div class="flex justify-between text-sm font-semibold">
        <span id="collected-${goal.id}">R$ ${fmt(goal.collected)}</span>
        <span class="text-slate-400">/ R$ ${fmt(goal.total)}</span>
      </div>

      <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden mt-2">
        <div id="bar-${goal.id}" class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-700 ease-in-out" style="width: ${pct}%;"></div>
      </div>

      <div class="text-right text-emerald-500 text-sm font-semibold" id="pct-${goal.id}">${pct}%</div>

      <div class="flex gap-2 mt-2">
        <input id="input-${goal.id}" type="number" placeholder="Digite o valor a depositar"
          class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition" />
        <button data-action="deposit" 
          class="bg-gradient-to-r from-emerald-400 to-sky-400 hover:brightness-110 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all">
          Depositar
        </button>
      </div>

      <p id="feedback-${goal.id}" class="text-center text-sm text-emerald-500 opacity-0 transition-all duration-500 mt-1"></p>

      <p class="text-center text-xs text-slate-500 mt-auto" id="footer-${goal.id}">
        ${goal.months > 0 ? `${goal.months} meses restantes` : pct >= 100 ? "Objetivo Atingido!" : "Sem prazo definido"}
      </p>
    `;

    grid.appendChild(card);
    updateVisual(goal, card);
  });
}

function fmt(v) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function percent(g) {
  return Math.min(100, Math.round((g.collected / g.total) * 100));
}

function updateVisual(goal, card) {
  const pct = percent(goal);
  const bar = card.querySelector(`#bar-${goal.id}`);
  const pctEl = card.querySelector(`#pct-${goal.id}`);
  const collectedEl = card.querySelector(`#collected-${goal.id}`);
  const footer = card.querySelector(`#footer-${goal.id}`);

  collectedEl.textContent = "R$ " + fmt(goal.collected);
  pctEl.textContent = pct + "%";
  bar.style.width = pct + "%";

  if (pct >= 100) {
    bar.classList.remove("from-emerald-400", "to-sky-400");
    bar.classList.add("from-yellow-400", "to-yellow-300", "animate-pulse");
    card.classList.add("border-yellow-400", "shadow-yellow-200");
    footer.textContent = "🎉 Objetivo Atingido!";
    card.querySelector("input").disabled = true;
    card.querySelector("input").placeholder = "Meta concluída!";
    card.querySelector("button[data-action='deposit']").disabled = true;
  }
}

document.addEventListener("click", e => {
  const action = e.target.dataset.action;
  if (!action) return;
  const card = e.target.closest("[data-id]");
  const id = Number(card.dataset.id);
  if (action === "deposit") deposit(id, card);
  if (action === "delete") removeGoal(id, card);
});

function deposit(id, card) {
  const goal = goals.find(g => g.id === id);
  const input = card.querySelector(`#input-${id}`);
  const fb = card.querySelector(`#feedback-${id}`);
  const val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) {
    showFeedback(fb, "Valor inválido.", true);
    return;
  }
  goal.collected = Math.round((goal.collected + val) * 100) / 100;
  updateVisual(goal, card);
  showFeedback(fb, `Depósito de R$ ${fmt(val)} adicionado com sucesso!`);
  input.value = "";
}

function removeGoal(id, card) {
  if (!confirm("Deseja realmente excluir esta meta?")) return;
  card.classList.add("opacity-0", "scale-95", "transition-all", "duration-300");
  setTimeout(() => card.remove(), 300);
  const index = goals.findIndex(g => g.id === id);
  if (index > -1) goals.splice(index, 1);
}

function showFeedback(el, msg, isError = false) {
  el.textContent = msg;
  el.classList.remove("text-emerald-500", "text-red-500");
  el.classList.add(isError ? "text-red-500" : "text-emerald-500");
  el.classList.add("opacity-100");
  setTimeout(() => el.classList.remove("opacity-100"), 2000);
}

document.getElementById("btnNew").addEventListener("click", () => {
  const title = prompt("Título da nova meta:");
  if (!title) return;
  const total = parseFloat(prompt("Valor total necessário:"));
  if (isNaN(total) || total <= 0) return alert("Valor inválido.");
  const months = parseInt(prompt("Prazo em meses (opcional):")) || 0;
  const newGoal = { id: Date.now(), title, total, collected: 0, months };
  goals.push(newGoal);
  renderGoals();
});

renderGoals();
