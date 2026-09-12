'use strict';
const KEY = 'personal-rental-record-v1';
const fields = ['team','estate','address','agent','agentPhone','landlordPhone','tenant','idType','idNumber','wifi','bank','accountName','accountNumber','rentDay','expiry','rentDeposit','utilityDeposit','totalDeposit','contract'];
const form = document.querySelector('#edit');
const view = document.querySelector('#view');
const imageInput = document.querySelector('#imageInput');
const imagePreview = document.querySelector('#editImage');
let saved = readSaved();
let draft = {...saved};
let savedImage = null; // An image stays in memory only for this open page.
let draftImage = null;
let editing = false;
let totalManual = false;
let toastTimer;
for (let day=1; day<=31; day++) {
  const option = document.createElement('option'); option.value=String(day); option.textContent=`${day} 日`;
  form.elements.rentDay.append(option);
}
function readSaved(){try{const data=JSON.parse(localStorage.getItem(KEY)||'{}');return Object.fromEntries(fields.map(k=>[k,typeof data[k]==='string'?data[k]:'']));}catch{return Object.fromEntries(fields.map(k=>[k,'']));}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved));return true}catch{showToast('保存失败');return false}}
function showToast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200)}
function validLink(s){try{const u=new URL(s.trim());return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
function money(s){const n=Number(String(s).replace(/,/g,'').trim());return s.trim()!==''&&Number.isFinite(n)?`RM ${n.toLocaleString('en-MY',{maximumFractionDigits:2})}`:`RM ${s}`}
function dateLabel(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return m?`${m[3]}/${m[2]}/${m[1]}`:s}
function dataItems(data){const idName=data.idType==='身份证'?'身份证号码':'护照号码';return [
  {title:'房屋资料',items:[['团队',data.team],['小区',data.estate],['地址',data.address]]},
  {title:'联系人',items:[['中介名字',data.agent],['中介电话',data.agentPhone],['房东电话',data.landlordPhone]]},
  {title:'租户资料',items:[['租户名字',data.tenant],['证件类型',data.idType],[idName,data.idNumber]]},
  {title:'租房资料',items:[['WiFi',data.wifi],['每月缴租日',data.rentDay?`${data.rentDay} 日`:''],['房屋到期日期',data.expiry?dateLabel(data.expiry):'']]},
  {title:'房租付款',items:[['银行',data.bank],['账户名字',data.accountName],['银行账号',data.accountNumber]]},
  {title:'押金',items:[['租房押金',data.rentDeposit?money(data.rentDeposit):''],['水电押金',data.utilityDeposit?money(data.utilityDeposit):''],['总共缴纳',data.totalDeposit?money(data.totalDeposit):'']]},
  {title:'租房合同',items:[['合同链接',data.contract]]}
];}
function itemNode(key,value){const div=document.createElement('div');div.className='item';const k=document.createElement('div');k.className='key';k.textContent=key;const v=document.createElement('div');v.className='value';v.textContent=value;div.append(k,v);return div}
function renderView(){view.replaceChildren();const groups=dataItems(saved);const home=groups.shift();if(home.items.some(([,v])=>v)){const card=document.createElement('section');card.className='card view-head';const items=document.createElement('div');items.className='items';home.items.filter(([,v])=>v).forEach(([k,v])=>items.append(itemNode(k,v)));card.append(items);view.append(card)}
  for(const group of groups){const entries=group.items.filter(([,v])=>v);const photo=group.title==='租户资料'?savedImage:null;if(!entries.length&&!photo)continue;const card=document.createElement('section');card.className='card view-card';const h=document.createElement('h2');h.textContent=group.title;card.append(h);const items=document.createElement('div');items.className='items';for(let i=0;i<entries.length;i++){const [k,v]=entries[i];if(group.title==='联系人'&&k==='中介电话'&&entries[i+1]?.[0]==='房东电话'){const row=document.createElement('div');row.className='two';row.append(itemNode(k,v),itemNode(...entries[++i]));items.append(row)}else items.append(itemNode(k,v))}card.append(items);if(photo){const label=document.createElement('div');label.className='key';label.textContent='证件图片';label.style.marginTop=entries.length?'17px':'0';const img=document.createElement('img');img.className='photo';img.alt='证件图片';img.src=photo.url;card.append(label,img)}if(group.title==='租房合同'){const actions=linkButtons();card.append(actions)}view.append(card)}if(!view.children.length){const blank=document.createElement('div');blank.className='empty-view';view.append(blank)}}
function linkButtons(){const wrap=document.createElement('div');wrap.className='link-actions';for(const [action,label] of [['open','打开'],['copy','复制']]){const b=document.createElement('button');b.type='button';b.className='secondary';b.dataset.action=action;b.textContent=label;b.disabled=!validLink(saved.contract);wrap.append(b)}return wrap}
function renderEdit(){for(const name of fields){if(name==='idType'||name==='wifi')continue;form.elements[name].value=draft[name]||''}for(const group of document.querySelectorAll('.segments')){const name=group.dataset.field;group.querySelectorAll('button').forEach(b=>{const active=b.dataset.value===draft[name];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))})}document.querySelector('#idNumberLabel').firstChild.textContent=draft.idType==='身份证'?'身份证号码':'护照号码';imagePreview.hidden=!draftImage;imagePreview.src=draftImage?.url||'';document.querySelector('#pickImage').textContent=draftImage?'更换图片':'选择图片';document.querySelector('#removeImage').hidden=!draftImage;updateLinkState()}
function updateLinkState(){const enabled=Boolean(validLink(editing?draft.contract:saved.contract));form.querySelectorAll('[data-action]').forEach(b=>b.disabled=!enabled)}
function mode(on){editing=on;view.hidden=on;form.hidden=!on;document.querySelector('#leftAction').textContent=on?'取消':'编辑';document.querySelector('#rightAction').textContent=on?'保存':'导出';document.querySelector('#clear').hidden=on;if(on)renderEdit();else renderView();window.scrollTo(0,0)}
function readForm(){for(const name of fields){if(name==='idType'||name==='wifi')continue;draft[name]=form.elements[name].value.trim()}}
function calculate(){const a=Number(draft.rentDeposit.replace(/,/g,'')),b=Number(draft.utilityDeposit.replace(/,/g,''));draft.totalDeposit=(draft.rentDeposit||draft.utilityDeposit)&&Number.isFinite(a)&&Number.isFinite(b)?String(Math.round((a+b)*100)/100):'';form.elements.totalDeposit.value=draft.totalDeposit}
form.addEventListener('input',e=>{if(!e.target.name)return;draft[e.target.name]=e.target.value;if(e.target.name==='totalDeposit')totalManual=true;if(['rentDeposit','utilityDeposit'].includes(e.target.name)&&!totalManual)calculate();if(e.target.name==='contract')updateLinkState()});
form.addEventListener('change',e=>{if(e.target.name)draft[e.target.name]=e.target.value});
form.addEventListener('submit',e=>e.preventDefault());
document.querySelectorAll('.segments').forEach(group=>group.addEventListener('click',e=>{const b=e.target.closest('button[data-value]');if(!b)return;const name=group.dataset.field;draft[name]=b.dataset.value;group.querySelectorAll('button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});if(name==='idType')document.querySelector('#idNumberLabel').firstChild.textContent=b.dataset.value==='身份证'?'身份证号码':'护照号码'}));
document.querySelector('#pickImage').addEventListener('click',()=>imageInput.click());
imageInput.addEventListener('change',()=>{const file=imageInput.files[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){showToast('图片格式不支持');imageInput.value='';return}if(draftImage&&draftImage!==savedImage)URL.revokeObjectURL(draftImage.url);draftImage={url:URL.createObjectURL(file),file};renderEdit();imageInput.value=''});
document.querySelector('#removeImage').addEventListener('click',()=>{if(draftImage&&draftImage!==savedImage)URL.revokeObjectURL(draftImage.url);draftImage=null;renderEdit()});
document.addEventListener('click',async e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;const link=validLink(editing?draft.contract:saved.contract);if(!link)return;if(action==='open')window.open(link,'_blank','noopener,noreferrer');if(action==='copy'){try{await navigator.clipboard.writeText(link);showToast('已复制')}catch{showToast('复制失败')}}});
document.querySelector('#leftAction').addEventListener('click',()=>{if(editing){if(draftImage&&draftImage!==savedImage)URL.revokeObjectURL(draftImage.url);draftImage=savedImage;draft={...saved};mode(false)}else{draft={...saved};draftImage=savedImage;totalManual=Boolean(saved.totalDeposit)&&saved.totalDeposit!==computed(saved);mode(true)}});
function computed(d){const a=Number(d.rentDeposit.replace(/,/g,'')),b=Number(d.utilityDeposit.replace(/,/g,''));return(d.rentDeposit||d.utilityDeposit)&&Number.isFinite(a)&&Number.isFinite(b)?String(Math.round((a+b)*100)/100):''}
document.querySelector('#rightAction').addEventListener('click',()=>{if(editing){readForm();saved={...draft};if(savedImage&&savedImage!==draftImage)URL.revokeObjectURL(savedImage.url);savedImage=draftImage;if(persist())mode(false)}else exportPng()});
document.querySelector('#clear').addEventListener('click',()=>{if(!confirm('清空所有房屋记录？'))return;const empty=Object.fromEntries(fields.map(k=>[k,'']));try{localStorage.removeItem(KEY)}catch{showToast('清空失败');return}if(savedImage)URL.revokeObjectURL(savedImage.url);savedImage=null;draftImage=null;saved=empty;draft={...empty};renderView()});
function safeName(s){return s.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g,'').replace(/\s+/g,'').slice(0,45)}
async function exportPng(){const button=document.querySelector('#rightAction');button.disabled=true;try{const canvas=await drawExport(saved,savedImage);const names=[safeName(saved.team),safeName(saved.estate),'租房记录',[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-')].filter(Boolean);const a=document.createElement('a');a.download=names.join('_')+'.png';a.href=canvas.toDataURL('image/png');document.body.append(a);a.click();a.remove()}catch{showToast('导出失败')}finally{button.disabled=false}}
function lines(ctx,text,maxWidth){const result=[];for(const paragraph of String(text).split('\n')){let line='';for(const char of paragraph){if(ctx.measureText(line+char).width>maxWidth&&line){result.push(line);line=''}line+=char}result.push(line)}return result}
function rounded(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
async function drawExport(data,image){const W=1080,pad=64,inner=W-pad*2;const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');const family='-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';const groups=dataItems(data).map(g=>({...g,items:g.items.filter(([,v])=>v)})).filter(g=>g.items.length||(g.title==='租户资料'&&image));let photo=null;if(image){photo=new Image();photo.src=image.url;await photo.decode()}
  let y=64;const operations=[];operations.push({type:'header',y});y+=99;
  for(const group of groups){const start=y;y+=100;const entries=[];for(const [key,value] of group.items){ctx.font=`500 34px ${family}`;const wrapped=lines(ctx,value,inner-64);const height=27+15+wrapped.length*47+28;entries.push({key,wrapped,y});y+=height}let imageY=0,imageH=0;if(group.title==='租户资料'&&photo){imageY=y+40;imageH=Math.min(510,photo.height*(inner-64)/photo.width);y=imageY+imageH+35}y+=24;operations.push({type:'group',group,start,end:y,entries,imageY,imageH});y+=22}
  canvas.width=W;canvas.height=Math.max(230,Math.ceil(y+42));ctx.fillStyle='#f5f6f8';ctx.fillRect(0,0,W,canvas.height);ctx.fillStyle='#202630';ctx.font=`700 48px ${family}`;ctx.fillText('我的房屋记录',pad,108);
  for(const op of operations){if(op.type!=='group')continue;rounded(ctx,pad,op.start,inner,op.end-op.start,24,'#fff');ctx.fillStyle='#202630';ctx.font=`700 36px ${family}`;ctx.fillText(op.group.title,pad+32,op.start+53);for(const entry of op.entries){ctx.fillStyle='#818995';ctx.font=`500 26px ${family}`;ctx.fillText(entry.key,pad+32,entry.y+22);ctx.fillStyle='#202630';ctx.font=`500 34px ${family}`;entry.wrapped.forEach((line,i)=>ctx.fillText(line,pad+32,entry.y+69+i*47))}if(photo&&op.imageH){const w=Math.min(inner-64,photo.width*op.imageH/photo.height),x=pad+32+(inner-64-w)/2;ctx.save();ctx.beginPath();ctx.roundRect(x,op.imageY,w,op.imageH,18);ctx.clip();ctx.drawImage(photo,x,op.imageY,w,op.imageH);ctx.restore()}}
  return canvas}
mode(false);
