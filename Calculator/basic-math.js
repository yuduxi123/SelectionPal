'use strict';
const BasicMath=(()=>{
 const C=typeof Calc!=='undefined'?Calc:require('./engine.js');
 const abs=n=>n<0n?-n:n;
 function rational(n,d=1n){if(d===0n)C.fail('不能除以 0');if(d<0n){n=-n;d=-d;}const g=C.gcd(n,d);return {n:n/g,d:d/g};}
 function decimal(s){const [a,b='']=s.split('.');return rational(BigInt((a||'0')+b),10n**BigInt(b.length));}
 function guard(x){if(abs(x.n).toString(2).length>65536||x.d.toString(2).length>65536)C.fail('精确结果超过 65536 位上限');return x;}
 function power(a,e){if(abs(e)>16384n)C.fail('整数指数绝对值不能超过 16384');if(a.n===0n&&e<=0n)C.fail(e===0n?'0^0 未定义':'0 不能取负指数');if(e<0n){a=rational(a.d,a.n);e=-e;}if(Math.max(abs(a.n).toString(2).length,a.d.toString(2).length)*Number(e)>65536)C.fail('幂结果过长，请改用模幂');return guard(rational(a.n**e,a.d**e));}
 const show=x=>x.d===1n?String(x.n):`${x.n}/${x.d}`;
 function approximation(x){let n=abs(x.n),whole=n/x.d,r=n%x.d,ds='';for(let i=0;i<24&&r;i++){r*=10n;ds+=String(r/x.d);r%=x.d;}return (x.n<0n?'-':'')+whole+(ds?'.'+ds:'')+(r?'…':'');}
 function expression(input){let source=input.replace(/×/g,'*').replace(/[÷]/g,'/').replace(/[−–]/g,'-').replace(/\*\*/g,'^');if(source.length>2000)C.fail('表达式最多 2000 字符');const tokens=[];let i=0;while(i<source.length){if(/\s/.test(source[i])){i++;continue;}const m=source.slice(i).match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/);if(m){tokens.push(m[0]);i+=m[0].length;}else if(/[()+*/^%-]/.test(source[i]))tokens.push(source[i++]);else C.fail('不支持的符号：'+source[i]);}let pos=0;
 function atom(){if(tokens[pos]==='('){pos++;const x=add();if(tokens[pos++]!==')')C.fail('括号不匹配');return x;}const t=tokens[pos++];if(!t||!/^\d|^\./.test(t))C.fail('缺少数字');if(/^0[xb]/i.test(t))return rational(C.int(t));if(/[eE]/.test(t)){const [m,e]=t.split(/[eE]/);const k=Number(e);if(Math.abs(k)>4096)C.fail('科学计数指数过大');const z=decimal(m);return k>=0?rational(z.n*10n**BigInt(k),z.d):rational(z.n,z.d*10n**BigInt(-k));}return decimal(t);}
 function pow(){let a=atom();if(tokens[pos]==='^'){pos++;const e=unary();if(e.d!==1n)C.fail('精确幂运算只支持整数指数；开根请用专门工具');a=power(a,e.n);}return a;}
 function unary(){if(tokens[pos]==='+'){pos++;return unary();}if(tokens[pos]==='-'){pos++;const x=unary();return rational(-x.n,x.d);}return pow();}
 function multiply(){let a=unary();while(['*','/','%'].includes(tokens[pos])){const op=tokens[pos++],b=unary();if(op==='*')a=guard(rational(a.n*b.n,a.d*b.d));else if(op==='/')a=guard(rational(a.n*b.d,a.d*b.n));else{if(a.d!==1n||b.d!==1n)C.fail('取模的两个数必须为整数');a=rational(C.mod(a.n,b.n));}}return a;}
 function add(){let a=multiply();while(['+','-'].includes(tokens[pos])){const op=tokens[pos++],b=multiply();a=guard(rational(a.n*b.d+(op==='+'?1n:-1n)*b.n*a.d,a.d*b.d));}return a;}
 if(!tokens.length)C.fail('请输入表达式');const value=add();if(pos!==tokens.length)C.fail('表达式未完整解析；乘法请明确写 *');return value;}
 function root(n,k){if(k<2||k>4096)C.fail('根次数需在 2–4096 之间');if(n<0n&&k%2===0)C.fail('负数没有实数偶次根');const negative=n<0n;n=abs(n);if(n.toString(2).length>16384)C.fail('被开方数超过 16384 位');let lo=0n,hi=1n<<BigInt(Math.ceil(n.toString(2).length/k)+1);while(lo+1n<hi){const m=(lo+hi)/2n;if(m**BigInt(k)<=n)lo=m;else hi=m;}const rem=n-lo**BigInt(k);return {root:negative?-lo:lo,remainder:rem,exact:rem===0n};}
 function choose(n,k){if(n<0n||k<0n||k>n||n>10000n)C.fail('要求 0 ≤ k ≤ n ≤ 10000');if(k>n-k)k=n-k;let r=1n;for(let i=1n;i<=k;i++)r=r*(n-i+1n)/i;return r;}
 function permute(n,k){if(n<0n||k<0n||k>n||n>10000n)C.fail('要求 0 ≤ k ≤ n ≤ 10000');let r=1n;for(let i=0n;i<k;i++)r*=n-i;return r;}
 function log(n,base){if(n<=0n||base<=0n||base===1n)C.fail('要求真数 > 0，底数 > 0 且不为 1');return C.log2(n)/C.log2(base);}
 return {rational,power,expression,show,approximation,root,choose,permute,log};
})();
if(typeof module!=='undefined')module.exports=BasicMath;
