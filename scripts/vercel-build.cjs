#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
// Build wrapper cross-plateforme.
//
// Sur certains environnements CI (Vercel notamment), le nouveau
// mécanisme de sécurité npm "allowScripts" (npm >= 11.16) bloque les
// scripts postinstall des dépendances. Cela peut laisser des binaires
// (node_modules/.bin/vite, node_modules/@esbuild/<platform>/bin/esbuild)
// sans le bit d'exécution, provoquant "Permission denied" (exit 126).
//
// Ce script restaure le bit +x sur les binaires concernés (no-op
// silencieux sur Windows) puis lance Vite directement via `node`,
// ce qui évite totalement de dépendre du bit exécutable du wrapper
// node_modules/.bin/vite (node lit le fichier, il n'a pas besoin de
// le "exécuter" au sens Unix).
// ════════════════════════════════════════════════════════════
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.join(__dirname, '..')

function chmodDirContents(dir) {
  try {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry)
      try {
        const stat = fs.lstatSync(full)
        if (stat.isFile() || stat.isSymbolicLink()) fs.chmodSync(full, 0o755)
      } catch { /* fichier manquant, symlink cassé, etc. */ }
    }
  } catch { /* dossier illisible, on ignore */ }
}

// node_modules/.bin/* (vite, esbuild wrapper JS...)
chmodDirContents(path.join(root, 'node_modules', '.bin'))

// Binaires natifs d'esbuild, quelle que soit la plateforme (@esbuild/linux-x64, darwin-arm64...)
const esbuildScope = path.join(root, 'node_modules', '@esbuild')
try {
  if (fs.existsSync(esbuildScope)) {
    for (const platformDir of fs.readdirSync(esbuildScope)) {
      chmodDirContents(path.join(esbuildScope, platformDir, 'bin'))
    }
  }
} catch { /* pas de paquets @esbuild/* installés */ }

const command = process.argv[2] || 'build'
const viteEntry = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')

const result = spawnSync(process.execPath, [viteEntry, command], {
  stdio: 'inherit',
  cwd: root,
})

process.exit(result.status ?? 1)
