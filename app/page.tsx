"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const maps = {
  upa: "https://www.google.com/maps/search/?api=1&query=UPA+Macarenko%2C+Rua+Vinicius+de+Moraes+380%2C+Sumar%C3%A9",
  recanto: "https://www.google.com/maps/search/?api=1&query=Ch%C3%A1cara+Recanto+Janu%C3%A1rio%2C+Parque+S%C3%A3o+Bento%2C+Sumar%C3%A9",
};

const cardWidth = 886;
const pages = [
  { title: "Capa do convite", card: null },
  { title: "Mariana & Maicon", card: { name: "casamento", height: 1340 } },
  { title: "Detalhes", card: { name: "detalhes", height: 1340 } },
  { title: "Programação", card: { name: "programacao", height: 1974 } },
];

export default function Home() {
  const [pagina, setPagina] = useState(0);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const seloRef = useRef<HTMLButtonElement>(null);
  const navegou = useRef(false);
  const { title, card } = pages[pagina];
  const capa = card === null;

  useEffect(() => {
    if (!navegou.current) return;
    (capa ? seloRef.current : tituloRef.current)?.focus({ preventScroll: true });
  }, [capa, pagina]);

  function irPara(destino: number) {
    navegou.current = true;
    setPagina(destino);
  }

  return (
    <main className="invitation">
      <section
        key={title}
        className={capa ? "invitation-page invitation-page--cover" : "invitation-page invitation-page--open"}
        aria-labelledby="page-title"
        style={card ? { maxWidth: `calc((var(--page-height) - 24px) * ${cardWidth} / ${card.height})` } : undefined}
      >
        {card && (
          <Image
            className="artwork"
            src={`/images/cartao-${card.name}.webp`}
            alt=""
            width={cardWidth}
            height={card.height}
            unoptimized
          />
        )}
        <h1 id="page-title" className="sr-only" ref={tituloRef} tabIndex={-1}>
          {title}
        </h1>

        {capa && (
          <button
            type="button"
            className="seal-button"
            ref={seloRef}
            aria-label="Abrir convite de Mariana e Maicon"
            onClick={() => irPara(1)}
          >
            <Image
              className="artwork"
              src="/images/selo-monograma.webp"
              alt=""
              width={487}
              height={492}
              unoptimized
              preload
            />
          </button>
        )}

        {pagina === 1 && (
          <div className="sr-only">
            <p>
              Casamento de quem ama, do mais nobre aos mais plebeus,
              mesmo florindo na lama, é um lírio do amor de Deus.
            </p>
            <p>
              <time dateTime="2027-07-09T14:30">9 de julho de 2027, às 14h30</time>.
              Recanto Januário, Sumaré.
            </p>
          </div>
        )}

        {pagina === 2 && (
          <>
            <div className="sr-only">
              <p>Após a cerimônia os noivos recepcionarão os convidados em um jantar aconchegante no mesmo local.</p>
              <p>Traje social.</p>
              <p>Local: Recanto Januário, Parque São Bento, Sumaré.</p>
              <p>Recomenda-se colocar primeiro o endereço da UPA Macarenko e, ao chegar lá, trocar o endereço para Recanto Januário.</p>
              <p>O evento será realizado em local aberto e com gramado, podendo esfriar ao cair da noite.</p>
              <p>Confirmação de presença e lista de presentes.</p>
            </div>
            <a className="map-link map-link--upa" href={maps.upa} target="_blank" rel="noopener noreferrer">
              <span className="sr-only">Abrir mapa da UPA Macarenko</span>
            </a>
            <a className="map-link map-link--recanto" href={maps.recanto} target="_blank" rel="noopener noreferrer">
              <span className="sr-only">Abrir mapa do Recanto Januário</span>
            </a>
          </>
        )}

        {pagina === 3 && (
          <ol className="sr-only">
            <li>Cerimônia</li>
            <li>Recepção com coquetel volante</li>
            <li>Brinde e discurso</li>
            <li>Momento fotografia</li>
            <li>Ilha gastronômica e jantar</li>
            <li>Máquina de fotos polaroid e livro de lembranças dos noivos</li>
            <li>Raspadinha / sorteio (missão lua de mel)</li>
            <li>Buquê da noiva</li>
            <li>Celebração com long cake e doces</li>
            <li>Lareira com marshmallows</li>
            <li>Lembrancinhas e Happy Ever After</li>
          </ol>
        )}
      </section>

      {!capa && (
        <nav className="page-navigation" aria-label="Páginas do convite">
          <button
            type="button"
            className="page-arrow page-arrow--previous"
            aria-label="Voltar uma página"
            onClick={() => irPara(pagina - 1)}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m12 4-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {pagina < pages.length - 1 && (
            <button
              type="button"
              className="page-arrow page-arrow--next"
              aria-label="Avançar uma página"
              onClick={() => irPara(pagina + 1)}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m8 4 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </nav>
      )}
    </main>
  );
}
