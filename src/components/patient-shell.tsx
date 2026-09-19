import {BrandShell} from './brand-shell';
import {PatientNavigation} from './patient-navigation';
import type {Clinic} from '@/lib/access';
export function PatientShell({clinic,current,children}:{clinic:Clinic;current:'gestante'|'gestante/jornada'|'conta';children:React.ReactNode}){
 return <div className="patient-area"><BrandShell clinic={clinic} signedIn>{children}<PatientNavigation slug={clinic.slug} current={current}/></BrandShell></div>;
}
