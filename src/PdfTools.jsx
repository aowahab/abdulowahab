import {useEffect,useRef,useState} from 'react';
const imageTypes=new Set(['image/jpeg','image/png','image/webp']);
const megabytes=n=>`${(n/1024/1024).toFixed(1)} MB`;
function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}

export function ImageToPdf(){
 const [files,setFiles]=useState([]),[orientation,setOrientation]=useState('portrait'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const select=event=>{const selected=[...event.target.files];setStatus('');setError('');
  if(selected.length>20||selected.some(f=>!imageTypes.has(f.type)||f.size>20*1024*1024)||selected.reduce((n,f)=>n+f.size,0)>60*1024*1024){setFiles([]);setError('Choose up to 20 JPG, PNG or WebP images, at most 20 MB each and 60 MB in total.');return}setFiles(selected)};
 const move=(index,direction)=>setFiles(current=>{const next=[...current],target=index+direction;[next[index],next[target]]=[next[target],next[index]];return next});
 const convert=async()=>{if(!files.length)return;setBusy(true);setError('');setStatus('Preparing PDF…');
  try{const {jsPDF}=await import('jspdf');const pdf=new jsPDF({orientation,unit:'mm',format:'a4',compress:true});
   for(let index=0;index<files.length;index++){
    const bitmap=await createImageBitmap(files[index]);try{
     if(bitmap.width*bitmap.height>50_000_000)throw Error('An image is too large to process. Resize it first.');
     const ratio=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
     if(index)pdf.addPage();const width=pdf.internal.pageSize.getWidth(),height=pdf.internal.pageSize.getHeight(),scale=Math.min((width-20)/canvas.width,(height-20)/canvas.height),w=canvas.width*scale,h=canvas.height*scale;
     pdf.addImage(canvas.toDataURL('image/jpeg',.9),'JPEG',(width-w)/2,(height-h)/2,w,h,undefined,'FAST');canvas.width=canvas.height=1;
    }finally{bitmap.close()}
   }
   if(alive.current){saveBlob(pdf.output('blob'),'tickytools-images.pdf');setStatus(`PDF downloaded with ${files.length} ${files.length===1?'page':'pages'}.`)}
  }catch(e){if(alive.current){setStatus('');setError(e.message||'Could not convert these images. Try fewer or smaller images.')}}finally{if(alive.current)setBusy(false)}
 };
 return <div className="workspace-tool-panel pdf-tool"><h4>Image to PDF</h4><p>Combine images into one A4 PDF. Each image fits on its own page without cropping. Files stay on your device.</p><label>Choose JPG, PNG or WebP images<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={select}/></label>
 {files.length>0&&<ol className="pdf-file-list">{files.map((file,index)=><li key={file.name+'-'+index}><span>{index+1}. {file.name}<small>{megabytes(file.size)}</small></span><div><button type="button" aria-label={'Move '+file.name+' up'} disabled={busy||index===0} onClick={()=>move(index,-1)}>↑</button><button type="button" aria-label={'Move '+file.name+' down'} disabled={busy||index===files.length-1} onClick={()=>move(index,1)}>↓</button><button type="button" disabled={busy} aria-label={'Remove '+file.name} onClick={()=>setFiles(current=>current.filter((_,i)=>i!==index))}>Remove</button></div></li>)}</ol>}
 <label>Page orientation<select value={orientation} disabled={busy} onChange={e=>setOrientation(e.target.value)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label><button type="button" disabled={busy||!files.length} onClick={convert}>{busy?'Creating PDF…':'Create & download PDF'}</button><small>Up to 20 images · 20 MB each · 60 MB total. High-resolution images are resized for a manageable PDF.</small>{error&&<p role="alert">{error}</p>}{status&&<p role="status">{status}</p>}</div>;
}

export function WordToPdf(){
 const [file,setFile]=useState(null),[html,setHtml]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[warnings,setWarnings]=useState(false);
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const preview=async()=>{if(!file)return;setBusy(true);setError('');setHtml('');setWarnings(false);
  try{const [{default:mammoth},{default:DOMPurify}]=await Promise.all([import('mammoth/mammoth.browser.js'),import('dompurify')]);const result=await mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{externalFileAccess:false});
   const safe=DOMPurify.sanitize(result.value,{USE_PROFILES:{html:true},FORBID_TAGS:['style','iframe','form','input','button','video','audio','source'],FORBID_ATTR:['style','srcset']});
   const doc=new DOMParser().parseFromString(safe,'text/html');for(const img of doc.querySelectorAll('img')){if(!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(img.getAttribute('src')||''))img.remove()}
   for(const a of doc.querySelectorAll('a')){const href=a.getAttribute('href')||'';if(!/^(https?:|mailto:|#)/i.test(href))a.removeAttribute('href');a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer')}
   if(!doc.body.textContent.trim()&&!doc.querySelector('img'))throw Error('This document has no readable content.');
   if(alive.current){setHtml(doc.body.innerHTML);setWarnings(result.messages.length>0)}
  }catch(e){if(alive.current)setError('Could not read this DOCX file. Use an unencrypted .docx document and try again.')}finally{if(alive.current)setBusy(false)}
 };
 const print=()=>{const win=window.open('','_blank');if(!win){setError('Allow a new window to open the print preview.');return}win.opener=null;
  win.document.write('<!doctype html><html><head><meta charset="UTF-8"><title>TickyTools document</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,"Noto Sans Bengali",sans-serif;font-size:11pt;line-height:1.5;color:#111;margin:24px auto;max-width:174mm}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:6px}h1,h2,h3{break-after:avoid}tr,img{break-inside:avoid}.print-controls{padding:16px;background:#eef3f6;margin-bottom:24px}.print-controls button{padding:10px 18px;cursor:pointer}@media print{.print-controls{display:none}body{margin:0;max-width:none}}</style></head><body><div class="print-controls"><p>Choose “Save as PDF” as the printer destination. Review the pages before saving.</p><button id="print-document" type="button">Print / Save as PDF</button></div><main>'+html+'</main></body></html>');win.document.close();win.document.title=(file?.name||'document').replace(/\.docx$/i,'')+' — TickyTools';win.document.getElementById('print-document').addEventListener('click',()=>win.print());
 };
 return <div className="workspace-tool-panel pdf-tool"><h4>Word to PDF</h4><p>Open a DOCX locally, review its contents, then use your browser’s Save as PDF option. Nothing is uploaded.</p><label>Choose a Word document (.docx)<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={busy} onChange={e=>{const selected=e.target.files?.[0];setHtml('');setError('');setFile(null);if(!selected)return;if(!/\.docx$/i.test(selected.name)||selected.size>10*1024*1024){setError('Choose a .docx file up to 10 MB. Older .doc files are not supported.');return}setFile(selected)}}/></label><button type="button" disabled={!file||busy} onClick={preview}>{busy?'Reading document…':'Prepare document preview'}</button><small>Text, lists, tables and embedded images are supported. Complex page layouts, headers, fonts and pagination may differ from Microsoft Word.</small>{error&&<p role="alert">{error}</p>}{warnings&&<p className="workspace-disclaimer">Some document features could not be preserved. Please review the preview before saving.</p>}{html&&<><div className="word-document-preview" aria-label="Converted Word document preview" dangerouslySetInnerHTML={{__html:html}}/><button type="button" onClick={print}>Open Print / Save as PDF</button></>}</div>;
}
