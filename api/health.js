const MODEL=process.env.VOICE_OBSERVER_MODEL||'openai/gpt-5.6-luna-fast';
module.exports=async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});
  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!token)return res.status(500).json({ok:false,token:false,gateway:false,error:'AI gateway token missing'});
  const started=Date.now();
  try{
    const r=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,stream:false,max_tokens:1,temperature:0,messages:[{role:'user',content:'Reply OK'}]})});
    if(!r.ok)return res.status(502).json({ok:false,token:true,gateway:false,status:r.status,latencyMs:Date.now()-started});
    return res.status(200).json({ok:true,token:true,gateway:true,model:MODEL,latencyMs:Date.now()-started});
  }catch(e){return res.status(502).json({ok:false,token:true,gateway:false,error:e?.message||'Gateway check failed',latencyMs:Date.now()-started})}
};