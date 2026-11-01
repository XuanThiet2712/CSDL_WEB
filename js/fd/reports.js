/**
 * Phụ thuộc hàm – sinh lời giải từng bước dạng văn bản
 */
/* ---------- báo cáo (văn bản chèn được vào bài) ---------- */
const L=a=>a.join('\n');
function rClo(U,F,X){const tr=[],c=clo(X,F,tr);return L([`Tính ${X}⁺ theo F = ${fsx(F)}`,`${X}⁺ = ${X}`,...tr,`Vậy ${X}⁺ = ${c}${c==U?` = R, nên ${X} là siêu khoá`:''}.`])}
function rImp(U,F,X,Y){const tr=[],c=clo(X,F,tr),ok=sub(Y,c);return L([`Kiểm tra ${X} → ${Y} bằng bao đóng:`,`${X}⁺ = ${X}`,...tr,`${X}⁺ = ${c}; ${Y} ${ok?'⊆':'⊄'} ${X}⁺ ⇒ ${X} → ${Y} ${ok?'∈ F⁺ (được suy ra)':'∉ F⁺ (không suy ra)'}.`])}
function rCls(U,F,X){const c=clo(X,F),sk=c==U,o=[`${X}⁺ = ${c}`];if(!sk)return L([...o,`${X}⁺ ≠ R ⇒ ${X} không phải siêu khoá.`]);o.push(`${X}⁺ = R ⇒ ${X} là siêu khoá.`);const bad=[...X].filter(a=>clo(mi(X,a),F)==U);if(X.length>1)[...X].forEach(a=>o.push(`  (${mi(X,a)})⁺ = ${clo(mi(X,a),F)}${clo(mi(X,a),F)==U?' = R':' ≠ R'}`));
o.push(bad.length?`Bỏ được ${bad.join(', ')} mà vẫn là siêu khoá ⇒ siêu khoá không tối thiểu (không phải khoá dự tuyển).`:`Không bỏ được thuộc tính nào ⇒ ${X} là khoá dự tuyển.`);return L(o)}
function rPart(U,F,X,Y){const o=[`Xét ${X} → ${Y}`];const t=sub(Y,clo(X,F));o.push(`${X}⁺ = ${clo(X,F)} ⇒ ${t?'phụ thuộc này được suy ra từ F':'phụ thuộc này KHÔNG suy ra từ F'}.`);if(!t)return L(o);
[...mi(Y,X)].forEach(a=>{const ps=subsets(X).filter(s=>s!=X&&sub(a,clo(s,F)));o.push(ps.length?`${a}: ${ps[0]}⁺ = ${clo(ps[0],F)} ∋ ${a}, có tập con thực sự của ${X} xác định ${a} ⇒ phụ thuộc RIÊNG PHẦN.`:`${a}: không có tập con thực sự nào của ${X} xác định ${a} ⇒ phụ thuộc ĐẦY ĐỦ.`)});return L(o)}
function rKeys(U,F){const Ls=[...U].filter(a=>!F.some(f=>f.r.includes(a))).join(''),no=[...U].filter(a=>F.some(f=>f.r.includes(a))&&!F.some(f=>f.l.includes(a))).join(''),K=keys(U,F),o=[];
o.push(`Thuộc tính không xuất hiện ở vế phải: ${Ls||'không có'} ${Ls?'⇒ bắt buộc có trong mọi khoá.':''}`);o.push(`Thuộc tính chỉ xuất hiện ở vế phải: ${no||'không có'} ${no?'⇒ không thuộc khoá nào.':''}`);
if(Ls&&clo(Ls,F)==U)o.push(`${Ls}⁺ = ${U} = R ⇒ ${Ls} là khoá duy nhất.`);
else{const rest=mi(mi(U,Ls),no);o.push(`Xét các tập con của ${rest||'∅'} ghép với ${Ls||'∅'}, theo kích thước tăng dần:`);const seen=[];
(rest?['',...subsets(rest)]:['']).forEach(s=>{const c=un(Ls,s);if(!c)return;if(K.some(k=>sub(k,c)&&k!=c)){o.push(`  ${c}: chứa một khoá đã tìm ⇒ bỏ qua (không tối thiểu)`)}else{const b=clo(c,F);o.push(`  ${c}⁺ = ${b}${b==U?' = R ⇒ khoá':' ≠ R'}`)}})}
o.push('Tính tối thiểu của từng khoá:');K.forEach(k=>o.push(k.length==1?`  ${k}: chỉ một thuộc tính ⇒ tối thiểu.`:`  ${k}: `+[...k].map(a=>`(${mi(k,a)})⁺ = ${clo(mi(k,a),F)}`).join('; ')+' ≠ R ⇒ tối thiểu.'));
o.push(`Đầy đủ: mọi tập khác hoặc chứa một khoá ở trên, hoặc có bao đóng ≠ R.`);o.push(`Khoá dự tuyển: ${K.join(', ')}.`);const P=N(K.join(''));o.push(`Thuộc tính khoá: ${[...P].join(', ')||'không có'}; thuộc tính không khoá: ${[...mi(U,P)].join(', ')||'không có'}.`);return L(o)}
const rMc=F=>{const r=mincover(F);return L([...r.log,`Phủ tối thiểu: ${fsx(r.G)}`])};
function rNf(U,F){const r=nfa(U,F),o=[`Khoá: ${r.K.join(', ')}; thuộc tính khoá: ${[...r.Pm].join(', ')}.`];
o.push(r.bc.length?'Phụ thuộc vi phạm BCNF (vế trái không là siêu khoá):':'Mọi phụ thuộc có vế trái là siêu khoá ⇒ BCNF.');r.bc.forEach(f=>o.push('  '+fd(f)));
if(r.bc.length){o.push(r.t3.length?'Phụ thuộc vi phạm 3NF (vế phải không thuộc khoá):':'Mọi vế phải vi phạm đều thuộc khoá ⇒ đạt 3NF.');r.t3.forEach(f=>o.push('  '+fd(f)))}
if(r.t3.length){o.push(r.part.length?'Phụ thuộc bộ phận vào khoá (vi phạm 2NF):':'Không có phụ thuộc bộ phận ⇒ đạt 2NF.');r.part.forEach(x=>o.push('  '+x))}
o.push(`Kết luận: dạng chuẩn cao nhất là ${r.lvl}.`);return L(o)}
function rEq(F,G){const o=[`F = ${fsx(F)}`,`G = ${fsx(G)}`,'Kiểm tra G ⊆ F⁺:'];let a=1,b=1;
G.forEach(g=>{const c=clo(g.l,F),k=sub(g.r,c);if(!k)a=0;o.push(`  ${fd(g)}: ${g.l}⁺(F) = ${c} ${k?'⊇':'⊉'} ${g.r} ${k?'✓':'✗'}`)});o.push('Kiểm tra F ⊆ G⁺:');
F.forEach(f=>{const c=clo(f.l,G),k=sub(f.r,c);if(!k)b=0;o.push(`  ${fd(f)}: ${f.l}⁺(G) = ${c} ${k?'⊇':'⊉'} ${f.r} ${k?'✓':'✗'}`)});
o.push(a&&b?'Cả hai chiều đều đúng ⇒ F ≡ G.':`${a?'':'G không suy ra được từ F. '}${b?'':'F không suy ra được từ G. '}⇒ F ≢ G.`);return L(o)}
function rRed(F){const o=['Xét từng phụ thuộc có dư thừa trong F không (bỏ nó rồi tính bao đóng vế trái):'];const red=[];
F.forEach((f,i)=>{const R=F.filter((_,j)=>j!=i),c=clo(f.l,R),k=sub(f.r,c);if(k)red.push(f);o.push(`  ${fd(f)}: ${f.l}⁺ theo F∖{${fd(f)}} = ${c} ${k?'⊇':'⊉'} ${f.r} ⇒ ${k?'DƯ THỪA':'không dư thừa'}`)});
o.push('Thuộc tính dư thừa ở vế trái:');let any=0;F.forEach(f=>{if(f.l.length>1)[...f.l].forEach(a=>{const t=mi(f.l,a),k=sub(f.r,clo(t,F));if(k)any=1;o.push(`  ${fd(f)}: bỏ ${a} ⇒ (${t})⁺ = ${clo(t,F)} ${k?'⊇':'⊉'} ${f.r} ⇒ ${a} ${k?'DƯ THỪA':'không dư thừa'}`)})});if(!any)o.push('  (không có)');
if(red.length>1){const rest=F.filter(f=>!red.includes(f));o.push(`Xoá đồng thời ${red.map(fd).join(' và ')}: F còn ${fsx(rest)}, ${rest.every(()=>1)&&F.every(f=>sub(f.r,clo(f.l,rest)))?'vẫn tương đương F':'KHÔNG còn tương đương F'} ⇒ ${F.every(f=>sub(f.r,clo(f.l,rest)))?'':'không được xoá đồng thời, phải xoá tuần tự và kiểm tra lại sau mỗi lần.'}`);
let cur=F.slice();o.push('Xoá tuần tự:');for(let i=0;i<cur.length;){const R=cur.filter((_,j)=>j!=i);if(sub(cur[i].r,clo(cur[i].l,R))){o.push(`  bỏ ${fd(cur[i])} (suy ra từ ${fsx(R)})`);cur=R}else i++}o.push(`  Còn lại: ${fsx(cur)}`)}return L(o)}
function rDec(U,F,D){const rels=[],m=[...D.matchAll(/\(([A-Za-z, ]+)\)/g)];(m.length?m.map(x=>N(x[1])):D.split(/[\n;]+/).map(N)).forEach(r=>r&&rels.push(r));if(rels.length<2)return 'Cần nhập phép phân rã gồm ít nhất 2 lược đồ, ví dụ R1(A,C); R2(B,C).';
const o=[`Phân rã: ${rels.map((r,i)=>`R${'₁₂₃₄₅₆₇₈₉'[i]}(${[...r].join(', ')})`).join(', ')}`];
rels.forEach((R,i)=>{const pf=proj(R,F),k=keys(R,pf.length?pf:[]);o.push(`R${'₁₂₃₄₅₆₇₈₉'[i]}(${[...R].join(', ')}): F chiếu = ${fsx(pf)}; khoá: ${k.join(', ')}; dạng chuẩn: ${nfa(R,pf).lvl}`)});
const cov=mi(U,rels.join(''));o.push(cov?`Thiếu thuộc tính ${cov} trong các lược đồ con.`:'Các lược đồ con phủ toàn bộ thuộc tính của R.');
const c=chase(U,rels,F);o.push('Không mất mát thông tin (thuật toán chase):');o.push('  Bảng ban đầu:');rels.forEach((R,i)=>o.push('    '+[...U].map(a=>R.includes(a)?'a'+a:'b'+(i+1)+a).join(' ')));o.push('  Bảng sau khi áp dụng F:');c.T.forEach(t=>o.push('    '+t.map(v=>v[0]=='a'?v:'b'+(+v[1]+1)+v.slice(2)).join(' ')));
if(rels.length==2){const i=N([...rels[0]].filter(a=>rels[1].includes(a)).join(''));o.push(i?`  Cách nhanh cho 2 lược đồ: R₁∩R₂ = ${i}; ${i}⁺ = ${clo(i,F)}; ${sub(mi(rels[0],i),clo(i,F))||sub(mi(rels[1],i),clo(i,F))?'xác định R₁∖R₂ hoặc R₂∖R₁ ⇒ không mất mát':'không xác định được ⇒ mất mát'}.`:'  Cách nhanh cho 2 lược đồ: R₁∩R₂ = ∅ nên không xác định được gì ⇒ mất mát.')}
o.push(c.ok?'  Có một dòng toàn ký hiệu a ⇒ KHÔNG mất mát thông tin.':'  Không có dòng nào toàn ký hiệu a ⇒ CÓ mất mát thông tin.');
o.push('Bảo toàn phụ thuộc hàm:');preserved(F,rels).forEach(p=>o.push(`  ${fd(p.f)}: ${p.ok?'bảo toàn ✓':'không bảo toàn ✗'}`));const pr=preserved(F,rels);o.push(pr.every(p=>p.ok)?'⇒ Bảo toàn phụ thuộc hàm.':'⇒ KHÔNG bảo toàn phụ thuộc hàm.');return L(o)}
function rSyn(U,F){const mc=mincover(F),g=merge(mc.G);let R=g.map(f=>un(f.l,f.r));R=R.filter((x,i)=>!R.some((y,j)=>j!=i&&sub(x,y)&&(x!=y||j<i)));const K=keys(U,F),o=[...mc.log,`Phủ tối thiểu: ${fsx(mc.G)}`,`Gộp theo vế trái: ${fsx(g)} ⇒ các lược đồ: ${R.join(', ')}`,`Khoá của R: ${K.join(', ')}`];
if(!K.some(k=>R.some(r=>sub(k,r)))){R.push(K[0]);o.push(`Không lược đồ nào chứa khoá ⇒ thêm lược đồ khoá ${K[0]}.`)}else o.push('Có lược đồ chứa khoá ⇒ không cần thêm.');
o.push('Kết quả phân rã 3NF:');R.forEach((r,i)=>{const pf=proj(r,F);o.push(`  R${'₁₂₃₄₅₆₇₈₉'[i]}(${[...r].join(', ')}), khoá: ${keys(r,pf).join(', ')}, dạng chuẩn: ${nfa(r,pf).lvl}`)});
o.push(chase(U,R,F).ok?'Không mất mát thông tin (chase) ✓':'Có mất mát thông tin ✗');o.push(preserved(F,R).every(p=>p.ok)?'Bảo toàn phụ thuộc hàm ✓':'Không bảo toàn phụ thuộc hàm ✗');return L(o)}
function rInst(F,T){const rows=T.trim().split('\n').map(l=>l.trim().split(/[\s,;]+/)).filter(r=>r[0]);if(rows.length<2)return 'Nhập thể hiện: dòng đầu là tên thuộc tính.';const h=rows[0].map(x=>x.toUpperCase()),d=rows.slice(1),o=[];
F.forEach(f=>{const bad=[];for(let i=0;i<d.length;i++)for(let j=i+1;j<d.length;j++){const g=(t,s)=>[...s].map(a=>t[h.indexOf(a)]).join('|');if(g(d[i],f.l)==g(d[j],f.l)&&g(d[i],f.r)!=g(d[j],f.r))bad.push(`(t${i+1}, t${j+1})`)}
o.push(bad.length?`${fd(f)}: KHÔNG thoả, vi phạm bởi ${bad.join(', ')} (cùng giá trị ${f.l} nhưng khác ${f.r}).`:`${fd(f)}: thoả trên thể hiện này.`)});return L(o)}
