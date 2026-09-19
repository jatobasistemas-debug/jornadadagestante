import {requireClinic} from '@/lib/access';
import {PatientShell} from '@/components/patient-shell';
import {bookingLink} from '@/lib/contextual-services';
export const metadata={title:'Minha Clínica'};
export default async function MyClinic({params}:{params:Promise<{clinic:string}>}){
 const {clinic:slug}=await params;
 const {db,clinic}=await requireClinic(slug,['patient']);
 const services=await db.from('clinic_services').select('id,name,booking_url').eq('clinic_id',clinic.id).eq('active',true).order('name');
 if(services.error)throw new Error('Não foi possível carregar os serviços da sua clínica.');
 const phone=clinic.phone?.replace(/[^+0-9]/g,''),whatsapp=clinic.whatsapp?.replace(/[^0-9]/g,'');
 const instagram=bookingLink(clinic.instagram),website=bookingLink(clinic.website);
 return <PatientShell clinic={clinic} current="gestante/clinica"><main id="conteudo" className="journey-page journey-compose"><section className="journey-opening"><p className="eyebrow">Perto de quem cuida</p>{clinic.logo_url&&<img className="clinic-logo" src={clinic.logo_url} alt={`Logo de ${clinic.name}`}/>}<h1>{clinic.name}</h1>{clinic.slogan&&<p className="journey-intro">{clinic.slogan}</p>}<p>Este é o espaço da clínica que acompanha sua Jornada.</p></section>
 <section className="clinic-contact" aria-label="Contato e localização"><h2>Para encontrar sua clínica</h2>{clinic.address&&<p>{clinic.address}</p>}{clinic.city&&<p>{clinic.city}</p>}{phone&&<a href={`tel:${phone}`}>Telefone: {clinic.phone}</a>}{whatsapp&&<a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Conversar pelo WhatsApp</a>}{instagram&&<a href={instagram} target="_blank" rel="noreferrer">Instagram</a>}{!instagram&&clinic.instagram&&<p>Instagram: {clinic.instagram}</p>}{website&&<a href={website} target="_blank" rel="noreferrer">Site da clínica</a>}{!clinic.address&&!phone&&!whatsapp&&!clinic.city&&<p>As informações de contato ainda não foram cadastradas.</p>}</section>
 <section className="journey-empty"><p className="eyebrow">Seu cuidado</p><h2>Serviços disponíveis</h2>{services.data.length?<ul className="clinic-contact">{services.data.map(service=><li key={service.id}><h3>{service.name}</h3>{bookingLink(service.booking_url)&&<a href={bookingLink(service.booking_url)} target="_blank" rel="noreferrer">Consultar atendimento</a>}</li>)}</ul>:<p>A clínica ainda não publicou seus serviços neste espaço.</p>}<p className="form-note">A disponibilidade e os detalhes do atendimento são confirmados diretamente com a clínica.</p></section>
 </main></PatientShell>;
}
