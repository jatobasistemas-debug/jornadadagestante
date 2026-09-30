import {securityEmail, welcomeEmail} from './email-templates';

/** Transactional messages do not depend on the optional weekly opt-in. */
export function transactionalEmail(kind: string, origin: string) {
  if (kind === 'welcome') return welcomeEmail(`${origin}/acesso`);
  if (kind === 'security') return securityEmail(`${origin}/auth/recuperar`);
  if (kind === 'weekly') return null;
  throw new Error('EMAIL_UNKNOWN_KIND');
}

export function shouldScheduleWeekly(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'short',
  }).format(now) === 'Sun';
}
