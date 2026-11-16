export async function studyApi(op,body,extra=''){
 const r=await fetch('/api/study?op='+op+extra,body===undefined?{credentials:'same-origin'}:{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await r.json();if(!r.ok)throw Error(data.error||'Study request failed');return data;
}
