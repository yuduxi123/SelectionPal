function quickCalculate(input, operation) {
  const examples = {expression:'2^128 或 (3+5)/2',gcd:'540,144',lcm:'540,144',mod:'-12,7',pow:'17,170,13 或 17^170 mod 13',inv:'79,3220',base:'255、0b11111111、0o377、0xFF（仅整数）'};
  try {
    let text = input.trim().replace(/，/g,',').replace(/[−–]/g,'-');
    if (text.length > 2000) throw Error('选中内容过长');
    if (operation.startsWith('base')) {
      const match = text.match(/^([+-]?)(?:(0[bBoOxX]))?([0-9a-fA-F]+)$/);
      if (!match) throw Error('请输入整数；二/八/十六进制可加 0b/0o/0x 前缀');
      const prefixBase = match[2] ? {b:2,o:8,x:16}[match[2][1].toLowerCase()] : null;
      const base = operation === 'base' ? (prefixBase || 10) : Number(operation.slice(4));
      if (![2,8,10,16].includes(base)) throw Error('不支持的进制');
      if (prefixBase && prefixBase !== base) throw Error('数字前缀与所选进制不一致');
      let value = 0n;
      for (const digit of match[3].toLowerCase()) {
        const n = parseInt(digit,16);
        if (n >= base) throw Error(`${base} 进制中不能使用 ${digit.toUpperCase()}`);
        value = value * BigInt(base) + BigInt(n);
      }
      if (match[1] === '-') value = -value;
      return [['十',10],['二',2],['八',8],['十六',16]].map(([label,radix]) => `${label}进制  ${value.toString(radix).toUpperCase()}`).join('\n');
    }
    if (operation === 'expression') return BasicMath.show(BasicMath.expression(text.replace(/\bmod\b/gi,'%')));
    if (operation === 'pow') {
      const match = text.match(/^(.+?)\^\s*(\d+)\s+mod\s+(.+)$/i);
      if (match) text = match.slice(1).join(',');
    }
    text = text.replace(/^(?:gcd|lcm|pow|inv|mod)\s*\((.*)\)$/i,'$1');
    const values = text.split(/[,;\s]+/).filter(Boolean).map(value => Calc.int(value));
    if(values.length !== (operation === 'pow' ? 3 : 2)) throw Error('参数数量不对');
    const [a,b,c] = values;
    if(operation==='gcd') return String(Calc.gcd(a,b));
    if(operation==='lcm') { const n=a===0n||b===0n?0n:a/Calc.gcd(a,b)*b; return String(n<0n?-n:n); }
    if(operation==='mod') return String(Calc.mod(a,b));
    if(operation==='pow') return String(Calc.pow(a,b,c));
    if(operation==='inv') return String(Calc.inv(a,b));
    throw Error('未知计算项');
  } catch(error) { return error.message+'\n划选格式：'+(examples[operation.startsWith('base') ? 'base' : operation] || examples.expression); }
}
