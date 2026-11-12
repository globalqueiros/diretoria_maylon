"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

interface Trip {
  id: string | number;
  origin_lat: number | string | null;
  origin_lng: number | string | null;
  destination_lat: number | string | null;
  destination_lng: number | string | null;
  status?: string | null;
  service_type?: string | null;
}

interface ApiResponse {
  trips?: Trip[];
  data?: Trip[];
  error?: string;
  message?: string;
}

const center = {
  lat: -23.9608,
  lng: -46.3336,
};

const mapContainerStyle = {
  width: "100%",
  height: "700px",
};

function normalizarTexto(
  valor?: string | null
): string {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function obterCorRota(
  serviceType?: string | null
): string {
  const tipo = normalizarTexto(serviceType);

  if (
    tipo === "hospital" ||
    tipo === "ambulancia" ||
    tipo === "ambulancias" ||
    tipo.includes("hospital") ||
    tipo.includes("ambulancia")
  ) {
    return "#dc2626";
  }

  if (
    tipo === "policia" ||
    tipo === "policiamento" ||
    tipo.includes("policia")
  ) {
    return "#2563eb";
  }

  if (
    tipo === "bombeiro" ||
    tipo === "bombeiros" ||
    tipo.includes("bombeiro")
  ) {
    return "#f97316";
  }

  return "#35a989";
}

function obterNomeServico(
  serviceType?: string | null
): string {
  const tipo = normalizarTexto(serviceType);

  if (
    tipo === "hospital" ||
    tipo === "ambulancia" ||
    tipo.includes("hospital") ||
    tipo.includes("ambulancia")
  ) {
    return "Hospital / Ambulância";
  }

  if (tipo.includes("policia")) {
    return "Polícia";
  }

  if (tipo.includes("bombeiro")) {
    return "Bombeiros";
  }

  return "Normal";
}

export default function TripsMap() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] =
    useState<Date | null>(null);

  const googleMapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
  });

  useEffect(() => {
    let ativo = true;

    async function carregarViagens() {
      try {
        if (!ativo) {
          return;
        }

        setLoading(true);
        setError("");

        const response = await fetch("/api/trips/map", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const texto = await response.text();

        let data: ApiResponse | Trip[] | null = null;

        if (texto.trim()) {
          try {
            data = JSON.parse(texto);
          } catch (jsonError) {
            console.error(
              "Erro ao interpretar JSON da API:",
              jsonError
            );

            throw new Error(
              `A API retornou uma resposta inválida. Status HTTP: ${response.status}.`
            );
          }
        }

        if (!response.ok) {
          let mensagem = `Erro HTTP ${response.status}`;

          if (
            data &&
            !Array.isArray(data) &&
            typeof data === "object"
          ) {
            mensagem =
              data.error ||
              data.message ||
              mensagem;
          }

          throw new Error(mensagem);
        }

        let lista: Trip[] = [];

        if (Array.isArray(data)) {
          lista = data;
        } else if (
          data &&
          typeof data === "object" &&
          Array.isArray(data.trips)
        ) {
          lista = data.trips;
        } else if (
          data &&
          typeof data === "object" &&
          Array.isArray(data.data)
        ) {
          lista = data.data;
        } else {
          throw new Error(
            "A API de viagens não retornou uma lista válida."
          );
        }

        const viagensValidas = lista.filter(
          (trip) =>
            trip &&
            trip.id !== undefined &&
            trip.id !== null
        );

        if (!ativo) {
          return;
        }

        setTrips(viagensValidas);
        setLastUpdate(new Date());
        setError("");
      } catch (err: unknown) {
        console.error(
          "Erro ao carregar viagens:",
          err
        );

        if (!ativo) {
          return;
        }

        const mensagem =
          err instanceof Error
            ? err.message
            : "Erro ao carregar viagens.";

        setError(mensagem);
        setTrips([]);
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarViagens();

    return () => {
      ativo = false;
    };
  }, []);

  const viagensComCoordenadas = useMemo(() => {
    return trips
      .map((trip) => {
        const originLat = Number(trip.origin_lat);
        const originLng = Number(trip.origin_lng);
        const destinationLat = Number(
          trip.destination_lat
        );
        const destinationLng = Number(
          trip.destination_lng
        );

        if (
          !Number.isFinite(originLat) ||
          !Number.isFinite(originLng) ||
          !Number.isFinite(destinationLat) ||
          !Number.isFinite(destinationLng)
        ) {
          console.warn(
            "Viagem ignorada por coordenadas inválidas:",
            trip
          );

          return null;
        }

        return {
          trip,
          originLat,
          originLng,
          destinationLat,
          destinationLng,
        };
      })
      .filter(
        (
          item
        ): item is {
          trip: Trip;
          originLat: number;
          originLng: number;
          destinationLat: number;
          destinationLng: number;
        } => item !== null
      );
  }, [trips]);

  if (!googleMapsApiKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
        <div className="font-semibold">
          Google Maps não configurado
        </div>

        <p className="mt-1 text-sm">
          A variável{" "}
          <code className="mx-1 rounded bg-amber-100 px-1">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          não foi encontrada.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
        <div className="text-sm font-bold">
          Erro ao carregar o Google Maps
        </div>

        <div className="mt-1 text-sm">
          Verifique a chave da API e as APIs habilitadas
          no Google Cloud.
        </div>

        <code className="mt-2 block rounded-lg bg-red-100 p-2 text-xs">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[700px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600" />

          <p className="text-sm text-gray-500">
            Carregando mapa...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="absolute left-4 top-4 z-10 min-w-[145px] rounded-xl bg-white px-4 py-3 shadow-lg">
        <div className="text-sm font-bold text-gray-900">
          Mapa de viagens
        </div>

        <div className="mt-1 text-xs text-gray-500">
          {loading
            ? "Carregando viagens..."
            : `${viagensComCoordenadas.length} ${
                viagensComCoordenadas.length === 1
                  ? "viagem"
                  : "viagens"
              }`}
        </div>

        {!loading && trips.length > 0 && (
          <div className="mt-1 text-[11px] text-gray-400">
            {trips.length !==
              viagensComCoordenadas.length &&
              `${trips.length} recebidas`}
          </div>
        )}
      </div>

      {error && (
        <div className="absolute right-4 top-4 z-20 max-w-[360px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
              !
            </div>

            <div>
              <div className="text-sm font-bold text-red-700">
                Erro ao buscar viagens
              </div>

              <div className="mt-1 break-words text-xs text-red-600">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-5 left-4 z-10 rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="mb-2 text-xs font-bold text-gray-700">
          Tipos de viagem
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#35a989" }}
            />

            <span className="text-xs text-gray-600">
              Normal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#dc2626" }}
            />

            <span className="text-xs text-gray-600">
              Hospital / Ambulância
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#2563eb" }}
            />

            <span className="text-xs text-gray-600">
              Polícia
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#f97316" }}
            />

            <span className="text-xs text-gray-600">
              Bombeiros
            </span>
          </div>
        </div>
      </div>

      {lastUpdate && (
        <div className="absolute bottom-5 right-4 z-10 rounded-lg bg-white/95 px-3 py-2 text-[10px] text-gray-400 shadow backdrop-blur">
          Atualizado às{" "}
          {lastUpdate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      <GoogleMap
        center={center}
        zoom={11}
        mapContainerStyle={mapContainerStyle}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        }}
      >
        {viagensComCoordenadas.map(
          ({
            trip,
            originLat,
            originLng,
            destinationLat,
            destinationLng,
          }) => {
            const strokeColor = obterCorRota(
              trip.service_type
            );

            const nomeServico = obterNomeServico(
              trip.service_type
            );

            const path = [
              {
                lat: originLat,
                lng: originLng,
              },
              {
                lat: destinationLat,
                lng: destinationLng,
              },
            ];

            return (
              <Fragment key={String(trip.id)}>
                <Marker
                  position={{
                    lat: originLat,
                    lng: originLng,
                  }}
                  title={`Origem - Viagem ${trip.id}`}
                  label={{
                    text: "O",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }}
                />

                <Marker
                  position={{
                    lat: destinationLat,
                    lng: destinationLng,
                  }}
                  title={`Destino - Viagem ${trip.id}`}
                  label={{
                    text: "D",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }}
                />

                <Polyline
                  path={path}
                  options={{
                    strokeColor,
                    strokeOpacity: 0.9,
                    strokeWeight: 5,
                    geodesic: true,
                  }}
                />

                <Marker
                  position={{
                    lat: originLat,
                    lng: originLng,
                  }}
                  title={`${nomeServico} - Viagem ${trip.id}`}
                  visible={false}
                />
              </Fragment>
            );
          }
        )}
      </GoogleMap>
    </div>
  );
}