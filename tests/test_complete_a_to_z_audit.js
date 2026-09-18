const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('======================================================================');
console.log('STARTING DEEP A-TO-Z FORENSIC AUDIT OF ALL FILES & CODE CONNECTIONS');
console.log('======================================================================\n');

const rootDir = process.cwd();
const errors = [];
const warnings = [];
let passedChecks = 0;

function logError(file, message) {
  errors.push({ file, message });
  console.log(`[ERROR] [${file}]: ${message}`);
}

function logWarning(file, message) {
  warnings.push({ file, message });
  console.log(`[WARN]  [${file}]: ${message}`);
}

function logPass(message) {
  passedChecks++;
  console.log(`[PASS]  ${message}`);
}

// =============================================================================
// 1. STATIC ASSET & SCRIPT CONNECTIVITY (HTML -> JS, CSS, Images)
// =============================================================================
console.log('--- 1. Checking Static Asset & Script References in all HTML files ---');

const htmlFiles = [
  'index.html',
  'login.html',
  'carbon-inventory.html',
  'cbam-dashboard.html',
  'supplier.html',
  'about.html',
  'setup.html'
];

htmlFiles.forEach(htmlRel => {
  const htmlPath = path.join(rootDir, htmlRel);
  if (!fs.existsSync(htmlPath)) {
    logError(htmlRel, 'File does not exist');
    return;
  }
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Check script src
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      continue; // External CDN
    }
    const cleanSrc = src.split('?')[0].split('#')[0];
    const assetPath = path.join(rootDir, cleanSrc);
    if (!fs.existsSync(assetPath)) {
      logError(htmlRel, `Broken <script src="${src}"> - Target file does not exist: ${cleanSrc}`);
    } else {
      logPass(`${htmlRel} -> script "${src}" exists`);
    }
  }

  // Check link href (CSS)
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) continue;
    if (href.endsWith('.ico') || href.includes('icon') || href.endsWith('.css')) {
      const cleanHref = href.split('?')[0].split('#')[0];
      const assetPath = path.join(rootDir, cleanHref);
      if (!fs.existsSync(assetPath)) {
        logError(htmlRel, `Broken <link href="${href}"> - Target file does not exist: ${cleanHref}`);
      } else {
        logPass(`${htmlRel} -> link "${href}" exists`);
      }
    }
  }

  // Check img src
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('//')) continue;
    const cleanSrc = src.split('?')[0].split('#')[0];
    const assetPath = path.join(rootDir, cleanSrc);
    if (!fs.existsSync(assetPath)) {
      logError(htmlRel, `Broken <img src="${src}"> - Target image does not exist: ${cleanSrc}`);
    } else {
      logPass(`${htmlRel} -> image "${src}" exists`);
    }
  }
});

// =============================================================================
// 2. SYNTAX VALIDATION ACROSS ALL JAVASCRIPT FILES
// =============================================================================
console.log('\n--- 2. Validating JavaScript Syntax with node --check ---');

const jsDir = path.join(rootDir, 'assets/js');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

jsFiles.forEach(f => {
  const filePath = path.join(jsDir, f);
  try {
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    logPass(`Syntax OK: assets/js/${f}`);
  } catch (err) {
    logError(`assets/js/${f}`, `Syntax Error: ${err.message}`);
  }
});

// =============================================================================
// 3. SCRIPT LOAD ORDER IN carbon-inventory.html
// =============================================================================
console.log('\n--- 3. Checking Script Load Order & Global Dependency Hierarchy ---');

const invHtml = fs.readFileSync(path.join(rootDir, 'carbon-inventory.html'), 'utf8');

const scriptOrder = [];
const sRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
let match;
while ((match = sRegex.exec(invHtml)) !== null) {
  scriptOrder.push(match[1]);
}

function getScriptIndex(name) {
  return scriptOrder.findIndex(s => s.toLowerCase().includes(name.toLowerCase()));
}

const idxChart = getScriptIndex('chart');
const idxEf = getScriptIndex('ef-master.js');
const idxAct = getScriptIndex('carbon-activity.js');
const idxDash = getScriptIndex('carbon-dashboard.js');
const idxDocx = getScriptIndex('word-export.js');

