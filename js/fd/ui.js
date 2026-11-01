/**
 * Phụ thuộc hàm – giao diện máy tính, bài học, luyện tập
 */
/* ---------- giao diện máy tính ---------- */
$('#pre').innerHTML='<option value="">(tự nhập)</option>'+PRE.map((p,i)=>`<option value="${i}">${p.split('|')[0].slice(0,40)}</option>`).join('');
$('#pre').onchange=e=>{if(e.target.value==='')return;const[,u,f,g,d]=PRE[e.target.value].split('|');$('#u').value=u;$('#f').value=f.split(';').map(x=>x.replace('->',' -> ')).join('\n');$('#g').value=(g||'').split(';').map(x=>x.replace('->',' -> ')).join('\n');$('#d').value=d||'';$('#x').value=u[0];$('#y').value=u[u.length-1]};
const CALC=[['X⁺',(U,F,X)=>rClo(U,F,X)],['X → Y ?',(U,F,X,Y)=>rImp(U,F,X,Y)],['Phân loại X',(U,F,X)=>rCls(U,F,X)],['Đầy đủ / riêng phần',(U,F,X,Y)=>rPart(U,F,X,Y)],['Tìm khoá',(U,F)=>rKeys(U,F)],['Phủ tối thiểu',(U,F)=>rMc(F)],['Dư thừa',(U,F)=>rRed(F)],['Dạng chuẩn',(U,F)=>rNf(U,F)],['F ≡ G',(U,F)=>rEq(F,parse($('#g').value))],['Kiểm tra phân rã',(U,F)=>rDec(U,F,$('#d').value)],['Phân rã 3NF',(U,F)=>rSyn(U,F)],['Thể hiện r',(U,F)=>rInst(F,$('#t').value)]];
$('#calc').innerHTML=CALC.map((c,i)=>`<button type="button" data-c="${i}">${c[0]}</button>`).join('');
$('#calc').onclick=e=>{const i=e.target.dataset.c;if(i===undefined)return;const F=parse($('#f').value);let U=N($('#u').value);F.forEach(f=>U=un(U,f.l+f.r));if(!F.length&&i!=11)return $('#res').textContent='Hãy nhập ít nhất một phụ thuộc hàm ở ô F, dạng AB -> C.';
const X=N($('#x').value),Y=N($('#y').value);if([0,1,2,3].includes(+i)&&!X)return $('#res').textContent='Hãy nhập X.';if([1,3].includes(+i)&&!Y)return $('#res').textContent='Hãy nhập Y.';
if(+i==8&&!parse($('#g').value).length)return $('#res').textContent='Hãy nhập G ở mục “G, phân rã, thể hiện r”.';
try{$('#res').textContent=CALC[i][1](U,F,X,Y)}catch(err){$('#res').textContent='Có lỗi: '+err.message}};
$('#ins').onclick=()=>{const t=$('#res').textContent;if(t&&!t.startsWith('Kết quả hiện'))ins((ed.value&&!ed.value.endsWith('\n')?'\n':'')+t+'\n')};
/* ---------- tab học ---------- */
const tab=m=>{$('#edpane').hidden=!!m;$('#learn').hidden=!m;$('#t-learn').classList.toggle('on',!!m);$('#t-ed').classList.toggle('on',!m)};
$('#t-ed').onclick=()=>tab(0);$('#t-learn').onclick=()=>tab(1);tab(0);
const PROOF='Cho F = { A → B, B → C, C → D }. Chứng minh A → CD:\n1. A → B   (thuộc F)\n2. B → C   (thuộc F)\n3. A → C   (Bắc cầu, 1 và 2)\n4. C → D   (thuộc F)\n5. A → D   (Bắc cầu, 3 và 4)\n6. A → CD  (Hợp, 3 và 5)\n';
$('#learn').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
if(d.ins){tab(0);ins((ed.value&&!ed.value.endsWith('\n')?'\n':'')+PROOF);return}
if(d.c===undefined)return;const i=PRE.findIndex(p=>p.startsWith(d.p+'|'));
if(i>=0){$('#pre').value=i;$('#pre').dispatchEvent(new Event('change'))}
if(d.f)$('#f').value=d.f.split(';').map(x=>x.replace('->',' -> ')).join('\n');
if(d.x!==undefined)$('#x').value=d.x;if(d.y!==undefined)$('#y').value=d.y;
document.querySelector(`#calc [data-c="${d.c}"]`).click();$('#res').scrollIntoView({block:'nearest',behavior:'smooth'})});
/* ---------- luyện tập ---------- */
const rnd=n=>Math.floor(Math.random()*n),pick=a=>a[rnd(a.length)];let PQ=null;
function genF(n){const U='ABCDEFG'.slice(0,n);for(;;){const F=[],m=3+rnd(3);while(F.length<m){const l=N(Array.from({length:1+rnd(2)},()=>pick(U)).join('')),r=mi(N(Array.from({length:1+(rnd(3)==0)},()=>pick(U)).join('')),l);if(r&&!F.some(f=>f.l==l&&f.r==r))F.push({l,r})}const K=keys(U,F);if(K.length<=3&&K[0].length<n)return{U,F}}}
function pnew(){const t=$('#pt').value,{U,F}=genF(+$('#pn').value),X=N(Array.from({length:1+rnd(2)},()=>pick(U)).join(''));PQ={t,U,F,X,Y:''};
if(t=='imp'){const c=clo(X,F),y=mi(c,X),z=mi(U,c),pool=(rnd(2)&&y)?y:(z||y);PQ.Y=pick([...pool])}
const q={cl:`Tính ${X}⁺.`,key:'Tìm tất cả khoá của R (cách nhau bằng dấu phẩy).',imp:`F có suy ra ${X} → ${PQ.Y} không?`,nf:'Dạng chuẩn cao nhất của R là gì?'}[t];
$('#pq').innerHTML=`R(${[...U].join(', ')}), F = ${fsx(F)}<br>${q}`;
$('#pa').innerHTML=t=='imp'?'<select id="pv"><option value="">Chọn…</option><option value="y">Có</option><option value="n">Không</option></select>':t=='nf'?'<select id="pv"><option value="">Chọn…</option><option>1NF</option><option>2NF</option><option>3NF</option><option>BCNF</option></select>':'<input id="pv" style="max-width:300px" placeholder="'+(t=='cl'?'ví dụ ABD':'ví dụ AB, CD')+'">';
$('#pb').hidden=false;$('#pm').textContent='';$('#ps').hidden=true}
$('#pnew').onclick=pnew;
$('#pchk').onclick=()=>{if(!PQ)return;const{t,U,F,X,Y}=PQ,v=$('#pv').value;if(!v.trim())return $('#pm').textContent='Hãy nhập hoặc chọn đáp án trước.';let ok=0,m='';
if(t=='cl'){const c=clo(X,F);ok=N(v)==c;m=ok?`Đúng, ${X}⁺ = ${c}.`:'Chưa đúng. Thử lại: thêm vế phải của phụ thuộc có vế trái nằm trọn trong tập hiện tại.'}
if(t=='key'){const K=keys(U,F),u=[...new Set(v.split(/[,;\s]+/).map(N).filter(Boolean))].sort();ok=u.join()==K.slice().sort().join();m=ok?`Đúng, các khoá: ${K.join(', ')}.`:`Chưa đúng${u.some(x=>!K.includes(x))?': có tập không phải khoá dự tuyển':': còn thiếu khoá'}.`}
if(t=='imp'){const c=clo(X,F),r=sub(Y,c);ok=(v=='y')==r;m=(ok?'Đúng. ':'Chưa đúng. ')+`${X}⁺ = ${c}, nên ${Y} ${r?'⊆':'⊄'} ${X}⁺.`}
if(t=='nf'){const r=nfa(U,F).lvl;ok=v==r;m=ok?`Đúng, R đạt ${r}.`:'Chưa đúng. Tìm khoá trước, rồi xét BCNF, 3NF, 2NF theo thứ tự.'}
$('#pm').textContent=m};
$('#psol').onclick=()=>{if(!PQ)return;const{t,U,F,X,Y}=PQ;$('#ps').textContent={cl:()=>rClo(U,F,X),key:()=>rKeys(U,F),imp:()=>rImp(U,F,X,Y),nf:()=>rNf(U,F)}[t]();$('#ps').hidden=false};
$('#cpr').onclick=()=>navigator.clipboard.writeText($('#res').textContent).then(()=>{$('#cpr').textContent='Đã copy';setTimeout(()=>$('#cpr').textContent='Copy kết quả',1200)});
