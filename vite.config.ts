import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'why-handwired': resolve(__dirname, 'pages/why-handwired.html'),
        'getting-started': resolve(__dirname, 'pages/getting-started.html'),
        'playground': resolve(__dirname, 'pages/playground.html'),
        'gallery': resolve(__dirname, 'pages/gallery.html'),
        'about': resolve(__dirname, 'pages/about.html'),
      },
    },
  },
})
