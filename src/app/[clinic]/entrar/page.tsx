import {redirect} from 'next/navigation';import {slugSchema} from '@/lib/validation';import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{clinic:string}>}){const {clinic}=await params;if(!slugSchema.safeParse(clinic).success)notFound();redirect(`/${clinic}`);}
