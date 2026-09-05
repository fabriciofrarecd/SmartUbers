import React, { useState } from 'react';
import { RegionZone, VehicleConfig, SystemSettings, PositioningRecommendation } from '../types';
import { getTopPositioningRecommendations } from '../utils/operationalMath';
import {
  X,
  Compass,
  Navigation,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Car,
  ChevronRight
} from 'lucide-react';

interface PositioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverLat: number;
  driverLng: number;
  regions: RegionZone[];
  vehicleConfig: VehicleConfig;
  settings: SystemSettings;
  currentRegion: RegionZone;
  onSelectRegion: (r: RegionZone) => void;
}

export const PositioningModal: React.FC<PositioningModalProps> = ({
  isOpen,
  onClose,
  driverLat,
  driverLng,
  regions,
  vehicleConfig,
  settings,
  currentRegion,
  onSelectRegion,
}) => {
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5);

  if (!isOpen) return null;

  const recommendations = getTopPositioningRecommendations(
    driverLat,
    driverLng,
    regions,
    vehicleConfig,
    settings,
    searchRadiusKm
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-2xl p-4 sm:p-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">ONDE DEVO FICAR?</h2>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Estratégia Territorial
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Top 3 alternativas para reduzir quilômetros vazios em Sorocaba e Votorantim.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Radius Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-xs">
          <span className="text-slate-300 font-medium">Raio de busca a partir da sua posição:</span>
          <div className="flex items-center gap-1.5">
            {[1, 3, 5, 10].map((radius) => (
              <button
                key={radius}
                onClick={() => setSearchRadiusKm(radius)}
                className={`px-3 py-1.5 rounded-xl font-bold transition backdrop-blur-sm ${
                  searchRadiusKm === radius
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'bg-white/[0.07] text-slate-300 hover:bg-white/[0.15] border border-white/10'
                }`}
              >
                {radius} km
              </button>
            ))}
          </div>
        </div>

        {/* Anti-surge Chase Rule Callout */}
        <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/15 backdrop-blur-sm p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Regra de Ouro: Não Perseguir o Dinâmico!</strong> Se uma região distante tiver adicional mas o deslocamento vazio custar mais de R$ 5 em combustível e manutenção, o sistema orienta permanecer posicionado. Dinâmicos oscilam antes da chegada.
          </div>
        </div>

        {/* Top 3 Recommendations Cards */}
        <div className="mt-4 space-y-3">
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhuma região dentro do raio de {searchRadiusKm} km. Aumente o raio para 5 km ou 10 km.
            </div>
          ) : (
            recommendations.map((rec) => {
              const isCurrent = rec.region.id === currentRegion.id;
              const targetStop = rec.region.strategicStops[0];
              const wazeUrl = `https://waze.com/ul?ll=${targetStop?.lat || rec.region.center.lat},${targetStop?.lng || rec.region.center.lng}&navigate=yes`;

              return (
                <div
                  key={rec.region.id}
                  className={`rounded-2xl border p-4 transition backdrop-blur-md ${
                    rec.semaphore === 'GREEN'
                      ? 'border-emerald-500/40 bg-white/[0.04] hover:bg-white/[0.07] shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                      : rec.semaphore === 'YELLOW'
                      ? 'border-amber-500/40 bg-white/[0.04] hover:bg-white/[0.07] shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 text-white font-black text-xs flex items-center justify-center font-mono border border-white/15">
                        #{rec.rank}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {rec.region.name}{' '}
                        <span className="text-xs font-normal text-slate-400">({rec.region.city})</span>
                      </h3>
                      {isCurrent && (
                        <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-sky-500/30 backdrop-blur-sm">
                          Sua Posição
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md backdrop-blur-sm ${
                          rec.recommendationType === 'PERMANECER'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            : rec.recommendationType === 'POSICIONAR'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                        }`}
                      >
                        {rec.recommendationType === 'PERMANECER'
                          ? '🟢 PERMANECER'
                          : rec.recommendationType === 'POSICIONAR'
                          ? '🔵 POSICIONAR'
                          : '🔴 NÃO IR'}
                      </span>
                      <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 backdrop-blur-sm">
                        Score {rec.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Telemetry row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 text-xs">
                    <div className="text-slate-300">
                      Distância: <strong className="text-white font-mono">{rec.distanceKm} km</strong>
                    </div>
                    <div className="text-slate-300">
                      Tempo trânsito: <strong className="text-white font-mono">~{rec.travelTimeMin} min</strong>
                    </div>
                    <div className="text-slate-300">
                      Espera típica: <strong className="text-emerald-300 font-mono">~{rec.region.typicalWaitMinutes} min</strong>
                    </div>
                    <div className="text-slate-300">
                      Adicional visível:{' '}
                      <strong className="text-amber-300 font-mono">
                        {rec.region.surgeObserved > 0 ? `+R$ ${rec.region.surgeObserved.toFixed(2)}` : 'Nenhum'}
                      </strong>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.03] p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
                    {rec.reasoning}
                  </p>

                  {/* Strategic Stop Point in this region */}
                  {targetStop && (
                    <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between">
                      <span>
                        Ponto sugerido: <strong className="text-white">{targetStop.name}</strong>
                      </span>
                      <span className="text-slate-400">{targetStop.notes}</span>
                    </div>
                  )}

                  {/* Data Sources and Waze button */}
                  <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sky-400" />
                        Confiança {rec.confidence}
                      </span>
                      <span>•</span>
                      <span>{rec.dataSources.userObservationsCount} obs. Uber</span>
                      <span>•</span>
                      <span>{rec.dataSources.historicalRecordsCount} dados históricos</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs px-3 py-1.5 transition shadow-sm active:scale-95 border border-cyan-400/30 backdrop-blur-sm"
                        title="Navegar direto pelo Waze"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Abrir no Waze</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.15] px-4 py-2 text-xs font-semibold text-slate-200 transition backdrop-blur-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
