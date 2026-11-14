import {useState,lazy,Suspense} from 'react';
const ImageToPdf=lazy(()=>import('./PdfTools.jsx').then(module=>({default:module.ImageToPdf})));
const PdfMerger=lazy(()=>import('./PdfTools.jsx').then(module=>({default:module.PdfMerger})));
const PdfOcr=lazy(()=>import('./PdfOcr.jsx'));
const PdfEditor=lazy(()=>import('./PdfEditor.jsx'));
const ExcelMerge=lazy(()=>import('./ExcelTools.jsx'));
const PdfForms=lazy(()=>import('./PdfForms.jsx'));
const PdfToImages=lazy(()=>import('./AdvancedPdfTools.jsx').then(module=>({default:module.PdfToImages})));
const PdfPages=lazy(()=>import('./AdvancedPdfTools.jsx').then(module=>({default:module.PdfPages})));
const PdfStamp=lazy(()=>import('./AdvancedPdfTools.jsx').then(module=>({default:module.PdfStamp})));
const PdfSecurity=lazy(()=>import('./AdvancedPdfTools.jsx').then(module=>({default:module.PdfSecurity})));
const PdfText=lazy(()=>import('./AdvancedPdfTools.jsx').then(module=>({default:module.PdfText})));
const PdfCompress=lazy(()=>import('./AdvancedPdfTools.jsx').then(module=>({default:module.PdfCompress})));
const workspaceGroups=[
 {title:'Audit & assurance',items:[
  {name:'Audit Materiality Calculator',action:'materiality',detail:'Calculate overall and performance materiality from a selected benchmark; illustrative only.'},
  {name:'Audit Planning Checklist',action:'audit-planning',detail:'Interactive engagement planning checklist with exportable progress; no client details required.'},
  {name:'Risk Assessment & Assertions Matrix',action:'risk-matrix',detail:'Reference assertions by financial statement area; no client data collected.'},
  {name:'Audit Sampling Calculator',action:'sampling',detail:'Illustrative random index selection, not a statistical audit sample-size determination.'},
  {name:'Audit Completion Checklist',action:'completion',detail:'Interactive generic completion checklist with downloadable progress.'}
 ]},
 {title:'PDF tools',items:[
  {name:'Scan to Text (OCR)',action:'pdf-ocr',detail:'Read English or Bangla scans locally. Review recognised text.'},
  {name:'PDF to Image',action:'pdf-images',detail:'Export selected pages as PNG/JPG; download multiple pages in a ZIP.'},
  {name:'PDF Editor',action:'pdf-editor',detail:'Add text, highlight, shapes, visual signatures and permanent raster redaction.'},
  {name:'Organise PDF Pages',action:'pdf-organise',detail:'Reorder, rotate or remove PDF pages.'},
  {name:'Extract PDF Pages',action:'pdf-extract',detail:'Save selected page ranges in a new PDF.'},
  {name:'Split PDF',action:'pdf-split',detail:'Save each page as a separate PDF in a ZIP.'},
  {name:'Crop PDF Margins',action:'pdf-crop',detail:'Trim equal margins from selected PDF pages.'},
  {name:'PDF Watermark',action:'pdf-watermark',detail:'Stamp a text watermark on every page.'},
  {name:'PDF Page Numbers',action:'pdf-numbers',detail:'Add page numbers to a PDF.'},
  {name:'Password Protect PDF',action:'pdf-protect',detail:'Protect a document with AES-256 encryption.'},
  {name:'Unlock PDF',action:'pdf-unlock',detail:'Use a known password to save an unlocked page copy.'},
  {name:'Fill PDF Forms',action:'pdf-forms',detail:'Fill text fields, checkboxes and selections in a standard PDF form.'},
  {name:'Flatten PDF Forms',action:'pdf-flatten',detail:'Make existing form appearances fixed rather than interactive.'},
  {name:'PDF to Text',action:'pdf-text',detail:'Extract selectable text from PDF pages.'},
  {name:'Compress Scanned PDF',action:'pdf-compress',detail:'Create a smaller raster copy; text and form interactivity are flattened.'},
  {name:'PDF Merger',action:'pdf-merge',detail:'Reorder and combine multiple PDFs into one downloadable file on your device.'},
  {name:'Image to PDF',action:'image-pdf',detail:'Combine JPG, PNG or WebP images into a downloadable PDF on your device.'},
 ]},
 {title:'Excel tools',items:[{name:'Excel Merge',action:'excel-merge',detail:'Combine XLSX workbooks as separate sheets or stack rows with matching headers.'}]},
 {title:'Everyday tools',items:[
  {name:'Image Resizer',action:'resize',detail:'Resize an image locally in your browser; no upload required.'},
  {name:'Age Calculator',action:'age',detail:'Calculate age from a date of birth.'}
 ]},
];
const auditPlanningSteps=[
 {phase:'Acceptance & ethics',items:['Engagement acceptance or continuance assessed','Independence and ethical requirements considered','Engagement terms and scope agreed']},
 {phase:'Understand the entity',items:['Industry and business model understood','Applicable financial reporting framework identified','Relevant laws and regulations considered','Processes and internal control environment understood']},
 {phase:'Risk assessment',items:['Fraud brainstorming and team discussion completed','Material classes of transactions and balances identified','Risks of material misstatement assessed','Significant risks and related controls identified']},
 {phase:'Audit strategy',items:['Overall materiality and performance materiality documented','Audit approach and nature, timing and extent planned','Team responsibilities and specialist needs considered','Planned procedures responsive to assessed risks prepared']},
 {phase:'Documentation & review',items:['Planning documentation reviewed','Outstanding planning matters resolved']}
];
export default function TickyTools(){
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('PDF tools');
 const [planningChecks,setPlanningChecks]=useState({});
 const [completionChecks,setCompletionChecks]=useState({});
 const [sampling,setSampling]=useState({population:'',count:''});
 const [sampleResult,setSampleResult]=useState([]);
 const [tool,setTool]=useState('');
 const [materiality,setMateriality]=useState({benchmark:'Profit before tax',amount:'',rate:'5',performance:'75'});
 const [birth,setBirth]=useState('');
 const [imageFile,setImageFile]=useState(null);
 const [width,setWidth]=useState('800');
 const [result,setResult]=useState('');
 const [toolError,setToolError]=useState('');
 const today=new Date();
 const birthDate=birth?new Date(birth+'T00:00:00'):null;
 const validBirth=birthDate&&!Number.isNaN(birthDate.getTime())&&birthDate<=today;
 let ageText='';
 if(validBirth){let years=today.getFullYear()-birthDate.getFullYear(),months=today.getMonth()-birthDate.getMonth(),days=today.getDate()-birthDate.getDate();if(days<0){months--;days+=new Date(today.getFullYear(),today.getMonth(),0).getDate()}if(months<0){years--;months+=12}ageText=years+' years, '+months+' months, '+days+' days';}
 const resize=async()=>{
  if(!imageFile)return setToolError('Choose an image first.');
  const w=Number(width);
  if(!Number.isInteger(w)||w<32||w>5000)return setToolError('Enter a width between 32 and 5000 pixels.');
  setToolError('');
  try{
   const bmp=await createImageBitmap(imageFile);
   const h=Math.round(bmp.height*w/bmp.width);
   if(h>10000)throw Error('Resulting image is too tall.');
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   canvas.getContext('2d').drawImage(bmp,0,0,w,h);bmp.close();
   canvas.toBlob(blob=>{
    if(!blob){setToolError('Could not create the image.');return;}
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='resized-'+imageFile.name.replace(/\.[^.]+$/,'')+'.png';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    setResult('Resized image downloaded ('+w+' × '+h+' px).');
   },'image/png');
  }catch(e){setToolError(e.message||'Could not resize this image.')}
 };
 const toolPanel=<>
  <Suspense fallback={<div className="workspace-tool-panel" role="status">Loading TickyTools…</div>}>{tool==='pdf-ocr'&&<PdfOcr/>}{tool==='image-pdf'&&<ImageToPdf/>}{tool==='pdf-merge'&&<PdfMerger/>}{tool==='pdf-images'&&<PdfToImages/>}{tool==='pdf-editor'&&<PdfEditor/>}{tool==='excel-merge'&&<ExcelMerge/>}{tool==='pdf-forms'&&<PdfForms/>}{tool==='pdf-flatten'&&<PdfForms flattenOnly/>}{['pdf-organise','pdf-extract','pdf-split','pdf-crop'].includes(tool)&&<PdfPages key={tool} mode={tool.slice(4)}/>}{tool==='pdf-watermark'&&<PdfStamp mode="watermark"/>}{tool==='pdf-numbers'&&<PdfStamp mode="numbers"/>}{tool==='pdf-protect'&&<PdfSecurity/>}{tool==='pdf-unlock'&&<PdfSecurity unlock/>}{tool==='pdf-text'&&<PdfText/>}{tool==='pdf-compress'&&<PdfCompress/>}</Suspense>
  {tool==='audit-planning'&&<div className="workspace-tool-panel workspace-audit-planning"><h4>Audit Planning Checklist</h4><p>Generic educational planning checklist. It is not a substitute for engagement-specific methodology, professional judgment or review. Do not enter client information.</p><div className="workspace-planning-progress"><strong>{Object.values(planningChecks).filter(Boolean).length} / {auditPlanningSteps.reduce((n,p)=>n+p.items.length,0)} completed</strong><button type="button" onClick={()=>setPlanningChecks({})}>Reset checklist</button></div>{auditPlanningSteps.map((phase,i)=><fieldset key={phase.phase} className="workspace-planning-group"><legend>{i+1}. {phase.phase}</legend>{phase.items.map((item,j)=>{const id=i+'-'+j;return <label key={id}><input type="checkbox" checked={!!planningChecks[id]} onChange={e=>setPlanningChecks(prev=>({...prev,[id]:e.target.checked}))}/><span>{item}</span></label>})}</fieldset>)}<button type="button" onClick={()=>{const lines=['AUDIT PLANNING CHECKLIST','Generic reference only — do not include confidential information','',...auditPlanningSteps.flatMap((phase,i)=>[phase.phase,...phase.items.map((item,j)=>(planningChecks[i+'-'+j]?'[x] ':'[ ] ')+item),''])];const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='audit-planning-checklist.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}}>Download checklist (.txt)</button><p className="workspace-disclaimer">Checklist progress is held in this page only and resets when reloaded. No information is sent to the server.</p></div>}
  {tool==='risk-matrix'&&<div className="workspace-tool-panel"><h4>Risk Assessment & Assertions Matrix</h4><p>General reference only. Select an area to view commonly relevant assertions; actual risks and procedures require engagement-specific judgment.</p><div className="workspace-reference-grid">{[['Revenue','Occurrence, completeness, accuracy, cut-off, classification'],['Receivables','Existence, rights, valuation, completeness, presentation'],['Inventory','Existence, completeness, rights, valuation, presentation'],['Payables','Completeness, existence, obligations, accuracy, cut-off'],['Cash','Existence, rights, completeness, accuracy'],['Expenses','Occurrence, completeness, accuracy, cut-off, classification']].map(([area,assertions])=><article key={area}><strong>{area}</strong><p>{assertions}</p></article>)}</div><p className="workspace-disclaimer">No confidential client information should be entered here.</p></div>}
  {tool==='completion'&&<div className="workspace-tool-panel workspace-audit-planning"><h4>Audit Completion Checklist</h4><p>Generic educational checklist; follow your firm's methodology and reviewer requirements.</p><div className="workspace-planning-progress"><strong>{Object.values(completionChecks).filter(Boolean).length} / 8 completed</strong><button type="button" onClick={()=>setCompletionChecks({})}>Reset checklist</button></div><fieldset className="workspace-planning-group"><legend>Completion and reporting</legend>{['Evaluate uncorrected misstatements','Complete subsequent events procedures','Evaluate going concern','Obtain required written representations','Review financial statement disclosures','Resolve outstanding review notes','Assess overall evidence and conclusions','Complete reporting and final documentation'].map((item,i)=><label key={item}><input type="checkbox" checked={!!completionChecks[i]} onChange={e=>setCompletionChecks(p=>({...p,[i]:e.target.checked}))}/><span>{item}</span></label>)}</fieldset><button type="button" onClick={()=>{const items=['AUDIT COMPLETION CHECKLIST','Generic reference only','',...['Evaluate uncorrected misstatements','Complete subsequent events procedures','Evaluate going concern','Obtain required written representations','Review financial statement disclosures','Resolve outstanding review notes','Assess overall evidence and conclusions','Complete reporting and final documentation'].map((x,i)=>(completionChecks[i]?'[x] ':'[ ] ')+x)];const a=document.createElement('a'),url=URL.createObjectURL(new Blob([items.join('\n')],{type:'text/plain'}));a.href=url;a.download='audit-completion-checklist.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}}>Download checklist (.txt)</button></div>}
  {tool==='sampling'&&<div className="workspace-tool-panel"><h4>Random Index Selector</h4><p>Generate unique random item numbers for a numbered population. This does not calculate an appropriate audit sample size or guarantee representativeness.</p><div className="workspace-materiality-fields"><label>Population size<input type="number" min="1" max="1000000" step="1" value={sampling.population} onChange={e=>setSampling(p=>({...p,population:e.target.value}))}/></label><label>Number to select<input type="number" min="1" max="500" step="1" value={sampling.count} onChange={e=>setSampling(p=>({...p,count:e.target.value}))}/></label></div><button type="button" onClick={()=>{const n=Number(sampling.population),k=Number(sampling.count);if(!Number.isSafeInteger(n)||n<1||n>1000000||!Number.isSafeInteger(k)||k<1||k>500||k>n){setToolError('Enter a population of 1–1,000,000 and a selection count of 1–500 not exceeding the population.');setSampleResult([]);return}const selected=new Set();const random=new Uint32Array(1);while(selected.size<k){crypto.getRandomValues(random);const limit=Math.floor(4294967296/n)*n;if(random[0]<limit)selected.add(random[0]%n+1)}setSampleResult([...selected].sort((a,b)=>a-b));setToolError('')}}>Generate indices</button>{toolError&&<p role="alert">{toolError}</p>}{sampleResult.length>0&&<div className="workspace-result" role="status"><strong>Selected indices ({sampleResult.length}):</strong><p>{sampleResult.join(', ')}</p><button type="button" onClick={()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([sampleResult.join('\n')],{type:'text/plain'}));a.href=url;a.download='random-indices.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}}>Download indices</button></div>}</div>}
  {tool==='materiality'&&<div className="workspace-tool-panel" aria-label="Audit materiality calculator"><h4>Audit Materiality Calculator</h4><p>Illustrative planning aid only; actual benchmark and percentage require professional judgment and engagement methodology.</p><div className="workspace-materiality-fields"><label>Benchmark<select value={materiality.benchmark} onChange={e=>setMateriality(p=>({...p,benchmark:e.target.value}))}>{['Profit before tax','Revenue','Total assets','Total expenses','Equity','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Benchmark amount (BDT)<input type="number" min="0" step="any" placeholder="e.g. 10000000" value={materiality.amount} onChange={e=>setMateriality(p=>({...p,amount:e.target.value}))}/></label><label>Overall materiality rate (%)<input type="number" min="0.01" max="100" step="0.01" value={materiality.rate} onChange={e=>setMateriality(p=>({...p,rate:e.target.value}))}/></label><label>Performance materiality (% of overall)<input type="number" min="1" max="100" step="1" value={materiality.performance} onChange={e=>setMateriality(p=>({...p,performance:e.target.value}))}/></label></div>{(()=>{const amount=Number(materiality.amount),rate=Number(materiality.rate),performance=Number(materiality.performance),valid=materiality.amount.trim()!==''&&Number.isFinite(amount)&&amount>=0&&Number.isFinite(rate)&&rate>0&&rate<=100&&Number.isFinite(performance)&&performance>0&&performance<=100;if(!valid)return <p role="status">Enter valid amounts and percentages to calculate materiality.</p>;const overall=amount*rate/100,pm=overall*performance/100;const fmt=n=>new Intl.NumberFormat('en-BD',{maximumFractionDigits:2}).format(n);return <div className="workspace-materiality-result" role="status"><div><span>Overall materiality</span><strong>BDT {fmt(overall)}</strong></div><div><span>Performance materiality</span><strong>BDT {fmt(pm)}</strong></div><small>Formula: benchmark × materiality rate; overall materiality × performance materiality percentage. No client data is stored or transmitted by this calculator.</small></div>})()}</div>}
  {tool==='age'&&<div className="workspace-tool-panel"><h4>Age Calculator</h4><label>Date of birth <input type="date" max={today.toLocaleDateString('en-CA')} value={birth} onChange={e=>setBirth(e.target.value)}/></label>{validBirth&&<p className="workspace-result">Age: <strong>{ageText}</strong></p>}{birth&&!validBirth&&<p role="alert">Choose a valid past date.</p>}</div>}
  {tool==='resize'&&<div className="workspace-tool-panel"><h4>Image Resizer</h4><p>Images are processed on your device; they are not uploaded to this portfolio.</p><label>Select image <input type="file" accept="image/*" onChange={e=>{setImageFile(e.target.files?.[0]||null);setToolError('');setResult('')}}/></label><label>Output width (pixels) <input type="number" min="32" max="5000" value={width} onChange={e=>setWidth(e.target.value)}/></label><button type="button" onClick={resize}>Resize & download PNG</button>{toolError&&<p role="alert">{toolError}</p>}{result&&<p className="workspace-result" role="status">{result}</p>}</div>}
 </>;
 return <div className="workspace-directory">
  <div className="tickytools-banner"><div><span className="tickytools-wordmark">TickyTools</span><h3>Your private document workspace</h3><p>PDF, spreadsheets and everyday tools. Files are processed on your device.</p></div><a href="/tickytools" target="_blank" rel="noopener noreferrer">Open in a new tab ↗</a></div>
  <div className="tickytools-controls">
   <label>Category<select aria-label="Category" value={category} onChange={e=>{setCategory(e.target.value);setTool('');setSearch('')}}><option>All tools</option>{workspaceGroups.map(group=><option key={group.title}>{group.title}</option>)}</select></label>
   <label>Jump to a tool<select aria-label="Jump to a tool" value={tool} onChange={e=>{const action=e.target.value;setTool(action);const group=workspaceGroups.find(g=>g.items.some(i=>i.action===action));setSearch(group?.items.find(i=>i.action===action)?.name||'');if(group)setCategory(group.title);setToolError('');setResult('')}}><option value="">Choose a tool…</option>{workspaceGroups.map(group=><optgroup label={group.title} key={group.title}>{group.items.map(item=><option value={item.action} key={item.action}>{item.name}</option>)}</optgroup>)}</select></label>
   <label className="workspace-search">Search tools<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PDFs, Excel, audit…"/></label>
  </div>
  {workspaceGroups.filter(group=>category==='All tools'||group.title===category).map(group=>{
   const items=group.items.filter(x=>(x.name+' '+group.title+' '+(x.detail||'')).toLowerCase().includes(search.trim().toLowerCase()));
   return items.length>0&&<section className="workspace-category" key={group.title}><h4>{group.title}</h4><div className="workspace-tool-grid">{items.map(item=>{
    const expanded=!!item.action&&tool===item.action;
    return <div className={'workspace-tool-item'+(expanded?' is-expanded':'')} key={item.name}>
     <article className="workspace-tool"><div><strong>{item.name}</strong>{item.detail&&<small>{item.detail}</small>}</div>{item.action?<button type="button" aria-expanded={expanded} aria-controls={'tickytool-'+item.action} onClick={()=>{setTool(expanded?'':item.action);setToolError('');setResult('')}}>{expanded?'Close':'Open tool'} {expanded?'−':'+'}</button>:item.url?<a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={'Open '+item.name+' in a new tab'}>Official site ↗</a>:<span className="workspace-coming-soon">Planned</span>}</article>
     {expanded&&<div id={'tickytool-'+item.action} className="workspace-inline-panel" role="region" aria-label={item.name}>{toolPanel}</div>}
    </div>;
   })}</div></section>;
  })}
  <p className="workspace-disclaimer">Files stay on your device. Keep a copy of original documents before editing.</p>
 </div>;
}
