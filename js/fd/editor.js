/**
 * Phụ thuộc hàm – vùng soạn bài: ký hiệu, gõ tắt, Copy/Save/Load/TXT/Print, Tìm & Thay
 */

const $=s=>document.querySelector(s),ed=$('#ed');
/* ---------- soạn thảo ---------- */
function ins(t){ed.focus();if(!document.execCommand('insertText',false,t))ed.setRangeText(t,ed.selectionStart,ed.selectionEnd,'end')}
const SYM=['→','⁺','⊆','⊂','⊄','∈','∉','∪','∩','∅','⊨','⇒','⇔','≡','≠','≤','≥','∧','∨','¬','∀','∃','⋈','π','{}','()','₁','₂','₃','₄','✓','✗'];
$('#sym').innerHTML=SYM.map(s=>`<button type="button" data-i="${s}">${s}</button>`).join('');
const TPL=[['Phản xạ','(Phản xạ)'],['Tăng trưởng','(Tăng trưởng)'],['Bắc cầu','(Bắc cầu)'],['Hợp','(Hợp)'],['Tách','(Tách)'],['Giả bắc cầu','(Giả bắc cầu)'],['X⁺ =','X⁺ = '],['F = { }','F = {  }'],['R( )','R(A, B, C, D)'],['Bước','Bước 1: ']];
$('#tpl').innerHTML=TPL.map(([a,b])=>`<button type="button" data-i="${b}">${a}</button>`).join('');
document.addEventListener('click',e=>{const i=e.target.dataset&&e.target.dataset.i;if(i===undefined)return;ins(i);if(i=='{}'||i=='()')ed.selectionStart=ed.selectionEnd=ed.selectionStart-1;if(i=='F = {  }')ed.selectionStart=ed.selectionEnd=ed.selectionStart-2});
const ALT={KeyT:'→',KeyP:'⁺',KeyS:'⊆',KeyE:'∈',KeyU:'∪',KeyI:'∩',KeyQ:'≡',KeyN:'∅',KeyX:'⇒',KeyY:'⇔',KeyM:'⊨',KeyJ:'⋈',Digit1:'₁',Digit2:'₂',Digit3:'₃',Digit4:'₄'},ALTS={KeyS:'⊂',KeyE:'∉'};
document.addEventListener('keydown',e=>{if(window.App&&App.tab!=='fd')return;if(!e.altKey||e.ctrlKey||e.metaKey)return;const s=(e.shiftKey?ALTS:ALT)[e.code];if(s){e.preventDefault();const t=document.activeElement;if(t&&t.tagName.match(/INPUT|TEXTAREA/)&&t.id!='ed'&&t.type!='number'){t.setRangeText(s,t.selectionStart,t.selectionEnd,'end')}else ins(s)}});
const SUBD={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
const CMD={to:'→',in:'∈',notin:'∉',sub:'⊆',psub:'⊂',union:'∪',inter:'∩',eq:'≡',empty:'∅',ent:'⊨',join:'⋈',all:'∀',ex:'∃',and:'∧',or:'∨',not:'¬',iff:'⇔',imp:'⇒',plus:'⁺',pi:'π'};
ed.addEventListener('input',e=>{if(e.inputType!='insertText'||ed.selectionStart!=ed.selectionEnd)return;const p=ed.selectionStart,b=ed.value.slice(0,p);let n=0,r='',m;
if(m=/(->|=>|>=|<=|!=|\^\+)$/.exec(b)){n=m[0].length;r={'->':'→','=>':'⇒','>=':'≥','<=':'≤','!=':'≠','^+':'⁺'}[m[0]]}
else if(m=/_(\d)$/.exec(b)){n=2;r=SUBD[m[1]]}
else if((m=/\\([a-z]+) $/.exec(b))&&CMD[m[1]]){n=m[0].length;r=CMD[m[1]]}
if(n){ed.setSelectionRange(p-n,p);ins(r)}});
$('#size').oninput=e=>{const v=Math.max(8,Math.min(40,+e.target.value||14));ed.style.fontSize=v+'pt'};
function toast(m){window.App?App.toast(m):0}
$('#b-copy').onclick=()=>{if(!ed.value.trim())return alert('Chưa có nội dung để copy.');navigator.clipboard.writeText(ed.value).then(()=>alert('Đã copy nội dung.'),()=>{ed.select();document.execCommand('copy')})};
$('#b-clear').onclick=()=>{if(!ed.value||confirm('Xoá toàn bộ nội dung?')){ed.value='';ed.focus()}};
const KEY='phu_thuoc_ham_v1';
$('#b-save').onclick=()=>{try{localStorage.setItem(KEY,ed.value);alert('Đã lưu vào trình duyệt.')}catch(e){alert('Không lưu được: '+e)}};
$('#b-load').onclick=()=>{try{const v=localStorage.getItem(KEY);if(v===null)return alert('Chưa có bản lưu.');if(ed.value&&!confirm('Ghi đè nội dung hiện tại?'))return;ed.value=v}catch(e){alert('Không đọc được: '+e)}};
$('#b-txt').onclick=()=>{if(!ed.value.trim())return alert('Chưa có nội dung.');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ed.value],{type:'text/plain;charset=utf-8'}));a.download='phu_thuoc_ham.txt';a.click();URL.revokeObjectURL(a.href)};
$('#b-print').onclick=()=>{$('#pr').textContent=ed.value;document.body.classList.add('print-fd');window.print();setTimeout(()=>document.body.classList.remove('print-fd'),600)};
try{const v=localStorage.getItem(KEY);if(v)ed.value=v}catch(e){}
ed.addEventListener('input',()=>{try{localStorage.setItem(KEY+'_auto',ed.value)}catch(e){}});
/* tìm & thay */
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
$('#fn').onclick=()=>{const f=$('#fi').value;if(!f)return;const v=ed.value.toLowerCase(),q=f.toLowerCase();let i=v.indexOf(q,ed.selectionEnd);if(i<0)i=v.indexOf(q);if(i<0)return toast('Không tìm thấy');ed.focus();ed.setSelectionRange(i,i+f.length)};
$('#fr').onclick=()=>{const f=$('#fi').value;if(f&&ed.value.slice(ed.selectionStart,ed.selectionEnd).toLowerCase()==f.toLowerCase())ins($('#ri').value);$('#fn').click()};
$('#fa').onclick=()=>{const f=$('#fi').value;if(!f)return;const re=new RegExp(esc(f),'gi');let n=0;ed.value=ed.value.replace(re,()=>(n++,$('#ri').value));toast(`Đã thay ${n} chỗ`)};
