import {bookingLink, type ClinicService} from '@/lib/contextual-services';

export function ContextualServices({services, emptyMessage, showLinks = false}: {
  services: ClinicService[]; emptyMessage: string; showLinks?: boolean;
}) {
  return <div className="contextual-services">
    {services.length ? <><p className="muted">Disponível na sua clínica</p><ul>{services.map(service => {
      const href = showLinks ? bookingLink(service.booking_url) : undefined;
      return <li key={service.id}>{href ? <a href={href}>{service.name}<span className="service-channel">{href.startsWith('tel:') ? 'Ligar para a clínica' : 'Ver canal de atendimento'} <span aria-hidden="true">↗</span></span></a> : service.name}</li>;
    })}</ul></> : <p>{emptyMessage}</p>}
    <p className="form-note">A necessidade e o momento de cada atendimento são definidos com sua equipe.</p>
  </div>;
}
