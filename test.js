/**
 * BlackRoad OS Sites — Test Suite
 * End-to-end tests. Zero dependencies.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { server, PUBLIC_DIR, MIME_TYPES } = require('./server');

let passed = 0;
let failed = 0;
let baseUrl;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS  ${message}`);
    passed++;
  } else {
    console.log(`  FAIL  ${message}`);
    failed++;
  }
}

function fetch(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${urlPath}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Static File Tests ──

async function testStaticFiles() {
  console.log('\n── Static Files ──');

  const htmlFiles = ['index.html', 'about.html'];
  for (const file of htmlFiles) {
    const exists = fs.existsSync(path.join(PUBLIC_DIR, file));
    assert(exists, `public/${file} exists`);
  }

  assert(fs.existsSync(path.join(PUBLIC_DIR, 'styles.css')), 'public/styles.css exists');
}

// ── HTML Quality Tests ──

async function testHtmlQuality() {
  console.log('\n── HTML Quality ──');

  const htmlFiles = ['index.html', 'about.html'];
  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf-8');

    assert(content.includes('<!DOCTYPE html>'), `${file} has DOCTYPE`);
    assert(content.includes('lang="en"'), `${file} has lang attribute`);
    assert(content.includes('<meta charset="UTF-8">'), `${file} has charset`);
    assert(content.includes('meta name="viewport"'), `${file} has viewport meta`);
    assert(content.includes('<title>'), `${file} has title`);
    assert(content.includes('</html>'), `${file} has closing html tag`);
  }
}

// ── Privacy Tests ──

async function testPrivacy() {
  console.log('\n── Privacy Compliance ──');

  const htmlFiles = ['index.html', 'about.html'];
  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf-8');

    assert(!content.includes('google-analytics'), `${file} has no Google Analytics`);
    assert(!content.includes('gtag('), `${file} has no gtag`);
    assert(!content.includes('facebook.com'), `${file} has no Facebook tracking`);
    assert(!content.includes('cdn.jsdelivr'), `${file} has no external CDN`);
    assert(!content.includes('cloudflare'), `${file} has no Cloudflare deps`);
  }
}

// ── Server Tests ──

async function testServer() {
  console.log('\n── Server ──');

  // GET /
  const home = await fetch('/');
  assert(home.status === 200, 'GET / returns 200');
  assert(home.headers['content-type'].includes('text/html'), 'GET / returns HTML');
  assert(home.body.includes('BlackRoad OS'), 'GET / contains site name');

  // GET /about.html
  const about = await fetch('/about.html');
  assert(about.status === 200, 'GET /about.html returns 200');
  assert(about.body.includes('About BlackRoad OS'), '/about.html has correct content');

  // GET /styles.css
  const css = await fetch('/styles.css');
  assert(css.status === 200, 'GET /styles.css returns 200');
  assert(css.headers['content-type'].includes('text/css'), '/styles.css has correct MIME type');

  // 404
  const notFound = await fetch('/nonexistent');
  assert(notFound.status === 404, 'GET /nonexistent returns 404');
}

// ── Security Header Tests ──

async function testSecurityHeaders() {
  console.log('\n── Security Headers ──');

  const res = await fetch('/');
  assert(res.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff');
  assert(res.headers['x-frame-options'] === 'DENY', 'X-Frame-Options: DENY');
  assert(res.headers['referrer-policy'] === 'no-referrer', 'Referrer-Policy: no-referrer');
  assert(res.headers['permissions-policy'] !== undefined, 'Permissions-Policy is set');
}

// ── Directory Traversal Tests ──

async function testSecurity() {
  console.log('\n── Security ──');

  const traversal = await fetch('/../package.json');
  assert(traversal.status === 404 || traversal.status === 403, 'Directory traversal blocked');
}

// ── Build Tests ──

async function testBuild() {
  console.log('\n── Build ──');

  const { execSync } = require('child_process');
  try {
    const output = execSync('node build.js', { cwd: __dirname, encoding: 'utf-8' });
    assert(output.includes('Build complete'), 'Build completes successfully');
    assert(fs.existsSync(path.join(__dirname, 'dist', 'index.html')), 'dist/index.html created');
    assert(fs.existsSync(path.join(__dirname, 'dist', 'styles.css')), 'dist/styles.css created');

    // Clean up
    fs.rmSync(path.join(__dirname, 'dist'), { recursive: true });
    assert(true, 'dist/ cleaned up');
  } catch (e) {
    assert(false, `Build failed: ${e.message}`);
  }
}

// ── Validate Tests ──

async function testValidate() {
  console.log('\n── Validation ──');

  const { execSync } = require('child_process');
  try {
    const output = execSync('node validate.js', { cwd: __dirname, encoding: 'utf-8' });
    assert(output.includes('All files valid'), 'HTML validation passes');
  } catch (e) {
    assert(false, `Validation failed: ${e.stderr || e.message}`);
  }
}

// ── Run ──

async function run() {
  console.log('BlackRoad OS Sites — Test Suite\n');

  // Start server on random port
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server on port ${port}`);
      resolve();
    });
  });

  try {
    await testStaticFiles();
    await testHtmlQuality();
    await testPrivacy();
    await testServer();
    await testSecurityHeaders();
    await testSecurity();
    await testBuild();
    await testValidate();
  } finally {
    server.close();
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(40));

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
