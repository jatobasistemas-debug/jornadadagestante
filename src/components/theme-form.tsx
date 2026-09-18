'use client';
import type {Clinic} from '@/lib/access';import {ThemeEditor} from './theme-editor';
export function ThemeForm({clinic}:{clinic:Clinic;updatedAt?:string}){return <ThemeEditor slug={clinic.slug} initial={clinic.tokens} logo={clinic.logo_url} identity={clinic}/>;}
