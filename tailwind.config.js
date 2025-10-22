// tailwind.config.js - TEMA INVERTIDO: CLARO é o Padrão, DARK é a customização

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", 
  ],
  
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

        // Novas cores para o design "Tech Premium"
        'aqua': '#00E0FF',
        'gold': '#FFD700',
        'dark-blue': '#0E1117',
        'dark-surface': '#161B22',
      },
      
      // 4. Sombra de Brilho Customizada
      boxShadow: {
        'smooth': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'shadow-card-hover': '0 4px 10px rgba(0, 0, 0, 0.1)',
      },

      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}