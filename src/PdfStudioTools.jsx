import {lazy,Suspense} from 'react';
const Advanced=loader=>lazy(()=>import('./AdvancedPdfTools.jsx').then(module=>({default:module[loader]})));
const PdfToImages=Advanced('PdfToImages'),PdfPages=Advanced('PdfPages'),PdfStamp=Advanced('PdfStamp'),PdfSecurity=Advanced('PdfSecurity'),PdfText=Advanced('PdfText'),PdfCompress=Advanced('PdfCompress');
const PdfForms=lazy(()=>import('./PdfForms.jsx'));
const PdfOcr=lazy(()=>import('./PdfOcr.jsx'));
const PdfMerger=lazy(()=>import('./PdfTools.jsx').then(module=>({default:module.PdfMerger})));
const ImageToPdf=lazy(()=>import('./PdfTools.jsx').then(module=>({default:module.ImageToPdf})));
export default function PdfStudioTools({action,initialFile,onResult,onBusyChange}){
 const props={initialFile,onResult,onBusyChange};
 return <Suspense fallback={<p role="status">Opening local PDF tool…</p>}>
 {action==='pdf-images'&&<PdfToImages {...props}/>}{['pdf-organise','pdf-extract','pdf-split','pdf-crop'].includes(action)&&<PdfPages {...props} mode={action.slice(4)}/>}
 {action==='pdf-watermark'&&<PdfStamp {...props} mode="watermark"/>}{action==='pdf-numbers'&&<PdfStamp {...props} mode="numbers"/>}{action==='pdf-protect'&&<PdfSecurity {...props}/>}{action==='pdf-unlock'&&<PdfSecurity {...props} unlock/>}{action==='pdf-text'&&<PdfText {...props}/>}{action==='pdf-compress'&&<PdfCompress {...props}/>}{action==='pdf-forms'&&<PdfForms {...props}/>}{action==='pdf-flatten'&&<PdfForms {...props} flattenOnly/>}{action==='pdf-ocr'&&<PdfOcr {...props}/>}{action==='pdf-merge'&&<PdfMerger {...props}/>}{action==='image-pdf'&&<ImageToPdf {...props}/>}
 </Suspense>;
}
