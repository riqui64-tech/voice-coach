const PRIMARY=process.env.VOICE_OBSERVER_MODEL||'openai/gpt-5.6-luna';
const FALLBACK='openai/gpt-5.4';

async function probe(token,model){
  const started=Date.now();
  try{
    const r=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({model,stream:false,max_tokens:2,messages:[{role:'user',content:'Reply OK'}]})
    });
    const latencyMs=Date.now()-started;
    if(!r.ok){
      let detail='';
      try{detail=(await r.text()).slice(0,220)}catch{}
      return {ok:false,model,status:r.status,latencyMs,detail};
    }
    return {ok:true,model,status:r.status,latencyMs};
  }catch(e){
    return {ok:false,model,status:0,latencyMs:Date.now()-started,detail:e?.message||'request failed'};
  }
}

module.exports=async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});
  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!token)return res.status(500).json({ok:false,token:false,gateway:false,error:'AI gateway token missing'});

  const primary=await probe(token,PRIMARY);
  if(primary.ok){
    return res.status(200).json({ok:true,ready:true,degraded:false,token:true,gateway:true,activeModel:PRIMARY,primary,fallback:null,message:'Primary AI model ready'});
  }

  const fallback=await probe(token,FALLBACK);
  if(fallback.ok){
    return res.status(200).json({ok:true,ready:true,degraded:true,token:true,gateway:true,activeModel:FALLBACK,primary,fallback,message:'Primary model unavailable; fallback AI model ready'});
  }

  return res.status(502).json({ok:false,ready:false,degraded:false,token:true,gateway:false,primary,fallback,error:'AI gateway reachable but no configured model responded successfully'});
};