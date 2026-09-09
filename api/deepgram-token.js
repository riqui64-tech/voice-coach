module.exports=async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
  const key=process.env.DEEPGRAM_API_KEY;
  if(!key)return res.status(503).json({ok:false,configured:false,error:'DEEPGRAM_API_KEY is not configured'});
  try{
    const r=await fetch('https://api.deepgram.com/v1/auth/grant',{
      method:'POST',
      headers:{Authorization:'Token '+key,'Content-Type':'application/json'},
      body:JSON.stringify({ttl_seconds:3600})
    });
    const text=await r.text();
    if(!r.ok)return res.status(r.status).json({ok:false,configured:true,error:text||'Token grant failed'});
    let data;try{data=JSON.parse(text)}catch{return res.status(502).json({ok:false,configured:true,error:'Invalid token response'})}
    if(!data.access_token)return res.status(502).json({ok:false,configured:true,error:'No temporary token returned'});
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ok:true,configured:true,access_token:data.access_token,expires_in:data.expires_in||3600});
  }catch(e){return res.status(502).json({ok:false,configured:true,error:e?.message||'Token service unavailable'})}
};