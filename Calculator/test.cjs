const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../Sources/Resources/QuickCalculator.js'), 'utf8'), context);
const cases = [
  ['2^128', 'expression', '340282366920938463463374607431768211456'],
  ['(3+5)/2', 'expression', '4'],
  ['3.5^2', 'expression', '49/4'],
  ['2^-3', 'expression', '1/8'],
  ['-2^2', 'expression', '-4'],
  ['2^3^2', 'expression', '512'],
  ['0xFF+0b1', 'expression', '256'],
  ['540,144', 'gcd', '36'],
  ['gcd(540,144)', 'gcd', '36'],
  ['540，144', 'gcd', '36'],
  ['-540,144', 'gcd', '36'],
  ['0,0', 'gcd', '0'],
  ['540,144', 'lcm', '2160'],
  ['-540,144', 'lcm', '2160'],
  ['0,144', 'lcm', '0'],
  ['-12,7', 'mod', '2'],
  ['17,170,13', 'pow', '3'],
  ['17^170 mod 13', 'pow', '3'],
  ['3,-1,7', 'pow', '5'],
  ['79,3220', 'inv', '1019'],
];
for (const [input, operation, expected] of cases) {
  assert.equal(context.quickCalculate(input, operation), expected, `${operation}: ${input}`);
}
for (const [input, operation] of [['1/0','expression'], ['0^0','expression'], ['alert(1)','expression'], ['540','gcd'], ['8,14','inv'], ['2,0','mod'], ['2,3,0','pow']]) {
  assert.match(context.quickCalculate(input, operation), /划选格式：/);
}
console.log(`${cases.length + 7} quick calculation checks passed`);
