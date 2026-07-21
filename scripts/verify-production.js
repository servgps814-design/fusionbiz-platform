#!/usr/bin/env node

/**
 * Pre-deployment Verification Script
 * Runs checks to ensure FusionBiz Platform is ready for production
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const checks = []
let passCount = 0
let failCount = 0
let warnCount = 0

function check(name, fn) {
  checks.push({ name, fn })
}

function pass(message) {
  console.log(`✅ ${message}`)
  passCount++
}

function fail(message) {
  console.error(`❌ ${message}`)
  failCount++
}

function warn(message) {
  console.warn(`⚠️ ${message}`)
  warnCount++
}

// ─── File existence checks
check('package.json exists', () => {
  if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
    pass('package.json found')
  } else {
    fail('package.json not found')
  }
})

check('vite.config.ts exists', () => {
  if (fs.existsSync(path.join(projectRoot, 'vite.config.ts'))) {
    pass('vite.config.ts found')
  } else {
    fail('vite.config.ts not found')
  }
})

check('index.html exists', () => {
  if (fs.existsSync(path.join(projectRoot, 'index.html'))) {
    pass('index.html found')
  } else {
    fail('index.html not found')
  }
})

check('Environment files', () => {
  const hasEnvExample = fs.existsSync(path.join(projectRoot, '.env.example'))
  const hasEnvLocal = fs.existsSync(path.join(projectRoot, '.env.local'))

  if (hasEnvExample) {
    pass('.env.example found')
  } else {
    fail('.env.example not found')
  }

  if (!hasEnvLocal) {
    warn('.env.local not found - make sure it exists on production')
  } else {
    pass('.env.local found')
  }
})

// ─── Dependency checks
check('Node modules installed', () => {
  if (fs.existsSync(path.join(projectRoot, 'node_modules'))) {
    pass('node_modules directory found')
  } else {
    fail('node_modules not found - run npm install or bun install')
  }
})

// ─── Configuration checks
check('Build configuration', () => {
  try {
    const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.ts'), 'utf8')
    if (viteConfig.includes('build:') && viteConfig.includes('minify')) {
      pass('Production build configuration found')
    } else {
      warn('Build configuration may need optimization')
    }
  } catch {
    fail('Could not read vite.config.ts')
  }
})

check('Security headers', () => {
  try {
    if (fs.existsSync(path.join(projectRoot, 'vercel.json'))) {
      const vercelConfig = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'vercel.json'), 'utf8')
      )
      if (vercelConfig.headers && vercelConfig.headers.length > 0) {
        pass('Security headers configured in vercel.json')
      } else {
        warn('Security headers not configured')
      }
    } else {
      warn('vercel.json not found')
    }
  } catch {
    fail('Could not verify security headers')
  }
})

// ─── SEO checks
check('SEO files', () => {
  const seoFiles = ['public/robots.txt', 'public/manifest.json']
  for (const file of seoFiles) {
    if (fs.existsSync(path.join(projectRoot, file))) {
      pass(`${file} found`)
    } else {
      warn(`${file} not found`)
    }
  }
})

// ─── Documentation checks
check('Deployment documentation', () => {
  if (fs.existsSync(path.join(projectRoot, 'DEPLOYMENT.md'))) {
    pass('DEPLOYMENT.md found')
  } else {
    warn('DEPLOYMENT.md not found')
  }
})

// ─── Run all checks
console.log('\n🔍 Running Pre-Deployment Checks...\n')

for (const { name, fn } of checks) {
  try {
    console.log(`\n📋 ${name}`)
    fn()
  } catch (error) {
    fail(`Error: ${error.message}`)
  }
}

// ─── Summary
console.log('\n' + '='.repeat(50))
console.log(`\n✅ Passed: ${passCount}`)
if (warnCount > 0) console.log(`⚠️  Warnings: ${warnCount}`)
if (failCount > 0) console.log(`❌ Failed: ${failCount}`)

if (failCount === 0) {
  console.log('\n🚀 Ready for deployment!\n')
  process.exit(0)
} else {
  console.log('\n⚠️  Fix the issues above before deploying.\n')
  process.exit(1)
}
