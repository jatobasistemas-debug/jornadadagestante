import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signupDiagnostic} from '../src/lib/auth-diagnostics';
test('signup diagnostics preserve the provider error without extra response fields',()=>{
 assert.deepEqual(signupDiagnostic({name:'AuthApiError',status:500,code:'unexpected_failure',message:'Database error saving new user'},[]),{event:'auth.signup.failed',name:'AuthApiError',status:500,code:'unexpected_failure',message:'Database error saving new user'});
});
test('signup diagnostics redact submitted values, email, tokens and URLs',()=>{
 const message='Nome Teste secret-password 2026-12-01 person@example.org sb_secret_abcd https://example.org/callback?code=private\nerror';
 const log=signupDiagnostic({name:'AuthApiError',message},['Nome Teste','secret-password','2026-12-01']);
 for(const secret of ['Nome Teste','secret-password','2026-12-01','person@example.org','sb_secret_abcd','code=private','\n'])assert.ok(!log.message.includes(secret));
 assert.equal(log.code,null);
});
