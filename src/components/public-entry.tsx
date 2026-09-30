export function PublicEntry() {
  return <section className="public-entry" aria-labelledby="entry-title">
    <p className="eyebrow">Diferentes começos. O mesmo cuidado.</p>
    <h2 id="entry-title">Uma jornada para chamar de sua.</h2>
    <div className="entry-paths">
      <section><span className="entry-number" aria-hidden="true">01</span><h3>Começar minha Jornada</h3>
        <p>Um espaço para acompanhar sua gestação, no seu tempo.</p>
        <a className="button" href="/comecar">Começar minha Jornada</a>
      </section>
      <section><span className="entry-number" aria-hidden="true">02</span><h3>Tenho acesso por uma clínica/parceiro</h3>
        <p>Abra o link ou o QR Code enviado pela sua clínica para criar sua conta com ela.</p>
        <a className="button secondary" href="/parceiro">Usar meu acesso de parceiro</a>
      </section>
    </div>
    <a href="#acesso-existente" className="entry-login">Já tenho uma conta · Entrar</a>
  </section>;
}
