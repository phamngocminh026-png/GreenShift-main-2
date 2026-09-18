const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const rootDir = path.resolve(__dirname, '..');
const exportJsPath = path.join(rootDir, 'assets', 'js', 'word-export.js');

console.log(`Testing Word template extraction from: ${exportJsPath}`);

if (!fs.existsSync(exportJsPath)) {
  console.error(`ERROR: File not found at ${exportJsPath}`);
  process.exit(1);
}

const jsContent = fs.readFileSync(exportJsPath, 'utf8');
const b64Match = jsContent.match(/const TEMPLATE_BASE64 = "([^"]+)";/);

if (!b64Match) {
  console.error("ERROR: Could not find TEMPLATE_BASE64 in word-export.js");
  process.exit(1);
}

const b64 = b64Match[1];
const buffer = Buffer.from(b64, 'base64');
const zip = new PizZip(buffer);

try {
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    company_name: 'GreenShift Test Enterprise',
    reportYear: '2026',
    tbl_317: [{ ipcc: '1', name: 'Nhóm A', gas: 'CO2', u_ad: '1', ref: 'Ref 1' }],
    tbl_318: [{ ipcc: '1', name: 'Nhóm B', gas: 'CH4', u_ef: '1', ref: 'Ref 2' }],
    scope1_stationary: [],
    scope1_mobile: [],
    scope2_grid: [],
    uncertainty_pct: '0.0'
  });

  console.log("SUCCESS: Docxtemplater rendered Decree 06 report template without errors!");
} catch (error) {
  console.error("FAIL: Error rendering document:", error.message);
  if (error.properties && error.properties.errors) {
    console.error(error.properties.errors.map(err => err.message).join('\n'));
  }
  process.exit(1);
}
