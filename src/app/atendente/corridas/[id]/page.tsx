"use client";

import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";

type Person = {
  id?: string | null;
  full_name?: string | null;
  phone?: string | null;
};

type Vehicle = {
  id?: string | number | null;
  licence_plate_number?: string | null;
  category_id?: string | number | null;
  category?: { id?: string | number | null; name?: string | null } | null;
  model?: {
    id?: string | number | null;
    name?: string | null;
    image?: string | null;
  } | null;
};

type Trip = {
  id: string | number;
  ref_id: string;
  entrance?: string | null;
  note?: string | null;
  cancellation_reason?: string | null;
  pickup_address?: string | null;
  destination_address?: string | null;
  pickup_lat?: number | string | null;
  pickup_lng?: number | string | null;
  destination_lat?: number | string | null;
  destination_lng?: number | string | null;
  encoded_polyline?: string | null;
  estimated_fare?: number | string | null;
  paid_fare?: number | string | null;
  actual_distance?: number | string | null;
  estimated_distance?: number | string | null;
  current_status?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  created_at: string;
  passenger?: Person | null;
  driver?: Person | null;
  vehicle?: Vehicle | null;
  vehicle_category?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  vehicle_plate?: string | null;
  vehicle_model_image?: string | null;
};

const NAO_INFORMADO = "Não informado";

/* ------------------------------------------------------------------ */
/* Google Maps                                                         */
/* ------------------------------------------------------------------ */

let googleMapsPromise: Promise<void> | null = null;

function carregarGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Maps só pode ser carregado no navegador.")
    );
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const chave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!chave) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não está configurada.")
    );
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const falhar = (mensagem: string) => {
      googleMapsPromise = null;
      reject(new Error(mensagem));
    };

    const scriptExistente = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]'
    );

    if (scriptExistente) {
      scriptExistente.addEventListener(
        "load",
        () => {
          if (window.google?.maps) {
            resolve();
          } else {
            falhar("Google Maps carregou, mas a API não está disponível.");
          }
        },
        { once: true }
      );
      scriptExistente.addEventListener(
        "error",
        () => falhar("Erro ao carregar Google Maps."),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${encodeURIComponent(chave)}` +
      "&v=weekly";
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";

    script.onload = () => {
      if (window.google?.maps) {
        resolve();
      } else {
        falhar("Google Maps carregou, mas a API não está disponível.");
      }
    };

    script.onerror = () => falhar("Não foi possível carregar o Google Maps.");

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function paraNumero(valor?: number | string | null): number | null {
  if (valor === null || valor === undefined) return null;

  const texto = String(valor).trim();
  if (!texto) return null;

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

function montarCoordenada(
  lat?: number | string | null,
  lng?: number | string | null
): string {
  const latitude = paraNumero(lat);
  const longitude = paraNumero(lng);

  if (latitude === null || longitude === null) return "";
  if (latitude === 0 && longitude === 0) return "";

  return `${latitude},${longitude}`;
}

function formatarValor(valor?: number | string | null): string {
  const numero = paraNumero(valor);
  if (numero === null) return NAO_INFORMADO;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarData(data?: string | null): string {
  if (!data) return NAO_INFORMADO;

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return NAO_INFORMADO;

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDistancia(distancia?: number | string | null): string {
  const numero = paraNumero(distancia);
  if (numero === null) return NAO_INFORMADO;

  return `${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

function traduzirMetodoPagamento(metodo?: string | null): string {
  switch (String(metodo || "").trim().toLowerCase()) {
    case "cash":
    case "dinheiro":
      return "Dinheiro";
    case "card":
    case "credit_card":
    case "debit_card":
    case "cartao":
    case "cartão":
      return "Cartão";
    case "pix":
      return "PIX";
    default:
      return metodo || NAO_INFORMADO;
  }
}

// Formato final: (11) *****-4321
function mascararTelefone(telefone?: string | null): string {
  if (!telefone) return "Telefone não disponível";

  let digitos = telefone.replace(/\D/g, "");

  if (digitos.startsWith("55") && digitos.length > 11) {
    digitos = digitos.slice(2);
  }

  if (digitos.length < 6) return "Telefone inválido";

  return `(${digitos.slice(0, 2)}) *****-${digitos.slice(-4)}`;
}

/* ------------------------------------------------------------------ */
/* Adaptador da API                                                    */
/* ------------------------------------------------------------------ */

function comoTexto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor : null;
}

function comoValor(valor: unknown): number | string | null {
  return typeof valor === "number" || typeof valor === "string" ? valor : null;
}

// Aceita os dois formatos de resposta:
//  - { trip: {...} }    (campos em inglês)
//  - { corrida: {...} } (campos em português, formato atual da API)
function normalizarCorrida(data: unknown): Trip | null {
  if (!data || typeof data !== "object") return null;

  const corpo = data as {
    trip?: Trip | null;
    corrida?: Record<string, unknown> | null;
  };

  if (corpo.trip) return corpo.trip;

  const c = corpo.corrida;
  if (!c) return null;

  let driver: Person | null = null;
  const motorista = c.motorista;

  if (typeof motorista === "string" && motorista.trim()) {
    driver = {
      id: comoTexto(c.motorista_id),
      full_name: motorista,
      phone: comoTexto(c.motorista_telefone),
    };
  } else if (motorista && typeof motorista === "object") {
    const m = motorista as Record<string, unknown>;
    driver = {
      id: comoTexto(m.id),
      full_name: comoTexto(m.nome) ?? comoTexto(m.full_name),
      phone: comoTexto(m.telefone) ?? comoTexto(m.phone),
    };
  }

  const veiculo =
    c.veiculo && typeof c.veiculo === "object"
      ? (c.veiculo as Record<string, unknown>)
      : null;

  const modeloVeiculo =
    comoTexto(veiculo?.modelo) ??
    comoTexto(veiculo?.nome) ??
    comoTexto(c.veiculo) ??
    comoTexto(c.modelo_veiculo) ??
    comoTexto(c.modelo);

  const placa =
    comoTexto(veiculo?.placa) ??
    comoTexto(c.placa_veiculo) ??
    comoTexto(c.placa);

  const categoriaVeiculo =
    comoTexto(veiculo?.categoria) ??
    comoTexto(c.categoria_veiculo) ??
    comoTexto(c.categoria);

  const imagemModelo =
    comoTexto(veiculo?.imagem) ?? comoTexto(c.imagem_veiculo);

  return {
    id: String(c.id ?? ""),
    ref_id: String(c.ref_id ?? ""),
    note: comoTexto(c.observacao) ?? comoTexto(c.observacao_status),
    cancellation_reason: comoTexto(c.motivo_cancelamento),
    pickup_address: comoTexto(c.origem),
    destination_address: comoTexto(c.destino),
    pickup_lat: comoValor(c.origem_lat) ?? comoValor(c.pickup_lat),
    pickup_lng: comoValor(c.origem_lng) ?? comoValor(c.pickup_lng),
    destination_lat: comoValor(c.destino_lat) ?? comoValor(c.destination_lat),
    destination_lng: comoValor(c.destino_lng) ?? comoValor(c.destination_lng),
    estimated_fare: comoValor(c.valor_estimado) ?? comoValor(c.valor),
    paid_fare: comoValor(c.paid_fare),
    actual_distance: comoValor(c.distancia_real),
    estimated_distance: comoValor(c.distancia_estimada),
    current_status: comoTexto(c.status),
    payment_status: comoTexto(c.status_pagamento),
    payment_method: comoTexto(c.forma_pagamento),
    created_at: comoTexto(c.data) ?? comoTexto(c.solicitada_em) ?? "",
    driver,
    vehicle_model: modeloVeiculo,
    vehicle_plate: placa,
    vehicle_category: categoriaVeiculo,
    vehicle_model_image: imagemModelo,
  };
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function DetalhesCorrida({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const mapaRef = useRef<HTMLDivElement | null>(null);
  const directionsRendererRef =
    useRef<google.maps.DirectionsRenderer | null>(null);

  /* ---------------------------- Carregar corrida ---------------------------- */

  useEffect(() => {
    let ativo = true;

    async function carregarCorrida() {
      try {
        setLoading(true);

        const res = await fetch(`/api/trips/${encodeURIComponent(id)}`, {
          method: "GET",
          cache: "no-store",
        });

        const texto = await res.text();

        let data: {
          trip?: Trip | null;
          corrida?: Record<string, unknown> | null;
          error?: string;
        } | null = null;

        try {
          data = JSON.parse(texto);
        } catch {
          throw new Error(
            `A API retornou resposta que não é JSON ` +
              `(status ${res.status}, ${res.url}): ` +
              texto.slice(0, 120)
          );
        }

        if (!res.ok) {
          throw new Error(
            data?.error || `Erro ao carregar corrida: ${res.status}`
          );
        }

        if (!ativo) return;

        setTrip(normalizarCorrida(data));
      } catch (error) {
        console.error("Erro ao carregar corrida:", error);
        if (ativo) setTrip(null);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    void carregarCorrida();

    return () => {
      ativo = false;
    };
  }, [id]);

  /* --------------------------------- Status --------------------------------- */

  const statusNormalizado = String(trip?.current_status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  const isDriverCanceled =
    statusNormalizado.includes("driver_cancel") ||
    statusNormalizado === "cancelled_by_driver" ||
    statusNormalizado === "canceled_by_driver" ||
    statusNormalizado === "cancelado_pelo_motorista" ||
    statusNormalizado === "cancelada_pelo_motorista";

  const isTripCanceled =
    isDriverCanceled || statusNormalizado.includes("cancel");

  const isCompleted = [
    "completed",
    "complete",
    "concluida",
    "concluída",
    "success",
    "successful",
    "sucesso",
  ].includes(statusNormalizado);

  const isInProgress = [
    "in_progress",
    "ongoing",
    "picked_up",
    "returning",
    "em_andamento",
  ].includes(statusNormalizado);

  const isAccepted = ["accepted", "out_for_pickup", "aceita"].includes(
    statusNormalizado
  );

  const statusColor = isTripCanceled
    ? "border-red-100 bg-red-50 text-red-700"
    : isCompleted
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-amber-100 bg-amber-50 text-amber-700";

  const statusLabel = isDriverCanceled
    ? "Cancelada pelo motorista"
    : isTripCanceled
      ? "Cancelada"
      : isCompleted
        ? "Concluída"
        : isInProgress
          ? "Em andamento"
          : isAccepted
            ? "Aceita"
            : "Pendente";

  /* ------------------------------ Dados derivados ------------------------------ */

  const origem =
    trip?.pickup_address?.trim() || trip?.entrance?.trim() || "";
  const destino = trip?.destination_address?.trim() || "";

  const coordenadaOrigem = useMemo(
    () => montarCoordenada(trip?.pickup_lat, trip?.pickup_lng),
    [trip?.pickup_lat, trip?.pickup_lng]
  );

  const coordenadaDestino = useMemo(
    () => montarCoordenada(trip?.destination_lat, trip?.destination_lng),
    [trip?.destination_lat, trip?.destination_lng]
  );

  const pontoOrigem = coordenadaOrigem || origem;
  const pontoDestino = coordenadaDestino || destino;
  const possuiPontosMapa = Boolean(pontoOrigem || pontoDestino);

  const nomeVeiculo =
    trip?.vehicle?.model?.name?.trim() ||
    trip?.vehicle_model?.trim() ||
    NAO_INFORMADO;

  const placaVeiculo =
    trip?.vehicle?.licence_plate_number?.trim() ||
    trip?.vehicle_plate?.trim() ||
    "";

  const imagemVeiculo =
    trip?.vehicle?.model?.image || trip?.vehicle_model_image || null;

  const categoria =
    trip?.vehicle?.category?.name?.trim() ||
    trip?.vehicle_category?.trim() ||
    NAO_INFORMADO;

  const nomeMotorista =
    trip?.driver?.full_name?.trim() || "Motorista não informado";

  const possuiMotorista =
    Boolean(trip?.driver?.id) ||
    Boolean(trip?.driver?.full_name) ||
    Boolean(trip?.driver?.phone);

  const motivoCancelamento = trip?.cancellation_reason?.trim() || "";

  const valorPago = paraNumero(trip?.paid_fare);
  const valorCorrida =
    valorPago !== null && valorPago > 0 ? valorPago : trip?.estimated_fare;

  const distanciaBanco =
    trip?.actual_distance ?? trip?.estimated_distance ?? null;

  /* ---------------------------------- Mapa ---------------------------------- */

  useEffect(() => {
    if (!trip || !mapaRef.current || !possuiPontosMapa) return;

    let cancelado = false;

    async function iniciarMapa() {
      try {
        await carregarGoogleMaps();

        if (cancelado || !mapaRef.current || !window.google?.maps) return;

        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
          directionsRendererRef.current = null;
        }

        const paraLatLng = (coordenada: string) => {
          const [lat, lng] = coordenada.split(",").map(Number);
          return Number.isFinite(lat) && Number.isFinite(lng)
            ? { lat, lng }
            : null;
        };

        const centroInicial = (coordenadaOrigem &&
          paraLatLng(coordenadaOrigem)) || {
          lat: -23.9608,
          lng: -46.3336,
        };

        const mapa = new window.google.maps.Map(mapaRef.current, {
          center: centroInicial,
          zoom: 14,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: true,
        });

        if (pontoOrigem && pontoDestino) {
          const directionsService = new window.google.maps.DirectionsService();

          const directionsRenderer = new window.google.maps.DirectionsRenderer({
            map: mapa,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: isTripCanceled
                ? "#dc2626"
                : isCompleted
                  ? "#059669"
                  : "#155EEF",
              strokeOpacity: 0.95,
              strokeWeight: 6,
            },
          });

          directionsRendererRef.current = directionsRenderer;

          directionsService.route(
            {
              origin: pontoOrigem,
              destination: pontoDestino,
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (resultado, status) => {
              if (cancelado) return;

              if (
                status === window.google.maps.DirectionsStatus.OK &&
                resultado
              ) {
                directionsRenderer.setDirections(resultado);

                const bounds = resultado.routes[0]?.bounds;
                if (bounds) mapa.fitBounds(bounds, 50);
              } else {
                console.error("Erro ao carregar rota:", status);
              }
            }
          );

          return;
        }

        const coordenada = coordenadaOrigem || coordenadaDestino;
        if (!coordenada) return;

        const position = paraLatLng(coordenada);
        if (!position) return;

        mapa.setCenter(position);
        mapa.setZoom(15);

        new window.google.maps.Marker({
          position,
          map: mapa,
          title: coordenadaOrigem ? "Origem da viagem" : "Destino da viagem",
        });
      } catch (error) {
        if (!cancelado) {
          console.error("Erro ao inicializar Google Maps:", error);
        }
      }
    }

    void iniciarMapa();

    return () => {
      cancelado = true;

      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
    };
  }, [
    trip,
    possuiPontosMapa,
    pontoOrigem,
    pontoDestino,
    coordenadaOrigem,
    coordenadaDestino,
    isTripCanceled,
    isCompleted,
  ]);

  const googleMapsRouteUrl = useMemo(() => {
    if (!pontoOrigem && !pontoDestino) {
      return "https://www.google.com/maps";
    }

    if (pontoOrigem && pontoDestino) {
      return (
        "https://www.google.com/maps/dir/?api=1" +
        `&origin=${encodeURIComponent(pontoOrigem)}` +
        `&destination=${encodeURIComponent(pontoDestino)}` +
        "&travelmode=driving"
      );
    }

    return (
      "https://www.google.com/maps/search/?api=1" +
      `&query=${encodeURIComponent(pontoOrigem || pontoDestino)}`
    );
  }, [pontoOrigem, pontoDestino]);

  /* ------------------------------ Estados de tela ------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[280px] flex-col items-center rounded-[24px] bg-white p-7 shadow-xl ring-1 ring-black/5 sm:max-w-[320px] sm:rounded-[28px] sm:p-8 md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f7f4] sm:h-16 sm:w-16">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#149C8B] border-t-transparent sm:h-8 sm:w-8" />
          </div>
          <p className="mt-5 text-center text-sm font-semibold text-gray-700">
            Carregando viagem
          </p>
          <p className="mt-1 text-center text-xs text-gray-400">
            Aguarde um momento...
          </p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:max-w-md sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-[#073b70] sm:text-xl">
            Viagem não encontrada
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Não foi possível localizar esta viagem.
          </p>
          <Link
            href="/gerente/corridas/viagens"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#073b70] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a4d8f] sm:w-auto"
          >
            <ArrowLeft size={17} className="mr-2" />
            Voltar para viagens
          </Link>
        </div>
      </div>
    );
  }

  /* --------------------------------- Render --------------------------------- */

  return (
    <main className="mb-3 min-h-screen overflow-x-hidden text-sm text-[#073b70]">
      <div className="max-w-8xl mx-auto flex flex-col gap-5 sm:gap-6 lg:gap-7 2xl:gap-8">
        {/* Cabeçalho */}
        <div
          className={`relative overflow-hidden rounded-[22px] border p-5 text-white shadow-sm sm:rounded-[26px] sm:p-7 md:p-8 lg:rounded-[30px] lg:p-9 2xl:rounded-[34px] 2xl:p-10 ${
            isTripCanceled
              ? "border-red-700 bg-gradient-to-br from-red-700 to-red-900"
              : isCompleted
                ? "border-emerald-700 bg-gradient-to-br from-emerald-600 to-emerald-800"
                : "border-amber-600 bg-gradient-to-br from-amber-500 to-amber-700"
          }`}
        >
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:h-14 sm:w-14 2xl:h-16 2xl:w-16">
                {isTripCanceled ? (
                  <XCircle className="h-6 w-6 sm:h-7 sm:w-7" />
                ) : (
                  <CarFront className="h-6 w-6 sm:h-7 sm:w-7" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70">
                  Viagem
                </p>
                <h1 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                  #{trip.ref_id}
                </h1>
                <p className="mt-1 text-xs text-white/75 sm:text-sm">
                  Visualize informações completas da viagem.
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:w-auto">
              <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:min-w-[170px] sm:p-4">
                <p className="text-[11px] font-medium text-white/70 sm:text-xs">
                  Valor da corrida
                </p>
                <h2 className="mt-1 truncate text-lg font-bold sm:text-xl md:text-2xl">
                  {formatarValor(valorCorrida)}
                </h2>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:min-w-[170px] sm:p-4">
                <p className="text-[11px] font-medium text-white/70 sm:text-xs">
                  Distância
                </p>
                <h2 className="mt-1 truncate text-lg font-bold sm:text-xl md:text-2xl">
                  {formatarDistancia(distanciaBanco)}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:gap-6 lg:gap-7 xl:grid-cols-3 2xl:gap-8">
          {/* Coluna principal */}
          <div className="flex min-w-0 flex-col gap-5 md:gap-6 lg:gap-7 xl:col-span-2">
            {/* Status */}
            <section className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[30px] lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl lg:text-2xl">
                    Status da Corrida
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Informações atualizadas da viagem
                  </p>
                </div>
                <div
                  className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${statusColor}`}
                >
                  {isTripCanceled ? (
                    <XCircle size={16} />
                  ) : isCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Clock3 size={16} />
                  )}
                  {statusLabel}
                </div>
              </div>

              {isTripCanceled && (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 sm:p-5">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <XCircle size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-red-700 sm:text-base">
                        {isDriverCanceled
                          ? "Viagem cancelada pelo motorista"
                          : "Viagem cancelada"}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-red-600 sm:text-sm">
                        {isDriverCanceled
                          ? "O motorista cancelou esta viagem. A viagem permanece disponível para consulta."
                          : "Esta viagem foi cancelada, mas os dados registrados permanecem disponíveis para consulta."}
                      </p>
                      {motivoCancelamento && (
                        <p className="mt-3 break-words rounded-xl border border-red-100 bg-white px-3 py-2 text-xs leading-5 text-red-700 sm:text-sm">
                          <span className="font-bold">Motivo: </span>
                          {motivoCancelamento}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b]">
                    <CalendarDays size={20} />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Data da corrida
                  </p>
                  <h3 className="mt-2 break-words text-sm font-bold leading-5 text-[#073b70]">
                    {formatarData(trip.created_at)}
                  </h3>
                </div>

                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Wallet size={20} />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Meio de pagamento
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex max-w-full rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:text-sm">
                      {traduzirMetodoPagamento(trip.payment_method)}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Wallet size={20} />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Valor da corrida
                  </p>
                  <h3 className="mt-2 truncate text-lg font-bold text-[#073b70] sm:text-xl">
                    {formatarValor(valorCorrida)}
                  </h3>
                </div>
              </div>
            </section>

            {/* Trajeto */}
            <section className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm sm:rounded-[26px] lg:rounded-[30px]">
              <div className="p-5 sm:p-6 md:p-7 lg:p-8">
                <div className="mb-5 flex items-center gap-3 sm:mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b] sm:h-11 sm:w-11">
                    <Navigation size={21} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl lg:text-2xl">
                      Trajeto da Corrida
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Origem e destino da viagem
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5 sm:gap-6">
                  <div className="relative">
                    <div className="absolute left-5 top-5 h-[calc(100%-40px)] w-px bg-slate-200" />
                    <div className="relative flex min-w-0 gap-3 sm:gap-4">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#149c8b] shadow-sm">
                        <MapPin size={16} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#149c8b] sm:text-xs">
                          Origem
                        </p>
                        <h3 className="mt-2 break-words text-sm font-bold leading-6 text-[#073b70] sm:text-base">
                          {origem || NAO_INFORMADO}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Local de embarque
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-4 flex min-w-0 gap-3 sm:gap-4">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#073b70] shadow-sm">
                        <Navigation size={16} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#073b70] sm:text-xs">
                          Destino
                        </p>
                        <h3 className="mt-2 break-words text-sm font-bold leading-6 text-[#073b70] sm:text-base">
                          {destino || NAO_INFORMADO}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Destino final
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                    {possuiPontosMapa ? (
                      <div
                        ref={mapaRef}
                        className="block h-[280px] w-full sm:h-[360px] md:h-[420px] lg:h-[460px] xl:h-[500px]"
                      />
                    ) : (
                      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center sm:min-h-[360px]">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#149c8b] shadow-sm">
                          <MapPin size={25} />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-[#073b70]">
                          Mapa indisponível
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                          A origem e o destino desta viagem não foram
                          informados.
                        </p>
                      </div>
                    )}
                  </div>

                  {possuiPontosMapa && (
                    <a
                      href={googleMapsRouteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition active:scale-[0.99] sm:w-auto ${
                        isTripCanceled
                          ? "bg-red-700 hover:bg-red-800"
                          : isCompleted
                            ? "bg-emerald-700 hover:bg-emerald-800"
                            : "bg-[#073b70] hover:bg-[#0a4d8f]"
                      }`}
                    >
                      <Navigation size={17} />
                      {pontoOrigem && pontoDestino
                        ? "Abrir rota no Google Maps"
                        : "Abrir localização no Google Maps"}
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Coluna lateral */}
          <div className="flex min-w-0 flex-col gap-5 md:gap-6 lg:gap-7">
            {isTripCanceled && (
              <section className="rounded-[22px] border border-red-100 bg-white p-5 shadow-sm sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[30px]">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
                    <XCircle size={38} />
                  </div>
                  <span className="mt-5 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-red-500">
                    {isDriverCanceled
                      ? "Cancelada pelo motorista"
                      : "Viagem cancelada"}
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-[#073b70] sm:text-2xl">
                    Viagem cancelada
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {isDriverCanceled
                      ? "O motorista cancelou esta viagem. Os dados da corrida continuam disponíveis para consulta."
                      : "Esta viagem foi cancelada. Os dados registrados continuam disponíveis para consulta."}
                  </p>
                </div>
              </section>
            )}

            {/* Motorista */}
            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[30px]">
              <div className="mb-5 flex items-center gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#073b70] sm:h-11 sm:w-11">
                  <CarFront size={21} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl lg:text-2xl">
                    Motorista
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Informações do condutor
                  </p>
                </div>
              </div>

              {!possuiMotorista ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <Clock3 size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-700">
                        Motorista não informado
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-amber-600">
                        {isTripCanceled
                          ? "Não existem dados de motorista registrados para esta viagem."
                          : "Os dados do motorista aparecerão aqui quando um motorista aceitar a corrida."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d9f8f3] to-[#eefbf9]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-10 w-10 text-[#008f80]"
                      >
                        <path
                          d="M20 21a8 8 0 0 0-16 0"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="12"
                          cy="7"
                          r="4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Motorista
                      </p>
                      <h3 className="mt-1 break-words text-lg font-bold text-[#073b70] sm:text-xl">
                        {nomeMotorista}
                      </h3>
                      <span className="mt-2 inline-flex rounded-lg bg-[#e8f7f3] px-3 py-1 text-xs font-semibold text-[#008f80]">
                        Motorista
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Telefone
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f7f3] text-[#149c8b]">
                        <Phone size={17} />
                      </div>
                      <p className="break-words text-sm font-bold text-[#073b70] sm:text-base">
                        {mascararTelefone(trip.driver?.phone)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl p-4 text-white sm:p-5 ${
                      isTripCanceled
                        ? "bg-gradient-to-br from-red-700 to-red-900"
                        : isCompleted
                          ? "bg-gradient-to-br from-emerald-600 to-emerald-800"
                          : "bg-gradient-to-br from-[#073b70] to-[#149c8b]"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70 sm:text-xs">
                      Status do motorista
                    </p>
                    <h3 className="mt-2 text-lg font-bold sm:text-xl">
                      {isTripCanceled
                        ? "Viagem cancelada"
                        : "Vinculado à corrida"}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      {isTripCanceled
                        ? "O motorista estava vinculado a esta corrida, mas a viagem foi cancelada."
                        : "Motorista vinculado à corrida e responsável pelo atendimento desta viagem."}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Veículo */}
            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[30px]">
              <div className="mb-5 flex items-center gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b] sm:h-11 sm:w-11">
                  <CarFront size={21} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl lg:text-2xl">
                    Veículo
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Informações do veículo utilizado
                  </p>
                </div>
              </div>

              {imagemVeiculo && (
                <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://auth.maylon.com.br/storage/app/public/vehicle/model/${imagemVeiculo}`}
                    alt={nomeVeiculo}
                    className="h-40 w-full object-contain p-0"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { rotulo: "Modelo", valor: nomeVeiculo },
                  { rotulo: "Placa", valor: placaVeiculo || NAO_INFORMADO },
                  { rotulo: "Categoria", valor: categoria },
                ].map((item) => (
                  <div
                    key={item.rotulo}
                    className="rounded-2xl bg-[#f8fafb] p-4"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {item.rotulo}
                    </p>
                    <p className="mt-2 break-words text-xs font-bold text-[#073b70]">
                      {item.valor}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <Link
              href="/gerente/corridas/viagens"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-[#073b70] shadow-sm transition hover:border-[#149c8b] hover:text-[#149c8b]"
            >
              <ArrowLeft size={17} />
              Voltar para todas as viagens
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}