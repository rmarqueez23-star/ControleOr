// tailwind.config.js - TEMA PREMIUM ATUALIZADO

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", 
    "./js/*.js",
  ],
  
  theme: {
    extend: {
      // Cores do Tema Premium
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

        // Cores Premium Adicionadas
        'premium-orange': '#FF6B00',
        'premium-teal': '#00E0FF',
        'premium-gold': '#FFD700',
        'premium-silver': '#F8FAFC',

        // ADICIONE ESTA LINHA PARA CORRIGIR O ERRO
        'neutral-mid': '#94A3B8', // ou qualquer cor que você preferir
      },

      
      
      // Gradientes Personalizados Premium
      backgroundImage: {
        'premium-primary': 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
        'premium-success': 'linear-gradient(135deg, #28A745 0%, #20C997 100%)',
        'premium-teal': 'linear-gradient(135deg, #008080 0%, #00E0FF 100%)',
        'premium-gold': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'glass-effect': 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
        'card-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #FFFFFF 100%)',
      },
      
      // Animações Personalizadas Premium
      animation: {
        'slide-in-up': 'slideInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'progress-fill': 'progressFill 1.5s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'confetti': 'confetti 1s ease-out forwards',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      
      // Keyframes para as animações premium
      keyframes: {
        slideInUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(40px) scale(0.92)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0) scale(1)' 
          },
        },
        progressFill: {
          '0%': { 
            transform: 'scaleX(0)',
            opacity: '0.8'
          },
          '100%': { 
            transform: 'scaleX(var(--progress-width, 1))',
            opacity: '1'
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 215, 0, 0.8)' },
        },
        'pulse-gentle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'bounce-gentle': {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0,-8px,0)' },
          '70%': { transform: 'translate3d(0,-4px,0)' },
        },
        confetti: {
          '0%': {
            transform: 'translateY(0) rotate(0deg)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(100px) rotate(360deg)',
            opacity: '0',
          },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
      },
      
      // Sombras Premium
      boxShadow: {
        'smooth': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'premium': '0 20px 40px rgba(0, 0, 0, 0.1)',
        'premium-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'premium-xl': '0 35px 60px -15px rgba(0, 0, 0, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glow-orange': '0 0 20px rgba(255, 140, 0, 0.4)',
        'glow-teal': '0 0 20px rgba(0, 224, 255, 0.4)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.4)',
        'inner-premium': 'inset 0 2px 6px rgba(0, 0, 0, 0.08)',
        'shadow-card-hover': '0 4px 10px rgba(0, 0, 0, 0.1)',
      },
      
      // Backdrop Blur para efeitos de vidro
      backdropBlur: {
        'xs': '2px',
        'sm': '4px', 
        'md': '8px',
        'lg': '12px',
        'xl': '20px',
      },
      
      // Fontes
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      
      // Border Radius Extendido
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      // Espaçamentos Extendidos
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Z-Index Extendido
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // Opacidades Extendidas
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '65': '0.65',
        '85': '0.85',
      },
    },
  },
  
  plugins: [
    // Plugin para utilitários CSS personalizados
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Efeitos de vidro (glass morphism)
        '.backdrop-glass': {
          'backdrop-filter': 'blur(20px)',
          'background': 'rgba(255, 255, 255, 0.1)',
        },
        // Suporte 3D
        '.preserve-3d': {
          'transform-style': 'preserve-3d',
        },
        '.perspective-1000': {
          'perspective': '1000px',
        },
        // Gradientes text
        '.text-gradient-primary': {
          'background': 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-teal': {
          'background': 'linear-gradient(135deg, #008080 0%, #00E0FF 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        // Esconder scrollbar mas manter funcionalidade
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
}