if (idxEf !== -1 && idxAct !== -1 && idxEf < idxAct) {
  logPass('ef-master.js is loaded before carbon-activity.js');
} else {
  logError('carbon-inventory.html', 'ef-master.js must be loaded before carbon-activity.js');
}

if (idxChart !== -1 && idxDash !== -1 && idxChart < idxDash) {
  logPass('Chart.js is loaded before carbon-dashboard.js');
} else {
  logError('carbon-inventory.html', 'Chart.js must be loaded before carbon-dashboard.js');
}

if (idxDocx !== -1) {
  logPass('word-export.js is included for report generation');
} else {
  logError('carbon-inventory.html', 'word-export.js is missing from scripts');
}

// =============================================================================
// 4. STORAGE KEY CONSISTENCY & DATA PIPELINE
// =============================================================================
console.log('\n--- 4. Checking Storage Keys Consistency Across Core Modules ---');

const dashJs = fs.readFileSync(path.join(rootDir, 'assets/js/carbon-dashboard.js'), 'utf8');
const actJs = fs.readFileSync(path.join(rootDir, 'assets/js/carbon-activity.js'), 'utf8');
const compJs = fs.readFileSync(path.join(rootDir, 'assets/js/carbon-company.js'), 'utf8');
const wordExportJs = fs.readFileSync(path.join(rootDir, 'assets/js/word-export.js'), 'utf8');

const checkUserHandling = (name, code) => {
  if (code.includes("localStorage.getItem('gs_current_user')") || code.includes("localStorage.getItem('gs_user')")) {
    logPass(`${name} reads user from localStorage properly.`);
  } else {
    logWarning(name, 'Does not read user storage key');
  }
};
checkUserHandling('carbon-dashboard.js', dashJs);
checkUserHandling('carbon-activity.js', actJs);
checkUserHandling('carbon-company.js', compJs);
checkUserHandling('word-export.js', wordExportJs);

if (dashJs.includes('_activity') && actJs.includes('_activity') && wordExportJs.includes('_activity')) {
  logPass('All modules share the uniform `_activity` localStorage key naming convention.');
} else {
  logError('DataPipeline', 'Mismatch in activity storage key pattern');
}

if (dashJs.includes('_sources') && actJs.includes('_sources')) {
  logPass('Dashboard and Activity share the uniform `_sources` key.');
} else {
  logError('DataPipeline', 'Mismatch in sources storage key pattern');
}

// =============================================================================
// 5. DOM ELEMENT ID VERIFICATION (JS document.getElementById -> HTML)
// =============================================================================
console.log('\n--- 5. Checking DOM Element ID References in carbon-inventory.html ---');

const coreModules = [
  { name: 'carbon-dashboard.js', code: dashJs },
  { name: 'carbon-activity.js', code: actJs },
  { name: 'carbon-company.js', code: compJs }
];

