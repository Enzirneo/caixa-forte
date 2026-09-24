import { readFileSync } from 'fs'
import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const { version: versaoDoApp } = JSON.parse(readFileSync(resolve('package.json'), 'utf-8')) as {
  version: string
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    define: {
      __VERSAO_DO_APP__: JSON.stringify(versaoDoApp)
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
