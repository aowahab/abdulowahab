export function assistantToolIntent(text){
 const value=text.toLowerCase();
 if(/^(what|why|how|explain|tell|does|did|has|is|কি |কী |কেন )/.test(value))return'';
 if(/\bpdf\b/.test(value)){for(const[pattern,id]of [[/merge|marge|combine|jora|জোড়া|মার্জ/,'pdf-merge'],[/split|ভাগ/,'pdf-split'],[/compress|size kom|সাইজ কম/,'pdf-compress'],[/image|ছবি/,'pdf-images'],[/ocr|scan|স্ক্যান/,'pdf-ocr'],[/watermark/,'pdf-watermark'],[/rotate|reorder|organis/,'pdf-organise']])if(pattern.test(value))return id;return 'pdf-editor'}
 if(/excel.*merge|xlsx.*merge|এক্সেল.*মার্জ/.test(value))return'excel-merge';
 if(/(?:image|pic|photo|ছবি).*(?:resiz|crop|kb|সাইজ)|(?:resiz|crop).*(?:pic|image|photo)/.test(value))return'resize';
 if(/materiality|ম্যাটেরিয়ালিটি/.test(value))return'materiality';
 if(/(?:bank.*recon|ব্যাংক.*রিকন)/.test(value))return'bank-recon';
 if(/^(?:open |show |use )?(?:tickytools|tools|টুলস)(?: খোলো| খুলে দাও| kholo| open)?[.!]?$/.test(value))return'directory';
 return'';
}
