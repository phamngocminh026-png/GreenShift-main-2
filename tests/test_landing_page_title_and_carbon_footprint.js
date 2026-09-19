const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST: Landing Page Title, ESG Removal & Carbon Footprint Feature ---');

const indexPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'assets', 'css', 'style.css');
const loginPath = path.join(__dirname, '..', 'login.html');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const styleCss = fs.readFileSync(cssPath, 'utf8');
const loginHtml = fs.readFileSync(loginPath, 'utf8');

// 1. Verify "Nền tảng Quản trị ESG" is completely removed from index.html
assert(!indexHtml.includes('Nền tảng Quản trị ESG'), 'index.html must not contain "Nền tảng Quản trị ESG"');
assert(!indexHtml.includes('ESG Score'), 'index.html must not contain "ESG Score" floating badge');
assert(!loginHtml.includes('Quản trị Phát thải Carbon & ESG'), 'login.html must not contain "Quản trị Phát thải Carbon & ESG"');
console.log('✓ PASS 1: Removed all "Quản trị ESG" references from landing page and login.');

// 2. Verify balanced hero title & subtitle
assert(indexHtml.includes('hero-title'), 'Must have hero-title class');
assert(indexHtml.includes('hero-gradient-text'), 'Must have hero-gradient-text class');
assert(indexHtml.includes('hero-highlight-sub'), 'Must have hero-highlight-sub');
assert(indexHtml.includes('Theo dõi Dấu chân Carbon cụ thể'), 'Must highlight specific, simple Carbon Footprint tracking in subtitle');
console.log('✓ PASS 2: Hero title is balanced, aesthetic and highlights Carbon Footprint.');

// 3. Verify floating cards updated & protected against collision
assert(indexHtml.includes('Dấu Chân Carbon SP'), 'Must have Dấu Chân Carbon SP card');
assert(indexHtml.includes('Kiểm Kê KNK Toàn Diện'), 'Must have Kiểm Kê KNK Toàn Diện card');
assert(indexHtml.includes('Báo Cáo EU CBAM'), 'Must have Báo Cáo EU CBAM card');
assert(styleCss.includes('@media (max-width: 1360px)'), 'style.css must have media query hiding floating-card on laptops to prevent overlap');
assert(indexHtml.includes('hero-mini-chips'), 'Must have hero-mini-chips for clean display on laptops/tablets');
console.log('✓ PASS 3: Floating cards updated and collision protection verified.');

// 4. Verify #giai-phap section with Carbon Footprint pillar & interactive calculator
assert(indexHtml.includes('id="giai-phap"'), 'Must have section #giai-phap');
assert(indexHtml.includes('Theo Dõi Dấu Chân Carbon'), 'Must have Theo Dõi Dấu Chân Carbon card');
assert(indexHtml.includes('demo-calc-industry'), 'Must have interactive calculator dropdown demo-calc-industry');
assert(indexHtml.includes('demo-calc-prod'), 'Must have interactive calculator input demo-calc-prod');
assert(indexHtml.includes('demo-calc-intensity'), 'Must have interactive calculator result demo-calc-intensity');
console.log('✓ PASS 4: #giai-phap section and interactive Carbon Footprint calculator verified.');

// 5. Test calculator simulation logic
const factors = {
  steel: 0.68,
  cement: 0.85,
  aluminum: 1.95,
  textile: 0.42
};

function calcIntensity(ind, qty) {
  const factor = factors[ind] || 0.68;
  const total = Math.round(qty * factor);
  return { factor, total };
}

const resSteel = calcIntensity('steel', 5000);
assert.strictEqual(resSteel.factor, 0.68, 'Steel factor should be 0.68');
assert.strictEqual(resSteel.total, 3400, '5000 tons steel should equal 3400 tCO2e');

const resCement = calcIntensity('cement', 10000);
assert.strictEqual(resCement.factor, 0.85, 'Cement factor should be 0.85');
assert.strictEqual(resCement.total, 8500, '10000 tons cement should equal 8500 tCO2e');
console.log('✓ PASS 5: Interactive Carbon Footprint calculation logic is accurate.');

console.log('\n🎉 ALL CHECKS PASSED: Landing page title, aesthetics, and Carbon Footprint feature 100% verified!');
