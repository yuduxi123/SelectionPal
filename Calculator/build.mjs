import fs from 'node:fs';
import path from 'node:path';
const dir=path.dirname(new URL(import.meta.url).pathname);
const script=['engine.js','basic-math.js','quick.js'].map(name=>fs.readFileSync(path.join(dir,name),'utf8')).join('\n');
const out=path.join(dir,'../Sources/Resources');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'QuickCalculator.js'),script);
console.log('Calculator resource generated.');
