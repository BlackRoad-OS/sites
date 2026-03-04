/**
 * BlackRoad OS Sites — HTML Validation
 * Checks HTML files for common issues. Zero dependencies.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function validateHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const name = path.relative(PUBLIC_DIR, filePath);
  const errors = [];

  if (!content.includes('<!DOCTYPE html>')) {
    errors.push('Missing <!DOCTYPE html>');
  }
  if (!content.includes('<html')) {
    errors.push('Missing <html> tag');
  }
  if (!content.includes('lang=')) {
    errors.push('Missing lang attribute on <html>');
  }
  if (!content.includes('<meta charset')) {
    errors.push('Missing charset meta tag');
  }
  if (!content.includes('<meta name="viewport"')) {
    errors.push('Missing viewport meta tag');
  }
  if (!content.includes('<title>')) {
    errors.push('Missing <title> tag');
  }
  if (!content.includes('</html>')) {
    errors.push('Missing closing </html> tag');
  }

  // Privacy checks
  if (content.includes('google-analytics') || content.includes('gtag')) {
    errors.push('PRIVACY VIOLATION: Google Analytics detected');
  }
  if (content.includes('facebook.com/tr') || content.includes('fbevents')) {
    errors.push('PRIVACY VIOLATION: Facebook tracking detected');
  }

  return { name, errors };
}

function run() {
  console.log('Validating HTML files...\n');

  const files = findHtmlFiles(PUBLIC_DIR);
  if (files.length === 0) {
    console.error('No HTML files found in public/');
    process.exit(1);
  }

  let hasErrors = false;
  for (const file of files) {
    const result = validateHtml(file);
    if (result.errors.length > 0) {
      hasErrors = true;
      console.log(`FAIL ${result.name}`);
      for (const err of result.errors) {
        console.log(`  - ${err}`);
      }
    } else {
      console.log(`PASS ${result.name}`);
    }
  }

  console.log(`\n${files.length} file(s) checked.`);

  if (hasErrors) {
    console.log('Validation failed.');
    process.exit(1);
  } else {
    console.log('All files valid.');
  }
}

run();
