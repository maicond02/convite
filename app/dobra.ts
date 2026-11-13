// Geometria da "dobra" de página de livro: o canto inferior direito da folha
// se levanta e a linha de dobra sobe pela página até ela virar por completo.

type Ponto = { x: number; y: number };

export type Dobra = {
  /** Parte da folha que continua no lugar (lado da lombada). */
  frente: Ponto[];
  /** Parte dobrada, já espelhada sobre a folha: é o verso do papel. */
  verso: Ponto[];
  /** Ponto na linha de dobra e normal apontando para o canto que se levanta. */
  meio: Ponto;
  normal: Ponto;
};

/**
 * Caminho do canto inferior direito conforme a folha vira (p de 0 a 1):
 * sai do canto, sobe em diagonal até perto do meio da altura e depois
 * segue para a esquerda até a folha passar inteira.
 */
function canto(p: number, w: number, h: number): Ponto {
  // A subida é proporcional à largura: em telas altas (celular) a dobra
  // começa como um triângulo pequeno no canto e vai subindo pela borda direita.
  return {
    x: w - 2 * w * p,
    y: h - Math.min(w, h) * 0.5 * Math.sin(Math.PI * p),
  };
}

/** Mantém só a parte do polígono em que `lado(P) <= 0` (Sutherland–Hodgman). */
function cortar(poligono: Ponto[], lado: (p: Ponto) => number): Ponto[] {
  const saida: Ponto[] = [];
  for (let i = 0; i < poligono.length; i++) {
    const s = poligono[i];
    const e = poligono[(i + 1) % poligono.length];
    const ds = lado(s);
    const de = lado(e);
    const cruza = () => {
      const t = ds / (ds - de);
      return { x: s.x + t * (e.x - s.x), y: s.y + t * (e.y - s.y) };
    };
    if (de <= 0) {
      if (ds > 0) saida.push(cruza());
      saida.push(e);
    } else if (ds <= 0) {
      saida.push(cruza());
    }
  }
  return saida;
}

export function calcularDobra(p: number, w: number, h: number): Dobra {
  const pagina = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const origem = { x: w, y: h };
  const c = canto(Math.min(Math.max(p, 0), 1), w, h);
  const dx = origem.x - c.x;
  const dy = origem.y - c.y;
  const comprimento = Math.hypot(dx, dy);

  if (comprimento < 0.5) {
    return { frente: pagina, verso: [], meio: origem, normal: { x: 0.6, y: 0.8 } };
  }

  // A linha de dobra é a mediatriz entre o canto original e onde ele está agora
  const normal = { x: dx / comprimento, y: dy / comprimento };
  const meio = { x: (origem.x + c.x) / 2, y: (origem.y + c.y) / 2 };
  const lado = (q: Ponto) => (q.x - meio.x) * normal.x + (q.y - meio.y) * normal.y;

  const frente = cortar(pagina, lado);
  const verso = cortar(pagina, (q) => -lado(q)).map((q) => {
    const d = lado(q);
    return { x: q.x - 2 * d * normal.x, y: q.y - 2 * d * normal.y };
  });

  return { frente, verso, meio, normal };
}

export function poligonoCss(pontos: Ponto[]): string {
  if (pontos.length < 3) return "polygon(0 0, 0 0, 0 0)";
  return `polygon(${pontos.map((q) => `${q.x.toFixed(1)}px ${q.y.toFixed(1)}px`).join(", ")})`;
}

/**
 * Gradiente linear perpendicular à dobra, com as paradas medidas em px a
 * partir da linha de dobra (positivo = no sentido de `sentido`).
 */
export function gradienteDaDobra(
  dobra: Dobra,
  w: number,
  h: number,
  sentido: 1 | -1,
  paradas: [number, string][],
): string {
  const u = { x: dobra.normal.x * sentido, y: dobra.normal.y * sentido };
  const angulo = (Math.atan2(u.x, -u.y) * 180) / Math.PI;
  const tamanho = Math.abs(w * u.x) + Math.abs(h * u.y);
  const inicio = { x: w / 2 - (u.x * tamanho) / 2, y: h / 2 - (u.y * tamanho) / 2 };
  const base = (dobra.meio.x - inicio.x) * u.x + (dobra.meio.y - inicio.y) * u.y;
  const lista = paradas.map(([d, cor]) => `${cor} ${(base + d).toFixed(1)}px`).join(", ");
  return `linear-gradient(${angulo.toFixed(2)}deg, ${lista})`;
}
