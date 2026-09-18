 'use client';
import {useActionState} from 'react';
import {login} from '@/app/auth/actions';
import {Submit} from './submit';
export function LoginForm(){const [state,action]=useActionState(login,{});return <form action={action} className="form"><label>E-mail<input name="email" type="email" required autoComplete="email" maxLength={254}/></label><label>Senha<input name="password" type="password" required autoComplete="current-password" maxLength={128}/></label>{state.error&&<p className="error" role="alert">{state.error}</p>}<Submit>Entrar</Submit><a href="/auth/recuperar">Esqueci minha senha</a></form>;}
