'use strict';
const Calc = (() => {
  const fail = s => { throw Error(s); };
  function int(s) {
    s=String(s).trim().replace(/[,_\s]/g,'');
    if (!s) fail('请输入整数');
    if (s.length>20000) fail('输入数字过长');
    if (/^[+-]?\d+\^\d+$/.test(s)) {const [a,b]=s.split('^'); const e=BigInt(b); if(e>16384n) fail('指数不能超过 16384'); return BigInt(a)**e;}
    if (/^[+]?\d+[eE][+]?\d+$/.test(s)) {const [a,b]=s.split(/[eE]/); if(Number(b)>5000) fail('数量过大'); return BigInt(a)*10n**BigInt(b);}
    if(!/^[+-]?\d+$/.test(s)&&!/^0[xX][0-9a-fA-F]+$/.test(s)&&!/^0[bB][01]+$/.test(s)) fail('请输入整数、0x 十六进制、0b 二进制、2^128 或 1e6');
    return BigInt(s);
  }
  const mod=(a,n)=>{if(n<=0n)fail('模数必须为正');return (a%n+n)%n;};
  function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a;}
  function egcd(a,b){let oldr=a,r=b,olds=1n,s=0n,oldt=0n,t=1n;const steps=[];
    while(r){const q=oldr/r;steps.push(`${oldr} = (${q}) × (${r}) + (${oldr-q*r})`);[oldr,r]=[r,oldr-q*r];[olds,s]=[s,olds-q*s];[oldt,t]=[t,oldt-q*t];}
    if(oldr<0n){oldr=-oldr;olds=-olds;oldt=-oldt;}return {g:oldr,x:olds,y:oldt,steps};}
  function inv(a,n){if(n<2n)fail('求逆元的模数至少为 2');const z=egcd(mod(a,n),n);if(z.g!==1n)fail(`逆元不存在：gcd(${a}, ${n}) = ${z.g}`);return mod(z.x,n);}
  function pow(a,e,n,trace=false){if(n<1n)fail('模数必须为正');if(e<0n){a=inv(a,n);e=-e;}if(e.toString(2).length>16384)fail('指数超过 16384 位');a=mod(a,n);let z=1n%n;const steps=[];
    for(const bit of e.toString(2)){const prev=z;z=z*z%n;let line=`位 ${bit}：${prev}² mod ${n} = ${z}`;if(bit==='1'){const v=z;z=z*a%n;line+=`；${v} × ${a} mod ${n} = ${z}`;}if(trace&&steps.length<512)steps.push(line);}
    if(trace&&e.toString(2).length>512)steps.push('过程仅显示前 512 位；结果包含完整运算。');return trace?{value:z,steps}:z;
  }
  function factors(n){if(n<1n)fail('分解与 φ 的输入必须大于 0');let rest=n;const fs=[];let trials=0;
    for(let p=2n;p*p<=rest;p+=(p===2n?1n:2n)){if(++trials>250000)fail('试除超过上限；请提供已知素因子，不自动分解大 RSA 模数');if(rest%p===0n){let e=0;while(rest%p===0n){rest/=p;e++;}fs.push([p,e]);}}
    if(rest>1n)fs.push([rest,1]);return fs;}
  function prime(n){if(n<2n)return false;for(const p of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){if(n===p)return true;if(n%p===0n)return false;}
    let d=n-1n,s=0;while(d%2n===0n){d/=2n;s++;}
    const bases=n<18446744073709551616n?[2n,325n,9375n,28178n,450775n,9780504n,1795265022n]:[2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
    for(let a of bases){a%=n;if(a===0n)continue;let x=pow(a,d,n);if(x===1n||x===n-1n)continue;let ok=false;for(let j=1;j<s;j++){x=x*x%n;if(x===n-1n){ok=true;break;}}if(!ok)return false;}return true;}
  function factorText(fs){return fs.map(([p,e])=>`${p}${e===1?'':'^'+e}`).join(' × ')||'1';}
  function phi(n){let v=n;for(const [p]of factors(n))v=v/p*(p-1n);return v;}
  function sci(n){if(n===0n)return '0';const neg=n<0n;n=neg?-n:n;const s=n.toString();return (neg?'-':'')+(Number(s.slice(0,15))/10**(Math.min(s.length,15)-1)).toFixed(6)+' × 10^'+(s.length-1);}
  function ratio(a,b){if(b<=0n)fail('分母必须大于 0');const v=a*1000000n/b;return `${v/1000000n}.${(v%1000000n).toString().padStart(6,'0')}`;}
  function log2(n){const s=n.toString(2);return s.length-1+Math.log2(Number(BigInt('0b'+s.slice(0,53)))/2**(Math.min(s.length,53)-1));}
  function factorial(n){if(n<0n||n>1000n)fail('阶乘范围为 0–1000');let r=1n;for(let i=2n;i<=n;i++)r*=i;return r;}
  function rsa({p,q,e,m,c,d}){p=int(p);q=int(q);e=int(e);if(!prime(p)||!prime(q)||p===q)fail('p、q 必须是两个不同素数');if(e<=1n)fail('e 必须大于 1');const n=p*q,ph=(p-1n)*(q-1n),priv=inv(e,ph);let lines=[`n = p × q = ${n}`,`φ(n) = (p−1)(q−1) = ${ph}`,`gcd(e, φ(n)) = ${gcd(e,ph)}`,`d = e⁻¹ mod φ(n) = ${priv}`,`公钥 (n,e) = (${n}, ${e})`,`私钥指数 d = ${priv}`,`检验 e·d mod φ(n) = ${e*priv%ph}`];
    if(String(m).trim()){m=int(m);if(m<0n||m>=n)fail('RSA 消息必须满足 0 ≤ M < n');const C=pow(m,e,n);lines.push(`加密 C = ${m}^${e} mod ${n} = ${C}`,`回解 M = ${C}^${priv} mod ${n} = ${pow(C,priv,n)}`);}
    if(String(c||'').trim()){c=int(c);if(c<0n||c>=n)fail('密文必须满足 0 ≤ C < n');lines.push(`给定密文解密 = ${pow(c,priv,n)}`);}lines.push('素性检查：64 位以内确定性；更大的数使用概率素性检查。');return lines;}
  function rsaDirect({n,e,d,m,c}){n=int(n);if(n<2n)fail('n 必须大于 1');const lines=[];if(String(m).trim()){e=int(e);if(e<=0n)fail('e 必须为正');m=int(m);if(m<0n||m>=n)fail('0 ≤ M < n');lines.push(`C = M^e mod n = ${pow(m,e,n)}`);}if(String(c).trim()){d=int(d);if(d<=0n)fail('d 必须为正');c=int(c);if(c<0n||c>=n)fail('0 ≤ C < n');lines.push(`M = C^d mod n = ${pow(c,d,n)}`);}if(!lines.length)fail('至少填写明文或密文');return lines;}
  function elgamal(v){let p=int(v.p),g=int(v.g),x=int(v.x);if(!prime(p)||p<5n)fail('p 必须是至少为 5 的素数');if(g<=1n||g>=p||x<1n||x>=p-1n)fail('要求 1 < g < p，1 ≤ x < p−1');const y=pow(g,x,p),lines=[`公钥 y = g^x mod p = ${y}`];if(v.r.trim()&&v.m.trim()){const r=int(v.r),m=int(v.m);if(r<1n||r>=p-1n||m<1n||m>=p)fail('要求 1 ≤ r < p−1，1 ≤ M < p');const A=pow(g,r,p),S=pow(y,r,p),B=m*S%p;lines.push(`A = g^r mod p = ${A}`,`S = y^r mod p = ${S}`,`B = M × S mod p = ${B}`,`密文 (A,B) = (${A}, ${B})`,`解密 S = A^x mod p = ${pow(A,x,p)}`,`S⁻¹ mod p = ${inv(S,p)}`,`还原 M = B × S⁻¹ mod p = ${B*inv(S,p)%p}`);}
    if(v.A.trim()&&v.B.trim()){const A=int(v.A),B=int(v.B);if(A<1n||A>=p||B<1n||B>=p)fail('密文分量需在 1 到 p−1 之间');const S=pow(A,x,p);lines.push(`给定密文的 S = ${S}`,`S⁻¹ = ${inv(S,p)}`,`明文 M = ${B*inv(S,p)%p}`);}if(lines.length===1)fail('填写 r、M 以加密，或 A、B 以解密');lines.push('教学计算：未证明 g 为生成元；可用「阶与离散对数」模块检查。');return lines;}
  const letters=s=>s.toUpperCase().replace(/[^A-Z]/g,'');
  function classical(text,key,kind,dec=false){let k;if(kind==='caesar'){k=[Number(mod(int(key),26n))];}else{k=[...letters(key)].map(x=>x.charCodeAt(0)-65);if(!k.length)fail('密钥至少含一个英文字母');}let i=0;return text.replace(/[a-z]/gi,c=>{let v=(c.toUpperCase().charCodeAt(0)-65+(dec?-1:1)*k[i++%k.length]+26)%26;return String.fromCharCode(65+v);});}
  function substitute(text,table,dec=false,keyword=false){let t=letters(table);if(keyword)t=[...new Set(t+'ABCDEFGHIJKLMNOPQRSTUVWXYZ')].join('');if(t.length!==26||new Set(t).size!==26)fail('替换表必须包含 A–Z 各一次（26 个不同字母）');const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ';return {table:t,value:text.replace(/[a-z]/gi,c=>dec?a[t.indexOf(c.toUpperCase())]:t[c.toUpperCase().charCodeAt(0)-65])};}
  function kasiski(text,min=3,max=5){text=letters(text);if(text.length>20000)fail('文本上限 20000 字母');const lines=[],votes=new Map();let total=0;for(let len=min;len<=max;len++){const map=new Map();for(let i=0;i<=text.length-len;i++){let t=text.slice(i,i+len);if(!map.has(t))map.set(t,[]);map.get(t).push(i);}for(const [t,pos]of map){if(pos.length<2)continue;for(let i=1;i<pos.length;i++){if(++total>3000)break;const d=pos[i]-pos[i-1];lines.push(`${t}：位置 ${pos[i-1]+1} → ${pos[i]+1}；距离 ${d}`);for(let f=2;f<=Math.min(d,64);f++)if(d%f===0)votes.set(f,(votes.get(f)||0)+1);}if(total>3000)break;}if(total>3000)break;}
    return ['候选因子（2–64）：'+([...votes].sort((a,b)=>b[1]-a[1]||b[0]-a[0]).map(([f,n])=>`${f}（${n}票）`).join('、')||'无'), '候选不是确定答案；偶然重复可能干扰结果。',...lines.slice(0,150),...(lines.length>150?['仅显示前 150 条重复记录。']:[])];}
  function parseBytes(s,mode){if(mode==='text')return [...new TextEncoder().encode(s)];if(mode==='ap'){if(/[^A-P\s]/i.test(s))fail('4 位字母编码仅允许 A–P');return [...s.toUpperCase().replace(/\s/g,'')].map(c=>c.charCodeAt(0)-65);}let t=s.replace(/0x/gi,'').replace(/[\s,:_-]/g,'');if(mode==='bin'){if(!/^[01]+$/.test(t)||t.length%8)fail('二进制需为完整字节：每 8 位一组');return t.match(/.{8}/g).map(x=>parseInt(x,2));}if(!/^[0-9a-f]*$/i.test(t)||t.length%2)fail('十六进制需每字节两位，如 87 6E 46 A6');return (t.match(/.{2}/g)||[]).map(x=>parseInt(x,16));}
  const hex=a=>a.map(v=>v.toString(16).toUpperCase().padStart(2,'0')).join(' ');
  function byteOutput(a,mode){return [`HEX：${hex(a)}`,`BIN：${a.map(v=>v.toString(2).padStart(mode==='ap'?4:8,'0')).join(' ')}`,mode==='ap'?`A–P：${a.map(v=>String.fromCharCode(65+v)).join('')}`:`UTF-8：${new TextDecoder().decode(Uint8Array.from(a))}`];}
  function xor(a,b){if(a.length!==b.length||!a.length)fail('两个输入必须非空且等长；密钥不自动循环');return a.map((x,i)=>x^b[i]);}
  function gfMul(a,b,n=8,poly=0x11b){let r=0;while(b){if(b&1)r^=a;b>>>=1;a<<=1;if(a&(1<<n))a^=poly;}return r&((1<<n)-1);}
  function gfPow(a,e,n=8,poly=0x11b){let z=1;while(e){if(e&1)z=gfMul(z,a,n,poly);a=gfMul(a,a,n,poly);e>>>=1;}return z;}
  const rot=(x,n)=>((x<<n)|(x>>(8-n)))&255;
  const S=Array.from({length:256},(_,a)=>{let x=a?gfPow(a,254):0;return x^rot(x,1)^rot(x,2)^rot(x,3)^rot(x,4)^0x63;});
  const IS=Array(256);S.forEach((v,i)=>IS[v]=i);
  function shift(a,reverse=false){const o=a.slice();for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[4*c+r]=a[4*((c+(reverse?4-r:r))%4)+r];return o;}
  function mix(a,reverse=false){if(a.length!==4&&a.length!==16)fail('MixColumns 需要 4 字节（一列）或 16 字节（四列）');const matrix=reverse?[[14,11,13,9],[9,14,11,13],[13,9,14,11],[11,13,9,14]]:[[2,3,1,1],[1,2,3,1],[1,1,2,3],[3,1,1,2]];const o=[];for(let c=0;c<a.length;c+=4)for(let r=0;r<4;r++)o.push(matrix[r].reduce((s,m,k)=>s^gfMul(m,a[c+k]),0));return o;}
  function expand(key){if(![16,24,32].includes(key.length))fail('AES 密钥需 16、24 或 32 字节');const nk=key.length/4,nr=nk+6,w=[];for(let i=0;i<nk;i++)w.push(key.slice(4*i,4*i+4));let rc=1;for(let i=nk;i<4*(nr+1);i++){let t=w[i-1].slice();if(i%nk===0){t.push(t.shift());t=t.map(v=>S[v]);t[0]^=rc;rc=gfMul(rc,2);}else if(nk>6&&i%nk===4)t=t.map(v=>S[v]);w.push(t.map((v,j)=>v^w[i-nk][j]));}return {nr,keys:Array.from({length:nr+1},(_,i)=>w.slice(4*i,4*i+4).flat())};}
  function aes(data,key,dec=false){if(data.length!==16)fail('AES 单块输入恰好 16 字节；本模块不自动填充');const {nr,keys}=expand(key);let st=data.slice();const trace=[];if(!dec){st=xor(st,keys[0]);trace.push(`初始 AddRoundKey：${hex(st)}`);for(let r=1;r<=nr;r++){st=shift(st.map(v=>S[v]));if(r!==nr)st=mix(st);st=xor(st,keys[r]);trace.push(`第 ${r} 轮：${hex(st)}`);}}else{st=xor(st,keys[nr]);trace.push(`初始 AddRoundKey：${hex(st)}`);for(let r=nr-1;r>=0;r--){st=shift(st,true).map(v=>IS[v]);st=xor(st,keys[r]);if(r!==0)st=mix(st,true);trace.push(`逆轮 ${r}：${hex(st)}`);}}return {value:st,trace,keys,nr};}
  function matrix(a){if(a.length!==16)fail('状态矩阵需 16 字节');return Array.from({length:4},(_,r)=>[0,1,2,3].map(c=>hex([a[4*c+r]])).join(' ')).join('\n');}
  function rc4(key,size,count,drop=0){if(size<2||size>256||!Number.isInteger(size))fail('状态大小需 2–256');if(count<1||count>512||drop<0||drop>4096)fail('输出 1–512 字节，丢弃 0–4096 字节');if(!key.length||key.some(x=>x<0||x>=size))fail('密钥值需落在 0 到状态大小−1 之间');const state=Array.from({length:size},(_,i)=>i),ksa=[];let j=0;for(let i=0;i<size;i++){j=(j+state[i]+key[i%key.length])%size;[state[i],state[j]]=[state[j],state[i]];if(ksa.length<32)ksa.push(`i=${i}, j=${j}；S=[${state.join(',')}]`);}let i=0;j=0;const out=[],trace=[];for(let k=0;k<drop+count;k++){i=(i+1)%size;j=(j+state[i])%size;[state[i],state[j]]=[state[j],state[i]];const t=(state[i]+state[j])%size,v=state[t];if(k>=drop){out.push(v);if(trace.length<64)trace.push(`输出 ${k-drop+1}：i=${i}, j=${j}, t=${t}, S[t]=${v}`);}}return {out,trace,ksa};}
  function dlog(p,g,y,limit){if(p<2n||g<=0n||g>=p||y<=0n||y>=p)fail('要求 p > 1，0 < g,y < p');if(gcd(g,p)!==1n)fail('g 必须与 p 互素');let v=1n,found=null,order=null;const trace=[];for(let e=0;e<=limit;e++){if(v===y&&found===null)found=e;if(e&&v===1n){order=e;break;}if(e<64)trace.push(`${g}^${e} mod ${p} = ${v}`);v=v*g%p;}return {found,order,trace};}
  return {fail,int,mod,gcd,egcd,inv,pow,factors,prime,phi,factorText,sci,ratio,log2,factorial,rsa,rsaDirect,elgamal,classical,substitute,kasiski,parseBytes,hex,byteOutput,xor,gfMul,gfPow,S,IS,shift,mix,expand,aes,matrix,rc4,dlog};
})();
if(typeof module!=='undefined')module.exports=Calc;
