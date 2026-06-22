/**
 * Script pour exporter le projet KRONE
 * Exécuter avec: node scripts/export-project.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const exportDir = path.join(projectRoot, 'krone-export');

// Fichiers et dossiers à exporter
const filesToExport = [
  'src',
  'public',
  'electron',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'package.electron.json',
  'INSTALLATION.md',
];

// Créer le dossier d'export
if (fs.existsSync(exportDir)) {
  fs.rmSync(exportDir, { recursive: true });
}
fs.mkdirSync(exportDir, { recursive: true });

// Copier les fichiers
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

filesToExport.forEach(file => {
  const srcPath = path.join(projectRoot, file);
  const destPath = path.join(exportDir, file === 'package.electron.json' ? 'package.json' : file);
  
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    console.log(`✓ Copié: ${file}`);
  } else {
    console.log(`✗ Non trouvé: ${file}`);
  }
});

// Créer un README rapide
const readme = `# KRONE - Gestion Commerciale

## Installation rapide

1. Ouvrez ce dossier dans Visual Studio Code
2. Ouvrez un terminal (Ctrl + \`)
3. Exécutez: npm install
4. Exécutez: npm run dev

Pour créer l'application desktop:
1. npm run electron:dev (développement)
2. npm run electron:build:win (créer l'installateur)

Voir INSTALLATION.md pour plus de détails.
`;

fs.writeFileSync(path.join(exportDir, 'README.md'), readme);

console.log('\n✅ Projet exporté dans:', exportDir);
console.log('\nPour créer un ZIP, compressez le dossier "krone-export"');
