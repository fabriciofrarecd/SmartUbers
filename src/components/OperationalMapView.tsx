import React, { useState, useEffect } from 'react';
import { RegionZone, StrategicStop, DemandObservation, SemaphoreStatus } from '../types';
import {
  X,
  Layers,
  MapPin,
  Navigation,
  ExternalLink,
  Flame,
  ShieldCheck,
  Fuel,
  Compass,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Radio,
  RefreshCw
} from 'lucide-react';

interface OperationalMapViewProps {
  isOpen: boolean;
  onClose: () => void;
  regions: RegionZone[];
  currentRegion: RegionZone;
  onSelectRegion: (r: RegionZone) => void;
  strategicStops: StrategicStop[];
  demandObservations: DemandObservation[];
  userCoords: { lat: number; lng: number } | null;
  onOpenDemandRegistration: () => void;
}

export const OperationalMapView: React.FC<OperationalMapViewProps> = ({
  isOpen,
  onClose,
  regions,
  currentRegion,
  onSelectRegion,
  strategicStops,
  demandObservations,
  userCoords,
  onOpenDemandRegistration,
}) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [justInTimeRadar, setJustInTimeRadar] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(2);
  const [selectedZone, setSelectedZone] = useState<RegionZone>(currentRegion);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 15 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Center around Sorocaba / Votorantim border
  const mapCenterLat = -23.5150;
  const mapCenterLng = -47.4580;

  // Coordinate projection for Sorocaba / Votorantim bounding box
  // Lat range: -23.44 (Éden) to -23.56 (Votorantim Sul)
  // Lng range: -47.52 (Wanel Ville) to -47.38 (Zona Industrial)
  const minLat = -23.56;
  const maxLat = -23.44;
  const minLng = -47.52;
  const maxLng = -47.38;

  const projectToPercent = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Invert Y because latitude goes South (negative)
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const selectedStop = selectedZone.strategicStops[0];
  const wazeTargetLat = selectedStop?.lat || selectedZone.center.lat;
  const wazeTargetLng = selectedStop?.lng || selectedZone.center.lng;
  const wazeUrl = `https://waze.com/ul?ll=${wazeTargetLat},${wazeTargetLng}&navigate=yes`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-2xl flex flex-col h-[90vh] max-h-[820px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/[0.04] backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-white">
                MAPA OPERACIONAL • SOROCABA & VOTORANTIM
              </h2>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Tráfego + Calor
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Camadas de demanda histórica, observações de motoristas e pontos seguros de parada.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layer Filters & Quick Controls */}
        <div className="p-3 bg-white/[0.02] backdrop-blur-md border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition backdrop-blur-sm ${
                showHeatmap
                  ? 'bg-purple-500/25 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'bg-white/[0.05] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>Mapa de Calor ({demandObservations.length} pontos)</span>
            </button>

            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition backdrop-blur-sm ${
                showTraffic
                  ? 'bg-amber-500/25 border-amber-500/50 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-white/[0.05] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>Trânsito Tempo Real</span>
            </button>

            <button
              onClick={() => setShowStops(!showStops)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition backdrop-blur-sm ${
                showStops
                  ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-200 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                  : 'bg-white/[0.05] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Fuel className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paradas Seguras ({strategicStops.length})</span>
            </button>

            <button
              onClick={() => setJustInTimeRadar(!justInTimeRadar)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition backdrop-blur-sm ${
                justInTimeRadar
                  ? 'bg-sky-500/25 border-sky-500/50 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : 'bg-white/[0.05] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Just-In-Time ({secondsAgo}s)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDemandRegistration}
              className="rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 transition flex items-center gap-1 shadow-sm active:scale-95 border border-purple-400/30 backdrop-blur-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Registrar Uber</span>
            </button>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs px-3 py-1.5 transition flex items-center gap-1 shadow-sm active:scale-95 border border-cyan-400/30 backdrop-blur-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Waze</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Map Canvas / Vector Stage */}
        <div className="relative flex-1 bg-slate-950/90 overflow-hidden select-none">
          {/* Map Grid Pattern Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Road Network Lines (Sorocaba / Votorantim Key Arteries) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Raposo Tavares (Highway SP-270) connecting East to West */}
            <path
              d="M 5 62 Q 45 68 95 60"
              stroke="#64748b"
              strokeWidth="1.2"
              strokeDasharray={showTraffic ? 'none' : '2 2'}
              fill="none"
              opacity={showTraffic ? 0.7 : 0.3}
            />
            {/* Av. Dom Aguirre (Marginal Sorocaba) running North-South */}
            <path
              d="M 46 15 Q 52 45 44 85"
              stroke={showTraffic ? '#f59e0b' : '#475569'}
              strokeWidth="1.5"
              fill="none"
              opacity={0.8}
            />
            {/* Av. Antônio Carlos Comitre (Campolim to Iguatemi) */}
            <path
              d="M 44 58 L 42 75 L 40 85"
              stroke={showTraffic ? '#ef4444' : '#475569'}
              strokeWidth="1.8"
              fill="none"
              opacity={0.9}
            />
            {/* Av. 31 de Março (Votorantim Center connection) */}
            <path
              d="M 42 75 L 56 82 L 60 92"
              stroke={showTraffic ? '#10b981' : '#475569'}
              strokeWidth="1.4"
              fill="none"
              opacity={0.8}
            />
            {/* Av. General Carneiro (West corridor) */}
            <path
              d="M 44 48 L 22 55 L 8 58"
              stroke={showTraffic ? '#f59e0b' : '#475569'}
              strokeWidth="1.3"
              fill="none"
              opacity={0.8}
            />
            {/* Rodovia Castelo Branco / Éden corridor */}
            <path
              d="M 50 20 L 78 12 L 95 10"
              stroke={showTraffic ? '#ef4444' : '#475569'}
              strokeWidth="1.6"
              fill="none"
              opacity={0.8}
            />
          </svg>

          {/* Just-in-Time Concentric Radar Distance Rings & Sweep Beam */}
          {justInTimeRadar && (
            <>
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 border border-sky-500/20 rounded-full"
                style={{
                  left: `${projectToPercent(userCoords?.lat || currentRegion.center.lat, userCoords?.lng || currentRegion.center.lng).x}%`,
                  top: `${projectToPercent(userCoords?.lat || currentRegion.center.lat, userCoords?.lng || currentRegion.center.lng).y}%`,
                  width: '200px',
                  height: '200px',
                }}
              />
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 border border-sky-500/15 rounded-full"
                style={{
                  left: `${projectToPercent(userCoords?.lat || currentRegion.center.lat, userCoords?.lng || currentRegion.center.lng).x}%`,
                  top: `${projectToPercent(userCoords?.lat || currentRegion.center.lat, userCoords?.lng || currentRegion.center.lng).y}%`,
                  width: '420px',
                  height: '420px',
                }}
              />
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-radar-sweep origin-center"
                style={{
                  left: `${projectToPercent(userCoords?.lat || currentRegion.center.lat, userCoords?.lng || currentRegion.center.lng).x}%`,
                  top: `${projectToPercent(userCoords?.lat || currentRegion.center.lat, userCoords?.lng || currentRegion.center.lng).y}%`,
                  width: '500px',
                  height: '500px',
                }}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(56, 189, 248, 0.22) 0deg, rgba(168, 85, 247, 0.12) 35deg, transparent 75deg)',
                  }}
                />
              </div>
            </>
          )}

          {/* Heatmap Layer */}
          {showHeatmap && (
            <>
              {demandObservations.map((obs) => {
                const pos = projectToPercent(obs.lat, obs.lng);
                return (
                  <div
                    key={obs.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-purple-500/25 blur-xl animate-pulse" />
                    <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-500/30 blur-md" />
                  </div>
                );
              })}
            </>
          )}

          {/* Sorocaba & Votorantim Operational Zones */}
          {regions.map((region) => {
            const pos = projectToPercent(region.center.lat, region.center.lng);
            const isSelected = selectedZone.id === region.id;
            const isCurrent = currentRegion.id === region.id;

            return (
              <div
                key={region.id}
                onClick={() => {
                  setSelectedZone(region);
                  onSelectRegion(region);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {/* Zone Circle */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black text-xs shadow-xl transition-all duration-200 backdrop-blur-md ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/50 scale-125 z-30 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                      : isCurrent
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                      : 'bg-white/10 text-slate-200 border border-white/20 hover:scale-110 hover:bg-white/20'
                  }`}
                >
                  <span className="font-mono">{region.historicalScore}</span>
                </div>

                {/* Zone Label */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap bg-black/75 border border-white/15 backdrop-blur-md rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-200 shadow-md pointer-events-none">
                  {region.name}
                  {region.surgeObserved > 0 && (
                    <span className="ml-1 text-amber-400 font-mono">
                      +R${region.surgeObserved.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Strategic Stops (Gas stations, shopping safe spots) */}
          {showStops &&
            strategicStops.map((stop) => {
              const pos = projectToPercent(stop.lat, stop.lng);
              return (
                <div
                  key={stop.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-15 group cursor-pointer"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  title={`${stop.name} (${stop.category})`}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-400 border-2 border-black/80 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-125 transition-transform">
                    <Fuel className="w-3 h-3 fill-current" />
                  </div>
                </div>
              );
            })}

          {/* User Live GPS Marker */}
          {userCoords && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
              style={{
                left: `${projectToPercent(userCoords.lat, userCoords.lng).x}%`,
                top: `${projectToPercent(userCoords.lat, userCoords.lng).y}%`,
              }}
            >
              <div className="w-6 h-6 rounded-full bg-sky-500/30 animate-ping absolute inset-0" />
              <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-xl relative" />
            </div>
          )}

          {/* Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-30 bg-black/60 border border-white/15 rounded-2xl p-2.5 text-[10px] text-slate-300 backdrop-blur-xl max-w-xs shadow-lg">
            <div className="font-bold text-white mb-1">Legenda Operacional</div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
                <span>Mancha de calor (demanda observada)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                <span>Ponto seguro de parada (posto 24h / shopping)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
                <span>Sua localização atual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Zone Detail Panel Bottom */}
        <div className="p-3 sm:p-4 bg-white/[0.04] backdrop-blur-xl border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                {selectedZone.name} ({selectedZone.city})
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 backdrop-blur-sm">
                Score {selectedZone.historicalScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl truncate">
              {selectedZone.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectRegion(selectedZone)}
              className="rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.15] px-3 py-2 text-xs font-semibold text-slate-200 transition backdrop-blur-sm"
            >
              Fixar como Atual
            </button>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 transition flex items-center gap-1.5 shadow-md active:scale-95 border border-cyan-400/30 backdrop-blur-sm"
            >
              <Navigation className="w-4 h-4" />
              <span>Navegar via Waze</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
