/**
 * BlackRoad OS Sites — Build Script
 * Validates and prepares the site for deployment.
 * Zero dependencies.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const BUILD_DIR = path.join(__dirname, 'dist');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function build() {
  console.log('Building BlackRoad OS Sites...\n');

  // Clean dist
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }

  // Copy public to dist
  copyDir(PUBLIC_DIR, BUILD_DIR);

  // Report
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const stat = fs.statSync(full);
        files.push({ path: path.relative(BUILD_DIR, full), size: stat.size });
      }
    }
  }
  walk(BUILD_DIR);

  console.log('Output files:');
  for (const f of files) {
    const kb = (f.size / 1024).toFixed(1);
    console.log(`  ${f.path} (${kb} KB)`);
  }

  const totalKB = (files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1);
  console.log(`\nTotal: ${files.length} files, ${totalKB} KB`);
  console.log('Build complete.');
}

build();
