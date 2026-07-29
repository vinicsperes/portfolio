import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Só three e react, que já eram carregados de qualquer jeito no chunk
        // inicial. O total do primeiro acesso não muda, mas essas duas quase
        // nunca mudam de versão: separadas do código do site, sobrevivem no
        // cache a cada deploy — quem volta baixa só o chunk pequeno do app.
        //
        // @react-three fica DE FORA de propósito: agrupar o drei aqui puxava
        // pro chunk inicial o que hoje só existe no chunk lazy do pedal.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'three'
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
        },
      },
    },
  },
})
