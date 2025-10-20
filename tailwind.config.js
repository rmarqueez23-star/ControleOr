// tailwind.config.js - TEMA INVERTIDO: CLARO é o Padrão, DARK é a customização

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", 
  ],
  
  // Usamos 'class' para controle manual
  darkMode: 'class', 
  
  theme: {
    extend: {
      // 3. Mapeamento das Cores Customizadas
      colors: {
        // --- CORES DO TEMA CLARO (Padrão, Sem Prefixo) ---
        'bg-main': '#F5F5F5',           // Fundo principal CLARO
        'bg-card': '#FFFFFF',           // Fundo de cards (Branco)
        'bg-surface': '#E0E0E0',        // Superfície de Inputs
        'bg-hover': '#EEEEEE',          // Efeito hover
        
        'text-primary': '#333333',       // Texto principal ESCURO
        'text-secondary': '#666666',     // Texto secundário ESCURO
        'border-default': '#CCCCCC',     // Bordas CLARAS

        // --- CORES DE ACENTO E STATUS (Mantidas, serão as mesmas em ambos os temas) ---
        'brand-primary': '#FF8C00',     // Laranja
        'brand-secondary': '#008080',   // Teal
        'status-success': '#28A745',     // Verde
        'status-error': '#DC3545',       // Vermelho
        
        // Cores NEON (Serão usadas APENAS no modo Dark)
        'neon-teal': '#00E0FF',         
        'neon-orange': '#FF7000',      
      },
      
      // 4. Sombra de Brilho Customizada
      boxShadow: {
        'smooth': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'neon-glow-teal': '0 0 10px #00FFFF', 
        'neon-glow-orange': '0 0 8px #FF7000',
        'shadow-card-hover': '0 4px 10px rgba(0, 0, 0, 0.1)',
      },

      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}