function quickCalculate(input, operation) {
  const examples = {expression:'2^128 或 (3+5)/2',gcd:'540,144',lcm:'540,144',mod:'-12,7',pow:'17,170,13 或 17^170 mod 13',inv:'79,3220'};
  try {
    let text = input.trim().replace(/，/g,',').replace(/[−–]/g,'-');
    if (text.length > 2000) throw Error('选中内容过长');
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
  } catch(error) { return error.message+'\n划选格式：'+(examples[operation] || examples.expression); }
}
