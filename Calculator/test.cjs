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

const converted = '十进制  255\n二进制  11111111\n八进制  377\n十六进制  FF';
for (const [input, operation] of [['255','base'],['0xff','base'],['0B11111111','base'],['0o377','base'],['FF','base16'],['11111111','base2'],['377','base8'],['255','base10']]) {
  assert.equal(context.quickCalculate(input, operation), converted);
}
assert.match(context.quickCalculate('1010','base'), /^十进制  1010\n/);
assert.match(context.quickCalculate('1010','base2'), /^十进制  10\n/);
assert.match(context.quickCalculate('-0xFF','base'), /^十进制  -255\n二进制  -11111111\n/);
assert.match(context.quickCalculate('+0XFF','base'), /^十进制  255\n/);
assert.match(context.quickCalculate('0','base'), /^十进制  0\n二进制  0\n八进制  0\n十六进制  0$/);
assert.match(context.quickCalculate('9007199254740993','base'), /^十进制  9007199254740993\n/);
for (let n = -128; n <= 128; n++) {
  for (const radix of [2,8,10,16]) {
    const output = context.quickCalculate(n.toString(radix), 'base'+radix);
    assert.equal(output, [['十',10],['二',2],['八',8],['十六',16]].map(([label,base])=>`${label}进制  ${n.toString(base).toUpperCase()}`).join('\n'));
  }
}
for (const [input,operation] of [['102','base2'],['8','base8'],['FF','base'],['0xFF','base2'],['1.5','base'],['1e3','base'],['','base'],['0x','base'],['+','base'],['2','base3']]) {
  assert.match(context.quickCalculate(input, operation), /划选格式：/);
}
console.log('1052 base conversion checks passed');
