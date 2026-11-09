"use client";
import { useEffect, useRef } from "react";
import { Trophy, X } from "lucide-react";

export type Meta = { nome: string; progresso: number; detalhe?: string };

type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  cor: string;
};

const CORES = ["#34d399", "#fbbf24", "#f472b6", "#60a5fa", "#a78bfa", "#fb7185", "#ffffff"];
const DURACAO_MS = 6000;

function Fogos() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ajustar = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ajustar();
    window.addEventListener("resize", ajustar);

    const particulas: Particula[] = [];
    const inicio = performance.now();
    let ultimoLancamento = 0;
    let frame = 0;

    function explodir() {
      const x = window.innerWidth * (0.15 + Math.random() * 0.7);
      const y = window.innerHeight * (0.12 + Math.random() * 0.45);
      const cor = CORES[Math.floor(Math.random() * CORES.length)];
      const total = 55 + Math.floor(Math.random() * 25);
      for (let i = 0; i < total; i++) {
        const angulo = (Math.PI * 2 * i) / total;
        const forca = 1.5 + Math.random() * 3.5;
        particulas.push({
          x,
          y,
          vx: Math.cos(angulo) * forca,
          vy: Math.sin(angulo) * forca,
          vida: 1,
          cor,
        });
      }
    }

    function quadro(agora: number) {
      const decorrido = agora - inicio;
      if (decorrido < DURACAO_MS && agora - ultimoLancamento > 450) {
        explodir();
        ultimoLancamento = agora;
      }

      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.vy += 0.045;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= 0.011;
        if (p.vida <= 0) {
          particulas.splice(i, 1);
          continue;
        }
        ctx!.globalAlpha = p.vida;
        ctx!.fillStyle = p.cor;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      if (decorrido < DURACAO_MS || particulas.length > 0) {
        frame = requestAnimationFrame(quadro);
      }
    }

    frame = requestAnimationFrame(quadro);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", ajustar);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
}

export function MetaCelebracao({
  metas,
  aoFechar,
}: {
  metas: Meta[];
  aoFechar: () => void;
}) {
  const botaoRef = useRef<HTMLButtonElement>(null);

  // Guarda a versão mais recente de aoFechar sem reiniciar o efeito a cada render
  const aoFecharRef = useRef(aoFechar);
  useEffect(() => {
    aoFecharRef.current = aoFechar;
  }, [aoFechar]);

  useEffect(() => {
    botaoRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFecharRef.current();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const plural = metas.length > 1;

  return (
    <>
      <Fogos />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
        onClick={aoFechar}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="meta-titulo"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
        >
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="absolute right-4 top-4 cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
            <Trophy className="h-10 w-10" />
          </div>

          <h2 id="meta-titulo" className="text-2xl font-extrabold text-slate-900">
            Parabéns! 🎉
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {plural
              ? `${metas.length} metas da sua equipe foram batidas:`
              : "1 meta da sua equipe foi batida:"}
          </p>

          <ul className="mt-5 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100 text-left">
            {metas.map((m, i) => (
              <li key={`${m.nome}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">{m.nome}</span>
                  {m.detalhe && <span className="block text-xs text-slate-500">{m.detalhe}</span>}
                </span>
                <span className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {m.progresso.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% da meta
                </span>
              </li>
            ))}
          </ul>

          <button
            ref={botaoRef}
            type="button"
            onClick={aoFechar}
            className="mt-6 w-full cursor-pointer rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30"
          >
            Continuar
          </button>
        </div>
      </div>
    </>
  );
}