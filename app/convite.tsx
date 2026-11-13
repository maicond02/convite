"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";

const maps = {
  upa: "https://www.google.com/maps/search/?api=1&query=UPA+Macarenko%2C+Rua+Vinicius+de+Moraes+380%2C+Sumar%C3%A9",
  recanto: "https://www.google.com/maps/search/?api=1&query=Ch%C3%A1cara+Recanto+Janu%C3%A1rio%2C+Parque+S%C3%A3o+Bento%2C+Sumar%C3%A9",
};

// Nome do convidado exibido na capa (provisório)
const convidado = "Mariana";

const cardWidth = 886;
const pages = [
  { title: "Capa do convite", card: null },
  { title: "Mariana & Maicon", card: { name: "casamento", height: 1340 } },
  { title: "Detalhes", card: { name: "detalhes", height: 1340 } },
  { title: "Programação", card: { name: "programacao", height: 1974 } },
];

/**
 * Convite completo. `fundo` troca a cor atrás das flores (modelos 2 e 3),
 * usando a arte com fundo transparente; sem ele, fica a arte original (modelo 1).
 */
export default function Convite({ fundo }: { fundo?: string }) {
  const [pagina, setPagina] = useState(0);
  const [direcao, setDirecao] = useState<"avancar" | "voltar">("avancar");
  const [arrasto, setArrasto] = useState(0);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const seloRef = useRef<HTMLButtonElement>(null);
  const navegou = useRef(false);
  const toque = useRef<{ id: number; x: number; y: number; horizontal: boolean | null } | null>(null);
  const arrastou = useRef(false);
  const { title, card } = pages[pagina];
  const capa = card === null;
  const ultima = pagina === pages.length - 1;

  useEffect(() => {
    if (!navegou.current) return;
    (capa ? seloRef.current : tituloRef.current)?.focus({ preventScroll: true });
  }, [capa, pagina]);

  function irPara(destino: number) {
    if (destino < 0 || destino >= pages.length || destino === pagina) return;
    navegou.current = true;
    setDirecao(destino > pagina ? "avancar" : "voltar");
    setPagina(destino);
  }

  useEffect(() => {
    if (capa) return;
    function teclado(e: KeyboardEvent) {
      if (e.key === "ArrowRight") irPara(pagina + 1);
      if (e.key === "ArrowLeft") irPara(pagina - 1);
    }
    window.addEventListener("keydown", teclado);
    return () => window.removeEventListener("keydown", teclado);
  });

  function inicioToque(e: PointerEvent) {
    if (capa || (e.pointerType === "mouse" && e.button !== 0)) return;
    arrastou.current = false;
    toque.current = { id: e.pointerId, x: e.clientX, y: e.clientY, horizontal: null };
  }

  function moverToque(e: PointerEvent) {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (t.horizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      t.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!t.horizontal) {
        toque.current = null;
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // Resistência ao arrastar para além da última página
    setArrasto(dx < 0 && ultima ? dx * 0.25 : dx);
  }

  function fimToque(e: PointerEvent) {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    toque.current = null;
    if (!t.horizontal) return;
    arrastou.current = true;
    const dx = e.clientX - t.x;
    const limite = Math.min(80, window.innerWidth * 0.18);
    setArrasto(0);
    if (dx <= -limite) irPara(pagina + 1);
    else if (dx >= limite) irPara(pagina - 1);
  }

  function cancelarToque() {
    toque.current = null;
    setArrasto(0);
  }

  return (
    <main
      className={capa ? "invitation invitation--cover" : "invitation invitation--open"}
      style={
        fundo
          ? { background: `${fundo} url("/images/arte-fundo-flores.webp") center / cover no-repeat` }
          : undefined
      }
      onClick={capa ? () => irPara(1) : undefined}
      onClickCapture={(e) => {
        // Um arrasto não deve abrir os links do mapa
        if (arrastou.current) {
          arrastou.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onPointerDown={inicioToque}
      onPointerMove={moverToque}
      onPointerUp={fimToque}
      onPointerCancel={cancelarToque}
    >
      {capa && (
        <p className="guest-name">
          <span className="guest-name__ribbon">
            Convidado:{" "}
            {convidado}
          </span>
        </p>
      )}
      {!capa && (
        <div className="story-progress" aria-hidden="true">
          {pages.slice(1).map((p, i) => (
            <span key={p.title} className={i + 1 <= pagina ? "is-seen" : undefined} />
          ))}
        </div>
      )}
      <section
        key={title}
        className={
          capa
            ? "invitation-page invitation-page--cover"
            : `invitation-page invitation-page--open invitation-page--${direcao}`
        }
        aria-labelledby="page-title"
        style={
          card
            ? {
                maxWidth: `calc((var(--page-height) - 24px) * ${cardWidth} / ${card.height})`,
                transform: arrasto ? `translateX(${arrasto}px)` : undefined,
                transition: arrasto ? "none" : undefined,
              }
            : undefined
        }
      >
        {card && (
          <Image
            className="artwork"
            src={`/images/cartao-${card.name}.webp`}
            alt=""
            width={cardWidth}
            height={card.height}
            unoptimized
            draggable={false}
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
            onClick={(e) => {
              e.stopPropagation();
              irPara(1);
            }}
          >
            <Image
              className="artwork"
              src="/images/selo-monograma.webp"
              alt=""
              width={487}
              height={492}
              unoptimized
              preload
              draggable={false}
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

    </main>
  );
}
