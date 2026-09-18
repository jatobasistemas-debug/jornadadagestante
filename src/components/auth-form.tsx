'use client';
import {LoginForm} from './login-form';import {SignupForm} from './signup-form';import {RecoveryForm} from './recovery-form';
export function AuthForm({mode,slug}:{mode:'login'|'register'|'recover'|'password';slug?:string}){if(mode==='login')return <LoginForm/>;if(mode==='register'&&slug)return <SignupForm slug={slug}/>;return <RecoveryForm reset={mode==='password'}/>;}
