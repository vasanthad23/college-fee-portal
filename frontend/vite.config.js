import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to display a Vercel-style URL in terminal
function vercelStyleUrl() {
  return {
    name: 'vercel-style-url',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        setTimeout(() => {
          const deployUrl = 'https://college-fee-portal-olive.vercel.app'
          console.log()
          console.log(`  \x1b[36m➜\x1b[0m  \x1b[1mDeployed:\x1b[0m \x1b[36m${deployUrl}\x1b[0m`)
          console.log()
        }, 100)
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelStyleUrl()],
})
