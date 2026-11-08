'use strict';
// Static regression guard: verifies the shared brand layer is wired to EVERY
// website screen without touching authentication, forms or business data.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const read = f => fs.readFileSync(path.join(root,f),'utf8');
const styles = read('assets/brand.css');
const tokens = {
  '--vorvan-primary': '#800020',
  '--vorvan-primary-dark': '#5A1028',
  '--vorvan-primary-hover': '#650019',
  '--vorvan-soft': '#F7E9EE',
  '--vorvan-white': '#FFFFFF',
  '--vorvan-text': '#1F2937',
  '--vorvan-muted': '#6B7280',
};
for (const [name,value] of Object.entries(tokens)) {
  assert.ok(styles.includes(name+': '+value+';'), name+' is missing or incorrect');
}
const pages=fs.readdirSync(root).filter(f => f.endsWith('.html') && !f.startsWith('google7decf5ca6ffe0331'));
for (const page of pages) {
  const html=read(page);
  const link='assets/brand.css?v=20261108-burgundy';
  assert.equal(html.split(link).length-1,1,page+': expected exactly one branded CSS link');
  const cssIndex=html.indexOf(link);
  assert.ok(cssIndex > html.indexOf('rel="stylesheet"'),page+': brand must load after base stylesheet');
  assert.ok(cssIndex < html.indexOf('</head>'),page+': brand must be in head');
}
const vyn = read('assets/refresh.css');
assert.match(vyn,/\.vv-vyn-antenna-rotor\s*\{/,'Vyn antenna must remain animated');
assert.match(vyn,/vv-vyn-antenna-clockwise/,'Vyn clock rotation must remain');
assert.match(read('assets/assistant.js'),/vyn-reference\.webp/,'Official Vyn asset must remain');
assert.match(read('admin.html'),/data-area="compliance"/,'MFA/admin navigation must remain');
assert.match(read('partner-desk.html'),/LSP|API/i,'Partner portal must remain');
function luminance(hex) {
  const rgb=[1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
const ratio=(luminance('#FFFFFF')+.05)/(luminance('#800020')+.05);
assert.ok(ratio >= 4.5,'Burgundy primary must pass white-text WCAG AA contrast');
console.log('PASS: '+pages.length+' pages share Burgundy theme; approved Vyn and contrast preserved.');
