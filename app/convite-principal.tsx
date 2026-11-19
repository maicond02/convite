"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { preload } from "react-dom";
import "./convite-principal.css";
import { poligonoCss } from "./dobra";
import { useVirada } from "./use-virada";

const maps = {
  upa: "https://www.google.com/maps/search/?api=1&query=UPA+Macarenko%2C+Rua+Vinicius+de+Moraes+380%2C+Sumar%C3%A9",
  recanto: "https://www.google.com/maps/search/?api=1&query=Ch%C3%A1cara+Recanto+Janu%C3%A1rio%2C+Parque+S%C3%A3o+Bento%2C+Sumar%C3%A9",
};

// Convidados escritos no envelope (a arte já traz o nome)
const convidados = "César & Márcia Ferrari";

const paginas = [
  { titulo: `Convite de casamento para ${convidados}`, imagem: null },
  { titulo: "Mariana & Maicon", imagem: "/images/principal/cartao.webp" },
  { titulo: "Detalhes", imagem: "/images/principal/detalhes.webp" },
  { titulo: "Programação", imagem: "/images/principal/programacao.webp" },
  { titulo: "Mariana & Maicon", imagem: "/images/principal/monograma.webp" },
  { titulo: "O local", imagem: "/images/principal/local.webp" },
] as const;

const imagensEnvelope = ["/images/principal/envelope-aba.webp", "/images/principal/envelope-corpo.webp"];

// Duração total da abertura do envelope (precisa bater com o CSS)
const duracaoAbertura = 1500;

/** Áreas clicáveis sobre os textos de link da página de Detalhes (em % da arte original). */
const linksDetalhes = [
  { href: maps.upa, rotulo: "Abrir mapa da UPA Macarenko", left: 35.2, top: 60, width: 55.3, height: 3.4 },
  { href: maps.upa, rotulo: null, left: 8.6, top: 63.4, width: 11.7, height: 3.2 },
  { href: maps.recanto, rotulo: "Abrir mapa do Recanto Januário", left: 23.4, top: 66.7, width: 67.1, height: 3.4 },
  { href: maps.recanto, rotulo: null, left: 8.6, top: 70.1, width: 18.2, height: 3.1 },
];

/**
 * Convite principal (rota "/"): envelope pintado que abre com um toque em
 * qualquer lugar e páginas de arte inteira que viram como folha de livro.
 */
