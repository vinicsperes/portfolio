export function CallMe() {
  return (
    <section id="sobre" className="relative overflow-hidden px-4 py-16 lg:py-24">
      <div className="relative mx-auto max-w-5xl">
        {/* cápsula (container menor) */}
        <div className="relative rounded-[64px] border-[3px] border-ink bg-paper px-8 py-12 shadow-[0_10px_0_0_var(--color-ink)] sm:rounded-[999px] sm:px-14 lg:py-16 lg:pr-[38%] lg:pl-20">
          <h2 className="font-poster text-[clamp(3rem,7vw,6rem)] leading-[0.85] tracking-tight uppercase">
            Hey! Pode me
            <br />
            chamar de
          </h2>

          {/* nome em bubble, grande */}
          <span
            className="mt-3 inline-block -rotate-3 font-poster text-[clamp(5rem,13vw,10rem)] leading-none tracking-wide text-white uppercase select-none"
            style={{
              WebkitTextStroke: '4px var(--color-ink)',
              textShadow: '7px 8px 0 var(--color-ink)',
            }}
          >
            Vini
          </span>

          <p className="mt-8 max-w-lg font-mono text-sm leading-relaxed font-medium text-ink/80 lg:text-base">
            Vamos nos conhecer! Mas se bater timidez, relaxa.{' '}
            <span className="text-amber">✦</span> Você também pode{' '}
            <a
              href="#contato"
              className="text-ink underline decoration-amber decoration-2 underline-offset-4 transition-colors hover:text-amber"
            >
              clicar aqui
            </a>{' '}
            pra saber quem eu sou! <span className="text-amber">✦</span>
          </p>
        </div>

        {/* foto grande vazando pra fora da cápsula */}
        <img
          src="/portrait-badge.webp"
          alt="Retrato em meio-tom de Vinícius de fone, olhando o celular"
          className="pointer-events-none absolute top-1/2 right-2 w-[52%] max-w-[300px] -translate-y-1/2 rotate-3 select-none sm:right-6 lg:right-[-3%] lg:max-w-[460px]"
          draggable="false"
        />
      </div>
    </section>
  )
}
