export type AccessStatus='trial'|'active'|'sponsored'|'past_due'|'cancelled'|'expired';
export const accessLabels:Record<AccessStatus,string>={trial:'Período de experiência',active:'Ativa',sponsored:'Patrocinada',past_due:'Aguardando pagamento',cancelled:'Cancelada',expired:'Encerrada'};
export function effectiveStatus(value:{status:AccessStatus;ends_at:string|null},now=new Date()):AccessStatus {
 return ['trial','active','sponsored'].includes(value.status)&&value.ends_at&&new Date(value.ends_at)<=now?'expired':value.status;
}
export interface PaymentProvider {
 createCheckout(input:{userId:string;planId:string;idempotencyKey:string}):Promise<{url:string;reference:string}>;
 verifyEvent(body:string,signature:string):Promise<{reference:string;status:AccessStatus}>;
}
export function paymentProvider():PaymentProvider|null{return null;}
export function money(cents:number|null){return cents===null?'Preço a definir':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);}
