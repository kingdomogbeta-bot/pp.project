const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const backupRoot = path.join(root, '.comment_backups')

const textExt = new Set(['.js','.jsx','.ts','.tsx','.css','.html','.htm','.md','.json','.txt','.jsx','.yml','.yaml','.env','.config','.xml'])
const skipDirs = new Set(['node_modules','.git','.comment_backups','dist','build','public/images'])

function walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for(const e of entries){
    const full = path.join(dir, e.name)
    const rel = path.relative(root, full)
    if (skipDirs.has(e.name)) continue
    if (e.isDirectory()) walk(full)
    else {
      const ext = path.extname(e.name).toLowerCase()
      if (!textExt.has(ext)) continue
      try {
        const content = fs.readFileSync(full, 'utf8')
        let out = content
        // Remove JSX comments {/* ... */}
        out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
        // Remove block comments /* ... */
        out = out.replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove HTML comments <!-- ... -->
        out = out.replace(/<!--([\s\S]*?)-->/g, '')
        // Remove single-line comments //... (line-start or trailing)
        out = out.replace(/(^|\n)[ \t]*\/\/.*(?=\n|$)/g, '$1')

        if (out !== content) {
          const backupPath = path.join(backupRoot, rel)
          const backupDir = path.dirname(backupPath)
          fs.mkdirSync(backupDir, { recursive: true })
          fs.writeFileSync(backupPath, content, 'utf8')
          fs.writeFileSync(full, out, 'utf8')
          console.log('Stripped comments:', rel)
        }
      } catch (err) {
        console.error('skip non-text or error reading:', rel, err.message)
      }
    }
  }
}

fs.mkdirSync(backupRoot, { recursive: true })
console.log('Running comment stripper from', root)
walk(root)
console.log('Done. Backups saved to .comment_backups')
