import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dotenv from "dotenv";

// Carregar variáveis de ambiente explicitamente
dotenv.config();

// Validação de variáveis de ambiente críticas
function validateEnvironment(mode: string) {
  console.log('🔍 Verificando variáveis de ambiente...');
  console.log('📄 VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA');
  console.log('🔑 VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
  
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Todas as variáveis de ambiente necessárias estão definidas!');

  // Validações de segurança
  if (mode === 'production') {
    // Em produção, debug deve estar desabilitado
    if (process.env.VITE_ENABLE_FORCE_AUTH === 'true') {
      throw new Error('FORCE_AUTH must be disabled in production');
    }
    
    if (process.env.VITE_ENABLE_DEBUG_ROUTES === 'true') {
      throw new Error('DEBUG_ROUTES must be disabled in production');
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  validateEnvironment(mode);
  
  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          charts: ['recharts'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['tests/**/*', 'node_modules/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
};
});
