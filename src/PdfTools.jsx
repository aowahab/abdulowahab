import {useEffect,useRef,useState} from 'react';
import {validatePdfFiles,mergePdfFiles} from './pdfMerge.js';
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

export function PdfMerger(){
 const [files,setFiles]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
 const controller=useRef(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort()}},[]);
 const changeFiles=next=>{setFiles(next);setError('');setStatus('')};
 const select=event=>{const picked=[...event.target.files];event.target.value='';setError('');setStatus('');
  try{const next=[...files,...picked];validatePdfFiles(next);if(alive.current)setFiles(next)}catch(e){if(alive.current)setError(e.message)}
 };
 const move=(index,direction)=>{const next=[...files],target=index+direction;[next[index],next[target]]=[next[target],next[index]];changeFiles(next)};
 const merge=async()=>{setBusy(true);setError('');setStatus('Preparing PDFs…');controller.current=new AbortController();
  try{const result=await mergePdfFiles(files,{signal:controller.current.signal,onProgress:(index,total)=>{if(alive.current)setStatus(`Reading PDF ${index} of ${total}…`)}});
   if(alive.current){saveBlob(new Blob([result.bytes],{type:'application/pdf'}),'tickytools-merged.pdf');setStatus(`Merged PDF downloaded: ${files.length} files, ${result.pages} pages.`)}
  }catch(e){if(alive.current&&e.name!=='AbortError'){setStatus('');setError(e.message||'Could not merge these PDFs. Try smaller files.')}}finally{if(alive.current)setBusy(false)}
 };
 return <div className="workspace-tool-panel pdf-tool"><h4>PDF Merger</h4><p>Combine multiple PDFs into one file. Reorder the files below; all pages from each PDF are included in that order. Files stay on your device.</p>
  <label>Choose PDF files<input type="file" accept="application/pdf,.pdf" multiple disabled={busy} onChange={select}/></label>
  {files.length>0&&<><ol className="pdf-file-list">{files.map((file,index)=><li key={file.name+'-'+index}><span>{index+1}. {file.name}<small>{megabytes(file.size)}</small></span><div><button type="button" aria-label={'Move '+file.name+' up'} disabled={busy||index===0} onClick={()=>move(index,-1)}>↑</button><button type="button" aria-label={'Move '+file.name+' down'} disabled={busy||index===files.length-1} onClick={()=>move(index,1)}>↓</button><button type="button" aria-label={'Remove '+file.name} disabled={busy} onClick={()=>changeFiles(files.filter((_,i)=>i!==index))}>Remove</button></div></li>)}</ol><button type="button" disabled={busy} onClick={()=>changeFiles([])}>Clear all</button></>}
  <button type="button" disabled={busy||files.length<2} onClick={merge}>{busy?'Merging PDFs…':'Merge & download PDF'}</button>
  <small>Choose 2–20 PDFs · 25 MB per file · 100 MB total · up to 1,000 pages. Unlock password-protected PDFs first. Select more files to add them to the list.</small>
  {error&&<p role="alert">{error}</p>}{status&&<p role="status">{status}</p>}
 </div>;
}
