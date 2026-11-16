export const pdfToolCategories=[
 {name:'Create & combine',tools:[{id:'pdf-merge',name:'PDF Merger'},{id:'image-pdf',name:'Image to PDF'}]},
 {name:'Pages',tools:[{id:'pdf-organise',name:'Organise pages'},{id:'pdf-extract',name:'Extract pages'},{id:'pdf-split',name:'Split PDF'},{id:'pdf-crop',name:'Crop margins'}]},
 {name:'Convert & recognise',tools:[{id:'pdf-images',name:'PDF to Image'},{id:'pdf-text',name:'PDF to Text'},{id:'pdf-ocr',name:'Scan to Text (OCR)'}]},
 {name:'Forms & stamps',tools:[{id:'pdf-forms',name:'Fill PDF forms'},{id:'pdf-flatten',name:'Flatten PDF forms'},{id:'pdf-watermark',name:'Watermark'},{id:'pdf-numbers',name:'Page numbers'}]},
 {name:'Optimise & protect',tools:[{id:'pdf-compress',name:'Compress scanned PDF'},{id:'pdf-protect',name:'Password protect'},{id:'pdf-unlock',name:'Unlock with password'}]}
];
export const pdfToolById=Object.fromEntries(pdfToolCategories.flatMap(group=>group.tools.map(tool=>[tool.id,tool])));
