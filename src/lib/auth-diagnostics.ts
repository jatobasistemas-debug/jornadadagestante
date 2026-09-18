// Only allowlisted error fields may reach server logs. Never log Auth responses,
// form data, users, sessions, headers or cookies.
export function signupDiagnostic(error:{name:string;message:string;status?:number;code?:string},sensitiveValues:string[]){
 const redact=(text:string)=>{
  let value=text;
  for(const secret of [...sensitiveValues].filter(Boolean).sort((a,b)=>b.length-a.length))value=value.split(secret).join('[redacted]');
  return value.replace(/https?:\/\/\S+/gi,'[url]')
   .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]')
   .replace(/(?:eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sb_(?:secret|publishable)_[A-Za-z0-9_-]+)/g,'[token]')
   .replace(/[\r\n\t]/g,' ').slice(0,500);
 };
 return {event:'auth.signup.failed',name:redact(error.name),status:error.status??null,code:error.code?redact(error.code):null,message:redact(error.message)};
}
