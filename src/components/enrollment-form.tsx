'use client';
import {useActionState} from 'react';
import {enroll,redeem} from '@/app/comecar/actions';
import {Submit} from './submit';
import {money} from '@/lib/subscriptions';
export function EnrollmentForm({code='',referral='',plans=[]}:{code?:string;referral?:string;plans?:{code:string;name:string;price_cents:number|null;trial_days:number}[]}){
 const [state,action]=useActionState(enroll,{});
 return <form action={action} className="form"><input type="hidden" name="partner_code" value={code}/><input type="hidden" name="referral_code" value={referral}/>
 {!code&&<label>Plano<select name="plan_code" required>{plans.map(p=><option value={p.code} key={p.code}>{p.name} · {money(p.price_cents)}{p.trial_days?` · ${p.trial_days} dias de experiência`:''}</option>)}</select></label>}
 <label>Seu nome<input name="full_name" required minLength={2} maxLength={160} autoComplete="name"/></label>
 <label>E-mail<input name="email" type="email" maxLength={254} required autoComplete="email"/></label>
 <label>Senha<input name="password" type="password" minLength={10} maxLength={128} autoComplete="new-password" required/><small>Use ao menos 10 caracteres.</small></label>
 <label>Qual data você sabe?<select name="date_type"><option value="due_date">Data prevista do parto</option><option value="last_menstrual_period">Última menstruação</option></select></label>
 <label>Data<input name="date" type="date" required/></label>
 <label className="check"><input type="checkbox" name="terms" required/><span>Aceito os <a href="/termos" target="_blank" rel="noreferrer">termos de uso</a>.</span></label>
 <label className="check"><input type="checkbox" name="privacy" required/><span>Aceito a <a href="/privacidade" target="_blank" rel="noreferrer">política de privacidade</a>.</span></label>
 <label className="check"><input type="checkbox" name="sensitive" required/><span>Autorizo o tratamento dos meus dados de gestação para oferecer minha Jornada e, quando houver vínculo, o acompanhamento operacional pela clínica. Meus registros pessoais continuam privados.</span></label>
 {!code&&<p className="form-note">Não há cobrança nesta tela. A assinatura ficará aguardando pagamento, ou em experiência quando o plano oferecer esse período. Nenhum pagamento será considerado aprovado.</p>}
 {state.error&&<p role="alert" className="error">{state.error}</p>}{state.success&&<p role="status" className="message">{state.success}</p>}<Submit>Criar minha Jornada</Submit></form>;
}
export function RedeemForm(){const [state,action]=useActionState(redeem,{});return <form action={action} className="form"><label>Código da clínica/parceiro<input name="code" minLength={8} maxLength={32} pattern="[a-zA-Z0-9]{8,32}" autoCapitalize="characters" required/></label>{state.error&&<p role="alert" className="error">{state.error}</p>}<Submit>Ativar acesso patrocinado</Submit></form>;}
