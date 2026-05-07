import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// Photographs and other shared media live one level above the frontend at
// repo-root /assets/. We mount that folder at the /assets/ URL so:
//   - the marketing site can reference /assets/site/hero/* directly, and
//   - Vicky's real photographs appear immediately when dropped on disk —
//     no rebuild, no code change.
//
// Veelo's runtime images come from the FastAPI backend (proxied below) and
// are unaffected by this mount.
const SHARED_ASSETS_DIR = path.resolve(__dirname, '../assets')

const MIME = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
}

function sharedAssets() {
  return {
    name: 'vicky-shared-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        try {
          const url = decodeURIComponent((req.url || '').split('?')[0])
          // Defence: block traversal. path.join + normalize + prefix-check.
          const requested = path.normalize(path.join(SHARED_ASSETS_DIR, url))
          if (!requested.startsWith(SHARED_ASSETS_DIR + path.sep) && requested !== SHARED_ASSETS_DIR) {
            res.statusCode = 403
            return res.end('Forbidden')
          }
          fs.stat(requested, (err, stat) => {
            if (err || !stat.isFile()) return next()
            const ext = path.extname(requested).toLowerCase()
            if (MIME[ext]) res.setHeader('Content-Type', MIME[ext])
            res.setHeader('Cache-Control', 'public, max-age=3600')
            fs.createReadStream(requested).pipe(res)
          })
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sharedAssets()],
  server: {
    proxy: {
      '/analyze':  'http://localhost:8000',
      '/generate': 'http://localhost:8000',
      '/catalog':  'http://localhost:8000',   // covers /catalog/swatches/* too
      '/hangers':  'http://localhost:8000',
      '/inquiry':  'http://localhost:8000',
      '/saves':    'http://localhost:8000',
      '/status':   'http://localhost:8000',
    }
  }
})
