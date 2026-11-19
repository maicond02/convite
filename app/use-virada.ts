"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { calcularDobra, gradienteDaDobra, poligonoCss } from "./dobra";

/** Folha virando: `folha` é a que se dobra por cima; `sob` aparece embaixo. */
export type Virada = { folha: number; sob: number; sentido: "avancar" | "voltar" };
/** Virada já iniciada, com o tamanho da tela e o progresso do primeiro desenho. */
export type ViradaAtiva = Virada & { w: number; h: number; inicio: number };

// Tempo de uma virada completa de página (ms)
const duracaoVirada = 900;

function suave(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Motor do convite: página 0 é o envelope (abre com um toque, não vira
 * arrastando) e as demais viram como folha de livro, arrastando ou pelas
 * setas do teclado. Depois de aberto, não se volta para o envelope.
 */
export function useVirada(totalPaginas: number, duracaoAbertura: number) {
  const [pagina, setPagina] = useState(0);
  const [virada, setVirada] = useState<ViradaAtiva | null>(null);
  const [abrindo, setAbrindo] = useState(false);
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
  const envelope = pagina === 0 && !virada && !abrindo;

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

  function abrir() {
    if (pagina !== 0 || abrindo) return;
    navegou.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPagina(1);
    else setAbrindo(true);
  }

  function fimAbertura() {
    setPagina(1);
    setAbrindo(false);
  }

  // Garante que o envelope some mesmo se o evento de fim da animação não disparar
  useEffect(() => {
    if (!abrindo) return;
    const t = window.setTimeout(fimAbertura, duracaoAbertura + 500);
    return () => window.clearTimeout(t);
  }, [abrindo, duracaoAbertura]);

  function irPara(destino: number) {
    if (viradaAtual.current || abrindo || destino < 0 || destino >= totalPaginas || destino === pagina) return;
    // Do envelope só se sai abrindo; depois de aberto, não se volta para ele
    if (pagina === 0) return abrir();
    if (destino === 0) return;
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

  function onPointerDown(e: PointerEvent) {
    if (!e.isPrimary || e.button !== 0 || viradaAtual.current) return;
    viaTeclado.current = false;
    arrastou.current = false;
    toque.current = { id: e.pointerId, x: e.clientX, y: e.clientY, horizontal: null };
  }

  function onPointerMove(e: PointerEvent) {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (t.horizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      t.horizontal = Math.abs(dx) > Math.abs(dy);
      const avancar = dx < 0;
      // O envelope não é folha: não vira nem volta arrastando
      const existe = avancar ? pagina > 0 && pagina < totalPaginas - 1 : pagina > 1;
      if (!t.horizontal || !existe) {
        // Um gesto que não vira página (ex.: arrastar no envelope) também não abre o convite
        arrastou.current = true;
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

  function onPointerUp(e: PointerEvent) {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    toque.current = null;
    const v = viradaAtual.current;
    if (t.horizontal && v) {
      arrastou.current = true;
      const p = progresso.current;
      if (v.sentido === "avancar") animarAte(p > 0.2 ? 1 : 0);
      else animarAte(p < 0.8 ? 0 : 1);
      return;
    }

    // Toque rápido (sem arrastar): metade direita avança, metade esquerda volta.
    // No envelope o toque abre o convite (pelo clique), e links/botões seguem normais.
    if (pagina === 0 || Math.abs(e.clientX - t.x) >= 8 || Math.abs(e.clientY - t.y) >= 8) return;
    if (e.target instanceof Element && e.target.closest("a, button")) return;

    const { left, width } = e.currentTarget.getBoundingClientRect();
    irPara(pagina + (e.clientX >= left + width / 2 ? 1 : -1));
  }

  function onPointerCancel(e: PointerEvent) {
    if (toque.current?.id !== e.pointerId) return;
    toque.current = null;
    if (viradaAtual.current) animarAte(viradaAtual.current.sentido === "avancar" ? 0 : 1);
  }

  /** Um arrasto não deve abrir links nem o convite. */
  function onClickCapture(e: { preventDefault(): void; stopPropagation(): void }) {
    if (arrastou.current) {
      arrastou.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // Primeiro desenho da dobra (depois ela é atualizada direto no DOM a cada quadro)
  const geometriaInicial = virada ? calcularDobra(virada.inicio, virada.w, virada.h) : null;

  return {
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
    eventos: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture },
  };
}
