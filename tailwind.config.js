// tailwind.config.js - Tema Escuro Minimalista e Neon

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Configura quais arquivos o Tailwind deve escanear para encontrar classes
  content: [
    "./*.html", 
  ],
  
  // 2. Habilita o modo escuro via classe (necessário para o tema escuro)
  // Nota: Embora não usemos o toggle 'dark', a paleta base (bg-main, bg-card) é tratada como padrão (light).
  darkMode: 'class', 
  
  theme: {
    extend: {
      // 3. Mapeamento das Cores Customizadas
      colors: {
        // Cores de Marca
        'brand-primary': '#FF8C00',     // Laranja Vibrante
        'brand-secondary': '#008080',   // Teal/Verde-Água
        
        // Paleta de Fundo (Dark Mode - Definida como cores base do tema)
        'bg-main': '#121212',           // Fundo principal (quase preto)
        'bg-card': '#1E1E1E',           // Fundo de cards/blocos
        'bg-surface': '#252525',        // Superfície de inputs, modais
        'bg-hover': '#333333',          // Efeito hover
        
        // Cores de Texto e Bordas
        'text-light': '#E0E0E0',        // Texto principal
        'text-dim': '#A0A0A0',          // Texto secundário/label
        'border-default': '#3A3A3A',    // Bordas e divisores
        'neutral-mid': '#CCCCCC',       // Usado para cores neutras no JS

        // Cores de Status
        'status-success': '#28A745',    // Verde (Receita/Sucesso)
        'status-error': '#DC3545',      // Vermelho (Despesa/Erro)

        // Cores NEON (para os efeitos visuais)
        'neon-teal': '#00FFFF',         // Ciano brilhante (Destaque principal)
        'neon-orange': '#FF7000',       // Laranja neon (Alerta/Texto secundário em Metas)
      },
      
      // 4. Sombra de Brilho Customizada (Efeito Neon)
      boxShadow: {
        'smooth': '0 4px 6px rgba(0, 0, 0, 0.5)',
        'neon-glow-teal': '0 0 10px #00FFFF', // Brilho para hover em cards e gráficos
        'neon-glow-orange': '0 0 8px #FF7000', // Brilho para CTA principal (Nova Transação)
        'neon-glow-button': '0 0 8px #00FFFF', // Brilho para botões de destaque (ajuste no último passo)
      },

      // Configuração de Tipografia
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}