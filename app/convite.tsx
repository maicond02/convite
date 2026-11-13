"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { calcularDobra, gradienteDaDobra, poligonoCss } from "./dobra";

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

// Tempo de uma virada completa de página (ms)
const duracaoVirada = 900;

/** Folha virando: `folha` é a que se dobra por cima; `sob` aparece embaixo. */
type Virada = { folha: number; sob: number; sentido: "avancar" | "voltar" };
/** Virada já iniciada, com o tamanho da tela e o progresso do primeiro desenho. */
type ViradaAtiva = Virada & { w: number; h: number; inicio: number };

function suave(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Convite completo.
 * - sem props: arte floral original (modelo 1);
 * - `fundo`: cor atrás das flores, usando a arte com fundo transparente (modelo 2);
 * - `arte`: outra imagem de fundo inteira (modelo 3); `fundo` vira a cor de reserva.
 */
export default function Convite({ fundo, arte }: { fundo?: string; arte?: string }) {
  const imagemFundo = arte ?? (fundo ? "/images/arte-fundo-flores.webp" : null);
  const estiloFundo: CSSProperties | undefined = imagemFundo
    ? { background: `${fundo ?? "var(--blue)"} url("${imagemFundo}") center / cover no-repeat` }
    : undefined;

  const [pagina, setPagina] = useState(0);
  const [virada, setVirada] = useState<ViradaAtiva | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const frenteRef = useRef<HTMLDivElement>(null);
  const versoRef = useRef<HTMLDivElement>(null);
  const sombraRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const seloRef = useRef<HTMLButtonElement>(null);
  const navegou = useRef(false);
  const viaTeclado = useRef(false);
  // 0 = folha deitada (cobrindo), 1 = folha já virada (mostra a de baixo)
  const progresso = useRef(0);
  const tamanho = useRef({ w: 390, h: 844 });
  const animacao = useRef<number | null>(null);
  const viradaAtual = useRef<Virada | null>(null);
  const toque = useRef<{ id: number; x: number; y: number; horizontal: boolean | null } | null>(null);
  const arrastou = useRef(false);
  const capa = pagina === 0 && !virada;

  useEffect(() => {
    if (!navegou.current) return;
    // O anel de foco do selo só faz sentido para quem navega pelo teclado;
    // no toque/arrasto o foco vai para o título (invisível) e nada aparece.
    const alvo = pagina === 0 && viaTeclado.current ? seloRef.current : tituloRef.current;
    alvo?.focus({ preventScroll: true });
  }, [pagina]);

  useEffect(
    () => () => {
      if (animacao.current) cancelAnimationFrame(animacao.current);
    },
    [],
  );

  /** Desenha a dobra no progresso `p` mexendo direto no DOM (sem re-render). */
  function desenhar(p: number) {
    progresso.current = p;
    const { w, h } = tamanho.current;
    const d = calcularDobra(p, w, h);
    if (frenteRef.current) frenteRef.current.style.clipPath = poligonoCss(d.frente);
    if (versoRef.current) {
      versoRef.current.style.clipPath = poligonoCss(d.verso);
      versoRef.current.style.background = gradienteDaDobra(d, w, h, -1, [
        [0, "#d8d1c2"],
        [14, "#ece6da"],
        [70, "#f7f4ed"],
        [Math.max(w, h), "#fbf9f4"],
      ]);
    }
    if (sombraRef.current) {
      sombraRef.current.style.background = gradienteDaDobra(d, w, h, 1, [
        [0, "rgba(40, 60, 89, 0.35)"],
        [36, "rgba(40, 60, 89, 0.12)"],
        [90, "rgba(40, 60, 89, 0)"],
      ]);
    }
  }

  function comecarVirada(v: Virada) {
    const el = mainRef.current;
    if (el) tamanho.current = { w: el.clientWidth, h: el.clientHeight };
    progresso.current = v.sentido === "avancar" ? 0 : 1;
    viradaAtual.current = v;
    navegou.current = true;
    setVirada({ ...v, ...tamanho.current, inicio: progresso.current });
  }

  function terminarVirada() {
    const v = viradaAtual.current;
    if (!v) return;
    viradaAtual.current = null;
    animacao.current = null;
    setPagina(progresso.current >= 1 ? v.sob : v.folha);
    setVirada(null);
  }

  /** Anima a dobra até 0 (desfaz) ou 1 (completa a virada). */
  function animarAte(alvo: 0 | 1) {
    if (animacao.current) cancelAnimationFrame(animacao.current);
    const de = progresso.current;
    const duracao = Math.max(220, duracaoVirada * Math.abs(alvo - de));
    if (document.hidden) {
      progresso.current = alvo;
      terminarVirada();
      return;
    }
    let inicio: number | null = null;
    const passo = (agora: number) => {
      inicio ??= agora;
      const t = Math.min((agora - inicio) / duracao, 1);
      desenhar(de + (alvo - de) * suave(t));
      if (t < 1) {
        animacao.current = requestAnimationFrame(passo);
      } else {
        progresso.current = alvo;
        terminarVirada();
      }
    };
    animacao.current = requestAnimationFrame(passo);
  }

  function irPara(destino: number) {
    if (viradaAtual.current || destino < 0 || destino >= pages.length || destino === pagina) return;
    if (Math.abs(destino - pagina) !== 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navegou.current = true;
      setPagina(destino);
      return;
    }
    const avancar = destino > pagina;
    comecarVirada(
      avancar
        ? { folha: pagina, sob: destino, sentido: "avancar" }
        : { folha: destino, sob: pagina, sentido: "voltar" },
    );
    animarAte(avancar ? 1 : 0);
  }

  useEffect(() => {
    function teclado(e: KeyboardEvent) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      viaTeclado.current = true;
      irPara(e.key === "ArrowRight" ? pagina + 1 : pagina - 1);
    }
    window.addEventListener("keydown", teclado);
    return () => window.removeEventListener("keydown", teclado);
  });

  function inicioToque(e: PointerEvent) {
    viaTeclado.current = false;
    if (viradaAtual.current || (e.pointerType === "mouse" && e.button !== 0)) return;
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
      const avancar = dx < 0;
      const existe = avancar ? pagina < pages.length - 1 : pagina > 0;
      if (!t.horizontal || !existe) {
        toque.current = null;
        return;
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // sem captura, o arrasto continua funcionando dentro da tela
      }
      comecarVirada(
        avancar
          ? { folha: pagina, sob: pagina + 1, sentido: "avancar" }
          : { folha: pagina - 1, sob: pagina, sentido: "voltar" },
      );
    }
    const v = viradaAtual.current;
    if (!v) return;
    // A dobra acompanha o dedo: arrastar ~a largura da tela vira a página inteira
    const fracao = Math.min(Math.max(Math.abs(dx) / (tamanho.current.w * 0.9), 0), 1);
    desenhar(v.sentido === "avancar" ? fracao : 1 - fracao);
  }

  function fimToque(e: PointerEvent) {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    toque.current = null;
    const v = viradaAtual.current;
    if (!t.horizontal || !v) return;
    arrastou.current = true;
    const p = progresso.current;
    if (v.sentido === "avancar") animarAte(p > 0.2 ? 1 : 0);
    else animarAte(p < 0.8 ? 0 : 1);
  }

  function cancelarToque() {
    toque.current = null;
    if (viradaAtual.current) animarAte(viradaAtual.current.sentido === "avancar" ? 0 : 1);
  }

  // Primeiro desenho da dobra (depois ela é atualizada direto no DOM a cada quadro)
  const geometriaInicial = virada ? calcularDobra(virada.inicio, virada.w, virada.h) : null;

  /** Uma folha inteira (fundo + conteúdo), ocupando a tela toda. */
  function folha(n: number, papel: "ativa" | "sob" | "frente") {
    const { title, card } = pages[n];
    const ativa = papel === "ativa";
    const geometria = papel === "frente" ? geometriaInicial : null;
    return (
      <div
        key={`folha-${n}`}
        ref={papel === "frente" ? frenteRef : undefined}
        className={`sheet sheet--${papel}`}
        style={{ ...estiloFundo, clipPath: geometria ? poligonoCss(geometria.frente) : undefined }}
        aria-hidden={ativa ? undefined : true}
        inert={!ativa}
      >
        {n === 0 && (
          <p className="guest-name">
            <span className="guest-name__ribbon">
              Convidado:{" "}
              {convidado}
            </span>
          </p>
        )}
        <section
          className={card ? "invitation-page" : "invitation-page invitation-page--cover"}
          aria-labelledby={ativa ? "page-title" : undefined}
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
              draggable={false}
            />
          )}
          {ativa && (
            <h1 id="page-title" className="sr-only" ref={tituloRef} tabIndex={-1}>
              {title}
            </h1>
          )}

          {n === 0 && (
            <button
              type="button"
              className="seal-button"
              ref={ativa ? seloRef : undefined}
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

          {n === 1 && (
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

          {n === 2 && (
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

          {n === 3 && (
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
      </div>
    );
  }

  return (
    <main
      ref={mainRef}
      className={capa ? "invitation invitation--cover" : "invitation"}
      onClick={capa ? () => irPara(1) : undefined}
      onClickCapture={(e) => {
        // Um arrasto não deve abrir os links do mapa nem o convite
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
      {/* Lista com chaves: a folha que estava aberta é reaproveitada ao começar a virar */}
      {virada
        ? [
            folha(virada.sob, "sob"),
            <div key="sombra" ref={sombraRef} className="page-shadow" aria-hidden="true" />,
            folha(virada.folha, "frente"),
            <div key="verso" className="page-back-wrap" aria-hidden="true">
              <div
                ref={versoRef}
                className="page-back"
                style={{ clipPath: geometriaInicial ? poligonoCss(geometriaInicial.verso) : undefined }}
              />
            </div>,
          ]
        : [folha(pagina, "ativa")]}
    </main>
  );
}
