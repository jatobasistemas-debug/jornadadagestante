export function PublicEntry() {
  return <section className="public-entry" aria-labelledby="entry-title">
    <p className="eyebrow">Diferentes começos. O mesmo cuidado.</p>
    <h2 id="entry-title">Uma jornada para chamar de sua.</h2>
    <div className="entry-paths">
      <section><span className="entry-number" aria-hidden="true">01</span><h3>Começar minha Jornada</h3>
        <p>Um espaço para acompanhar sua gestação, no seu tempo.</p>
        <p className="form-note">A assinatura individual estará disponível em breve.</p>
      </section>
      <section><span className="entry-number" aria-hidden="true">02</span><h3>Tenho acesso por uma clínica/parceiro</h3>
        <p>Abra o link ou o QR Code enviado pela sua clínica para criar sua conta com ela.</p>
        <p className="form-note">O acesso por código de parceiro será disponibilizado mais adiante.</p>
      </section>
    </div>
    <a href="#acesso-existente" className="entry-login">Já tenho uma conta · Entrar</a>
  </section>;
}