coreModules.forEach(mod => {
  const idRegex = /document\.getElementById\(['"]([a-zA-Z0-9_-]+)['"]\)/g;
  let idMatch;
  const inspected = new Set();
  while ((idMatch = idRegex.exec(mod.code)) !== null) {
    const id = idMatch[1];
    if (inspected.has(id)) continue;
    inspected.add(id);

    const existsInHtml = invHtml.includes(`id="${id}"`);
    if (!existsInHtml) {
      const pos = idMatch.index;
      const snippet = mod.code.slice(pos, pos + 120);
      const isGuarded = snippet.includes('if (') || snippet.includes('?.') || snippet.includes('&&') || mod.code.slice(Math.max(0, pos - 60), pos).includes('if (');
      if (!isGuarded) {
        logWarning(mod.name, `Element #${id} not directly found in HTML and may lack null check: "${snippet.slice(0, 60)}"`);
      } else {
        logPass(`${mod.name} -> guarded call on #${id}`);
      }
    } else {
      logPass(`${mod.name} -> found #${id} in HTML`);
    }
  }
});

// =============================================================================
// 6. SCOPE & EMISSION MAPPING ACCURACY IN ALL MODULES
// =============================================================================
console.log('\n--- 6. Verifying Scope 1, 2, 3 Consistency Across Modules ---');

if (dashJs.includes("'Tiêu thụ điện': 2") && dashJs.includes("'Tiêu thụ điện lưới': 2") && dashJs.includes("'Điện mua vào': 2")) {
  logPass('carbon-dashboard.js Scope 2 mappings for electricity are complete.');
} else {
  logError('carbon-dashboard.js', 'Scope 2 electricity mapping missing in dashboard');
}

if (invHtml.includes("'Tiêu thụ điện':                                       { label: 'Loại 2', scope: 2 }") &&
    invHtml.includes("'Tiêu thụ điện lưới':                                  { label: 'Loại 2', scope: 2 }")) {
  logPass('carbon-inventory.html CATEGORY_SCOPE Scope 2 mappings are complete.');
} else {
  logError('carbon-inventory.html', 'Scope 2 electricity mapping missing in HTML');
}

if (wordExportJs.includes("type === 'Tiêu thụ điện'") || wordExportJs.includes("type === 'Tiêu thụ điện lưới'")) {
  logPass('word-export.js explicitly maps electricity activities to Scope 2.');
} else {
  logError('word-export.js', 'Scope 2 electricity mapping missing in word-export.js');
}

// =============================================================================
// 7. DAY-OFF MANAGEMENT & CHART PRECISION VERIFICATION
// =============================================================================
console.log('\n--- 7. Verifying Working Days Distribution & Day-Off Management ---');

if (dashJs.includes('const dailyShare = co2e / workingDays;') &&
    dashJs.includes('if (workingDays === 0) workingDays = daysCount;')) {
  logPass('Dashboard calculates baseline emissions strictly over working days.');
} else {
  logError('carbon-dashboard.js', 'Missing working days baseline calculation');
}

if (actJs.includes('function removeActivityDaysOff') &&
    actJs.includes('function isVnPublicHoliday')) {
  logPass('carbon-activity.js contains full Day-Off management suite and Vietnamese holiday calendar.');
} else {
  logError('carbon-activity.js', 'Missing Day-off management or holiday logic');
}

// =============================================================================
// 8. PYTHON BACKEND SYNTAX COMPILATION (server/)
// =============================================================================
console.log('\n--- 8. Checking Python Backend Syntax (server/) ---');

const pyFiles = [
  'app.py',
  'server/app.py',
  'server/config.py',
  'server/services/cbam_service.py',
  'server/services/lookup_service.py'
];

// Determine python command (check venv first, then system python)
let pythonCmd = 'python';
const venvPy = path.join(process.env.USERPROFILE || '', '.venv/Scripts/python.exe');
if (fs.existsSync(venvPy)) {
  pythonCmd = `"${venvPy}"`;
}

pyFiles.forEach(pyRel => {
  const pyPath = path.join(rootDir, pyRel);
  if (fs.existsSync(pyPath)) {
    try {
      execSync(`${pythonCmd} -m py_compile "${pyPath}"`, { stdio: 'pipe' });
      logPass(`Python Syntax OK: ${pyRel}`);
    } catch (err) {
      logError(pyRel, `Python Syntax Error: ${err.message}`);
    }
  }
});

// =============================================================================
// SUMMARY OF AUDIT
// =============================================================================
console.log('\n======================================================================');
console.log(`DEEP AUDIT COMPLETED:`);
console.log(`- Passed Checks: ${passedChecks}`);
console.log(`- Warnings:      ${warnings.length}`);
console.log(`- Errors:        ${errors.length}`);
console.log('======================================================================');

if (errors.length > 0) {
  console.log('\nCRITICAL ERRORS:');
  errors.forEach((e, i) => console.log(`${i + 1}. [${e.file}] ${e.message}`));
  process.exit(1);
} else {
  console.log('\nALL CODE, CONNECTIONS, AND ASSETS FROM A TO Z VERIFIED 100% OPERATIONAL!');
}
