/**
 * Phụ thuộc hàm – thuật toán thuần (bao đóng, khoá, phủ tối thiểu, dạng chuẩn, chase, bảo toàn)
 */
/* ---------- thuật toán ---------- */
const N=s=>[...new Set(String(s).toUpperCase().replace(/[^A-Z]/g,''))].sort().join('');
const sub=(a,b)=>[...a].every(c=>b.includes(c)),un=(a,b)=>N(a+b),mi=(a,b)=>[...a].filter(c=>!b.includes(c)).join('');
const fd=f=>f.l+' → '+f.r,fsx=F=>'{ '+F.map(fd).join('; ')+' }';
function parse(t){return t.replace(/[{}]/g,'').split(/[\n;,]+/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split(/->|→|=>/);return p.length==2?{l:N(p[0]),r:N(p[1])}:null}).filter(f=>f&&f.l&&f.r)}
function clo(X,F,tr){let c=N(X),ch=1;while(ch){ch=0;for(const f of F)if(sub(f.l,c)&&!sub(f.r,c)){if(tr)tr.push(`  ${fd(f)}: ${f.l} ⊆ ${c}, thêm ${mi(f.r,c)} ⇒ ${un(c,f.r)}`);c=un(c,f.r);ch=1}}return c}
const subsets=U=>{const o=[];for(let m=1;m<1<<U.length;m++)o.push([...U].filter((_,i)=>m>>i&1).join(''));return o.sort((a,b)=>a.length-b.length||(a<b?-1:1))};
const keys=(U,F)=>{const sk=subsets(U).filter(s=>clo(s,F)==U);return sk.filter(k=>!sk.some(o=>o!=k&&sub(o,k)))};
const split=F=>{const G=[];F.forEach(f=>[...f.r].forEach(a=>{if(!sub(a,f.l)&&!G.some(g=>g.l==f.l&&g.r==a))G.push({l:f.l,r:a})}));return G};
const merge=G=>{const g={};G.forEach(f=>g[f.l]=un(g[f.l]||'',f.r));return Object.entries(g).map(([l,r])=>({l,r}))};
function mincover(F){const log=[];let G=split(F);log.push('Bước 1, tách vế phải: '+fsx(G));
G=G.map(f=>{let l=f.l;for(const a of f.l)if(l.length>1){const t=mi(l,a);if(sub(f.r,clo(t,G))){log.push(`  ${fd(f)}: bỏ ${a}, vì ${f.r} ∈ (${t})⁺`);l=t}}return{l,r:f.r}});
G=G.filter((f,i)=>G.findIndex(g=>g.l==f.l&&g.r==f.r)==i);log.push('Bước 2, rút gọn vế trái: '+fsx(G));
for(let i=0;i<G.length;){const R=G.filter((_,j)=>j!=i);if(sub(G[i].r,clo(G[i].l,R))){log.push(`  bỏ ${fd(G[i])}, vì suy ra từ các phụ thuộc còn lại`);G=R}else i++}
log.push('Bước 3, loại phụ thuộc dư thừa: '+fsx(G));return{G,log}}
function nfa(U,F){const K=keys(U,F),Pm=N(K.join('')),G=split(F),bc=G.filter(f=>clo(f.l,F)!=U),t3=bc.filter(f=>!Pm.includes(f.r)),part=[];
K.forEach(k=>subsets(k).filter(s=>s!=k).forEach(s=>{const c=mi(clo(s,F),s);[...mi(U,Pm)].forEach(a=>{if(c.includes(a))part.push(`${s} → ${a} (${s} ⊂ khoá ${k}, ${a} không thuộc khoá)`)})}));
return{K,Pm,bc,t3,part,lvl:!bc.length?'BCNF':!t3.length?'3NF':!part.length?'2NF':'1NF'}}
const proj=(R,F)=>merge(mincover(subsets(R).map(s=>({l:s,r:N([...mi(clo(s,F),s)].filter(a=>R.includes(a)).join(''))})).filter(f=>f.r)).G);
function chase(U,rels,F){const c=[...U],T=rels.map((R,i)=>c.map(a=>R.includes(a)?'a'+a:'b'+i+a));let ch=1;
while(ch){ch=0;for(const f of F){const L=[...f.l].map(a=>c.indexOf(a)),Rr=[...f.r].map(a=>c.indexOf(a)),gp={};T.forEach(t=>{(gp[L.map(i=>t[i]).join('|')]=gp[L.map(i=>t[i]).join('|')]||[]).push(t)});
for(const g of Object.values(gp))if(g.length>1)for(const k of Rr){const vs=g.map(t=>t[k]),to=vs.find(v=>v[0]=='a')||vs.slice().sort()[0];g.forEach(t=>{if(t[k]!=to){const o=t[k];T.forEach(u=>{if(u[k]==o)u[k]=to});ch=1}})}}}
return{T,c,ok:T.some(t=>t.every(v=>v[0]=='a'))}}
const preserved=(F,rels)=>F.map(f=>{let Z=f.l,ch=1;while(ch){ch=0;rels.forEach(R=>{const n=un(Z,[...clo(N([...Z].filter(a=>R.includes(a)).join('')),F)].filter(a=>R.includes(a)).join(''));if(n!=Z){Z=n;ch=1}})}return{f,ok:sub(f.r,Z)}});
