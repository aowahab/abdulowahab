// Sends a pre-approved WhatsApp template to the portfolio owner.
// Never expose Meta credentials to browsers or include visitor contact details in template text.
export async function notifyOwnerWhatsApp({id,kind}) {
 const token=process.env.WHATSAPP_ACCESS_TOKEN;
 const phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID;
 const to=process.env.WHATSAPP_NOTIFY_TO;
 const template=process.env.WHATSAPP_TEMPLATE_NAME;
 const lang=process.env.WHATSAPP_TEMPLATE_LANGUAGE||'en_US';
 if(!token||!phoneId||!to||!template)return {sent:false,reason:'not_configured'};
 if(!/^\d{8,15}$/.test(to)||!/^\d+$/.test(phoneId))return {sent:false,reason:'invalid_config'};
 const body={messaging_product:'whatsapp',to,type:'template',template:{name:template,language:{code:lang}}};
 // The approved template must have NO dynamic body parameters.
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
 try{
  const res=await fetch('https://graph.facebook.com/v22.0/'+encodeURIComponent(phoneId)+'/messages',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!res.ok){console.error('WhatsApp notification rejected',res.status);return {sent:false,reason:'provider_rejected'}}
  return {sent:true};
 }catch(e){console.error('WhatsApp notification failed',e?.name);return {sent:false,reason:'network_error'}}
 finally{clearTimeout(timer)}
}