export default function ConvitePrincipal() {
  for (const src of imagensEnvelope) preload(src, { as: "image" });
  for (const p of paginas) if (p.imagem) preload(p.imagem, { as: "image" });

  const {
    pagina,
    virada,
    abrindo,
    envelope,
    geometriaInicial,
    mainRef,
    frenteRef,
    versoRef,
    sombraRef,
    tituloRef,
    seloRef,
    abrir,
    fimAbertura,
    eventos,
  } = useVirada(paginas.length, duracaoAbertura);

  /** Uma folha inteira (arte + conteúdo), ocupando a tela toda. */
  function folha(n: number, papel: "ativa" | "sob" | "frente" | "abrindo") {
    const { titulo, imagem } = paginas[n];
    const ativa = papel === "ativa";
    const classes = `cp-folha cp-${papel}`;

    return (
      <div
        key={`folha-${n}`}
        ref={papel === "frente" ? frenteRef : undefined}
        className={classes}
        style={{ clipPath: papel === "frente" && geometriaInicial ? poligonoCss(geometriaInicial.frente) : undefined }}
        onAnimationEnd={
          papel === "abrindo"
            ? (e) => {
                if (e.target === e.currentTarget) fimAbertura();
              }
            : undefined
        }
        aria-hidden={ativa ? undefined : true}
        inert={!ativa}
      >
        <div
          className={n === 0 ? "cp-arte cp-arte-envelope" : "cp-arte"}
          style={imagem ? ({ backgroundImage: `url("${imagem}")` } as CSSProperties) : undefined}
        >
          {n === 0 && (
            <>
              <div className="cp-env-corpo" />
              <div className="cp-env-aba" />
            </>
          )}

          {/* Região da arte original (sem as extensões de topo e base) */}
          <div className="cp-original">
            {n === 0 && (
              <button
                type="button"
                className="cp-selo"
                ref={ativa ? seloRef : undefined}
                aria-label="Abrir convite"
                onClick={(e) => {
                  e.stopPropagation();
                  abrir();
                }}
              >
                <Image
                  src="/images/selo-monograma.webp"
                  alt=""
                  width={487}
                  height={492}
                  unoptimized
                  loading="eager"
                  draggable={false}
                />
              </button>
            )}

            {n === 2 &&
              linksDetalhes.map((l, i) => (
                <a
                  key={i}
                  className="cp-link"
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={l.rotulo ?? undefined}
                  aria-hidden={l.rotulo ? undefined : true}
                  tabIndex={l.rotulo ? undefined : -1}
                  style={{ left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` }}
                />
              ))}
          </div>
        </div>

        {ativa && (
          <h1 className="sr-only" ref={tituloRef} tabIndex={-1}>
            {titulo}
          </h1>
        )}

        {/* Textos das artes, para leitores de tela */}
        {n === 0 && <p className="sr-only">Toque em qualquer lugar para abrir o convite.</p>}
        {n === 1 && (
          <div className="sr-only">
            <p>
              Casamento de quem ama, do mais nobre aos mais plebeus, mesmo florindo na lama, é um lírio do amor de
              Deus.
            </p>
            <p>
              <time dateTime="2027-07-09T14:30">9 de julho de 2027, às 14h30</time>. Recanto Januário, Sumaré.
            </p>
          </div>
        )}
        {n === 2 && (
          <div className="sr-only">
            <p>Após a cerimônia os noivos recepcionarão os convidados em um jantar aconchegante no mesmo local.</p>
            <p>Traje social.</p>
            <p>Local: Recanto Januário, Parque São Bento, Sumaré.</p>
            <p>
              Recomenda-se colocar primeiro o endereço da UPA Macarenko e, ao chegar lá, trocar o endereço para
              Recanto Januário.
            </p>
            <p>Confirmação de presença e lista de presentes.</p>
          </div>
        )}
        {n === 3 && (
          <ol className="sr-only">
            <li>Cerimônia</li>
            <li>Recepção com coquetel volante</li>
            <li>Brinde e discurso</li>
            <li>Momento fotografia</li>
            <li>Ilha gastronômica e jantar</li>
            <li>Máquina de fotos polaroid e livro de lembranças dos noivos</li>
            <li>Missão lua de mel</li>
            <li>Buquê da noiva</li>
            <li>Celebração com long cake e doces</li>
            <li>Lareira com marshmallows</li>
            <li>Lembrancinhas e Happy Ever After</li>
          </ol>
        )}
        {n === 4 && <p className="sr-only">Monograma dos noivos, Mariana e Maicon.</p>}
        {n === 5 && <p className="sr-only">Pintura do Recanto Januário com as mesas da festa e o arco de flores.</p>}
      </div>
    );
  }

  const classesMain = `cp-convite${envelope ? " cp-convida-abrir" : ""}${abrindo ? " cp-abrindo-convite" : ""}`;

  return (
    <main
      ref={mainRef}
      className={classesMain}
      onClick={envelope ? abrir : undefined}
      onClickCapture={eventos.onClickCapture}
      onPointerDown={eventos.onPointerDown}
      onPointerMove={eventos.onPointerMove}
      onPointerUp={eventos.onPointerUp}
      onPointerCancel={eventos.onPointerCancel}
    >
      {/* Lista com chaves: a folha que estava aberta é reaproveitada ao começar a virar */}
      {abrindo
        ? [folha(1, "sob"), folha(0, "abrindo")]
        : virada
          ? [
              folha(virada.sob, "sob"),
              <div key="sombra" ref={sombraRef} className="cp-sombra" aria-hidden="true" />,
              folha(virada.folha, "frente"),
              <div key="verso" className="cp-verso-wrap" aria-hidden="true">
                <div
                  ref={versoRef}
                  className="cp-verso"
                  style={{ clipPath: geometriaInicial ? poligonoCss(geometriaInicial.verso) : undefined }}
                />
              </div>,
            ]
          : [folha(pagina, "ativa")]}
    </main>
  );
}
