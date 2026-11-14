function cellValue(cell){const value=cell.value;if(value==null)return null;if(value instanceof Date)return new Date(value);if(typeof value==='object'){if('formula'in value||'sharedFormula'in value){if(value.result==null)throw Error('A formula has no saved result. Recalculate and save that workbook in Excel first.');return value.result}if(value.richText)return value.richText.map(r=>r.text).join('');if(value.hyperlink)return value.text||value.hyperlink;if(value.error)return value.error;return String(value.text||'')}return value}
export async function mergeExcelFiles(files,mode='sheets'){
 if(files.length<2||files.length>10||files.some(f=>!/\.xlsx$/i.test(f.name)||f.size>20*1024*1024)||files.reduce((n,f)=>n+f.size,0)>50*1024*1024)throw Error('Choose 2–10 XLSX files, up to 20 MB each and 50 MB total.');
 const ExcelJS=(await import('exceljs')).default;const output=new ExcelJS.Workbook();const combined=mode==='rows'?output.addWorksheet('Merged data'):null;let headers=null,cells=0,rows=0;const names=new Set();
 for(const file of files){const workbook=new ExcelJS.Workbook();try{await workbook.xlsx.load(await file.arrayBuffer())}catch{throw Error(`Could not read “${file.name}”. Use an unlocked XLSX file.`)}
  for(const sheet of workbook.worksheets){if(!sheet.actualRowCount)continue;let target=combined;
   if(!target){let name=(file.name.replace(/\.xlsx$/i,'')+' - '+sheet.name).replace(/[\\/*?:\[\]]/g,' ').slice(0,31)||'Sheet';let unique=name,n=2;while(names.has(unique.toLowerCase()))unique=name.slice(0,26)+' '+n++;names.add(unique.toLowerCase());target=output.addWorksheet(unique)}
   let first=true;sheet.eachRow({includeEmpty:false},row=>{const values=[];for(let col=1;col<=row.cellCount;col++){cells++;if(cells>200000)throw Error('Merge up to 200,000 cells at a time.');values.push(cellValue(row.getCell(col)))}
    if(mode==='rows'&&first){const current=values.map(v=>String(v??'').trim());if(headers&&JSON.stringify(headers)!==JSON.stringify(current))throw Error(`Headers differ in “${file.name} / ${sheet.name}”. Use separate-sheets mode or align the headers.`);first=false;if(headers)return;headers=current}
    const added=target.addRow(values);for(let col=1;col<=values.length;col++)added.getCell(col).numFmt=row.getCell(col).numFmt;rows++;
   });
  }
 }
 if(!rows)throw Error('No populated sheets were found.');return {bytes:await output.xlsx.writeBuffer(),rows,sheets:output.worksheets.length};
}
