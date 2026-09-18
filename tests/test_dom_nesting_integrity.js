const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: DOM NESTING & VIEW INTEGRITY ===');

const html = fs.readFileSync('carbon-inventory.html', 'utf8');

// 1. Tag balance scanner
const lines = html.split('\n');
const stack = [];
const selfClosing = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

lines.forEach((line, lineIdx) => {
  const regex = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*)?>/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    if (selfClosing.has(tag) || full.endsWith('/>')) continue;

    if (full.startsWith('</')) {
      const top = stack.pop();
      assert.ok(top, `Unexpected closing tag </${tag}> at line ${lineIdx + 1}`);
      assert.strictEqual(top.tag, tag, `Mismatched closing tag </${tag}> at line ${lineIdx + 1}, expected </${top.tag}> opened at line ${top.line}`);
    } else {
      const idMatch = full.match(/id="([^"]+)"/);
      const classMatch = full.match(/class="([^"]+)"/);
      const info = idMatch ? `id=${idMatch[1]}` : (classMatch ? `class=${classMatch[1]}` : full.slice(0, 40));
      stack.push({ tag, line: lineIdx + 1, info });
    }
  }
});

assert.strictEqual(stack.length, 0, `Unclosed tags remaining in carbon-inventory.html: ${stack.map(s => `<${s.tag}> (L${s.line})`).join(', ')}`);
console.log('-> PASS 1: All HTML tags strictly balanced with 0 unclosed tags.');

// 2. Verify all views are direct siblings and not nested inside view-source
const viewSourceStart = html.indexOf('id="view-source"');
const viewEquipmentStart = html.indexOf('id="view-equipment"');
const viewActivityStart = html.indexOf('id="view-activity"');
const viewReportStart = html.indexOf('id="view-report"');

assert.ok(viewSourceStart > 0, 'view-source exists');
assert.ok(viewEquipmentStart > viewSourceStart, 'view-equipment is placed after view-source');
assert.ok(viewActivityStart > viewEquipmentStart, 'view-activity is placed after view-equipment');
assert.ok(viewReportStart > viewActivityStart, 'view-report is placed after view-activity');

// Check that between viewSourceStart and viewEquipmentStart, the depth returns to sibling level
const slice = html.substring(viewSourceStart, viewEquipmentStart);
const opens = (slice.match(/<div\b/gi) || []).length;
const closes = (slice.match(/<\/div>/gi) || []).length;
assert.strictEqual(opens, closes, `view-source must be closed before view-equipment begins (opens: ${opens}, closes: ${closes})`);
console.log('-> PASS 2: view-equipment is a sibling to view-source, NOT nested inside it.');

console.log('=== DOM NESTING INTEGRITY TEST PASSED 100%! ===\n');
