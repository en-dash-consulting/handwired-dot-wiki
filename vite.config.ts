import { resolve } from 'path'
import { readdirSync } from 'fs'
import { defineConfig } from 'vite'

const pages = Object.fromEntries(
  readdirSync(resolve(__dirname, 'pages')).filter(f => f.endsWith('.html')).map(f => [f.replace(/\.html$/, ''), resolve(__dirname, 'pages', f)]),
)

export default defineConfig({
  base: '/',
  build: { rollupOptions: { input: { main: resolve(__dirname, 'index.html'), ...pages } } },
})
