import {z} from 'zod';
export const profileInput=z.object({full_name:z.string().trim().min(1,'Informe seu nome.').max(160),preferred_name:z.string().trim().max(80)});
