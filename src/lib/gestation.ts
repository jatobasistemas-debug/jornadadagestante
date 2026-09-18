const DAY=86400000;
export function gestation(due:string,today=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(today);
 const date=['year','month','day'].map(k=>parts.find(p=>p.type===k)!.value).join('-');
 const end=Date.parse(due+'T00:00:00Z');
 if(!Number.isFinite(end)||new Date(end).toISOString().slice(0,10)!==due)return null;
 const days=280+Math.round((Date.parse(date+'T00:00:00Z')-end)/DAY);
 if(days<0||days>300)return null;
 const week=Math.floor(days/7);
 return {week,day:days%7,trimester:week<13?1:week<28?2:3,progress:Math.min(100,days/280*100)};
}
