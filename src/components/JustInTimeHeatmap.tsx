import React, { useState, useEffect, useMemo } from 'react';
import { RegionZone, StrategicStop, DemandObservation } from '../types';
import {
  Flame,
  Radio,
  RefreshCw,
  Navigation,
  ExternalLink,
  MapPin,
  Clock,
  ShieldCheck,
  Fuel,
  Maximize2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Eye,
  Camera
} from 'lucide-react';

interface JustInTimeHeatmapProps {
  regions: RegionZone[];
  currentRegion: RegionZone;
  onSelectRegion: (region: RegionZone) => void;
  strategicStops: StrategicStop[];
  demandObservations: DemandObservation[];
  userCoords: { lat: number; lng: number } | null;
  onOpenFullMap: () => void;
  onOpenDemandRegistration: () => void;
}

export const JustInTimeHeatmap: React.FC<JustInTimeHeatmapProps> = ({
  regions,
  currentRegion,
  onSelectRegion,
  strategicStops,
  demandObservations,
  userCoords,
  onOpenFullMap,
  onOpenDemandRegistration,
}) => {
  const [selectedZone, setSelectedZone] = useState<RegionZone>(currentRegion);
  const [filterMode, setFilterMode] = useState<'ALL' | 'SURGE_ONLY' | 'HIGH_DEMAND'>('ALL');
  const [showRadarSweep, setShowRadarSweep] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(2);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bounds for Sorocaba & Votorantim projection
  const minLat = -23.56;
  const maxLat = -23.44;
  const minLng = -47.52;
  const maxLng = -47.38;

  const projectToPercent = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(6, Math.min(94, y)),
    };
  };

  // Keep selected zone in sync if currentRegion changes from parent
  useEffect(() => {
    setSelectedZone(currentRegion);
  }, [currentRegion]);

  // Just-in-time ticker timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 15 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSecondsAgo(0);
      setIsRefreshing(false);
    }, 600);
  };

  // Filtered regions based on chip selection
  const visibleRegions = useMemo(() => {
    if (filterMode === 'SURGE_ONLY') {
      return regions.filter((r) => r.surgeObserved > 0);
    }
    if (filterMode === 'HIGH_DEMAND') {
      return regions.filter((r) => r.currentDemandScore >= 70);
    }
    return regions;
  }, [regions, filterMode]);

  // Selected zone coordinates for Waze
  const selectedStop = selectedZone.strategicStops[0];
  const targetLat = selectedStop?.lat || selectedZone.center.lat;
  const targetLng = selectedStop?.lng || selectedZone.center.lng;
  const wazeUrl = `https://waze.com/ul?ll=${targetLat},${targetLng}&navigate=yes`;

  // Projection of driver position
  const driverLat = userCoords?.lat || currentRegion.center.lat;
  const driverLng = userCoords?.lng || currentRegion.center.lng;
  const driverPos = projectToPercent(driverLat, driverLng);

  // Live real-time events feed for Sorocaba & Votorantim
  const liveEvents = useMemo(() => {
    return [
      {
        id: 'ev-1',
        time: 'Agora',
        location: 'Campolim (Av. Comitre)',
        tag: 'SURTO DETECTADO',
        tagColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
        text: 'Adicional de +R$ 6,50 ativo. Fila de espera baixa (~3 min).',
        surge: 6.5,
      },
      {
        id: 'ev-2',
        time: 'há 2 min',
        location: 'Parque Bela Vista / Iguatemi',
        tag: 'ALTA DEMANDA',
        tagColor: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
        text: 'Pico de saídas de compras na Ala Sul. Score 88/100.',
        surge: 4.5,
      },
      {
        id: 'ev-3',
        time: 'há 4 min',
        location: 'Centro de Sorocaba',
        tag: 'FLUXO CONSTANTE',
        tagColor: 'text-sky-300 bg-sky-500/20 border-sky-500/40',
        text: 'Terminal Santo Antônio com chamados estáveis. Trânsito lento.',
        surge: 3.0,
      },
      {
        id: 'ev-4',
        time: 'há 7 min',
        location: 'Éden & Zona Industrial',
        tag: 'TROCA DE TURNO',
        tagColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
        text: 'Castelo Branco com fluxo intenso. Risco de retorno vazio monitorado.',
        surge: 8.0,
      },
    ];
  }, []);

  return (
    <div className="relative rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-2xl overflow-hidden transition-all">
      {/* Top subtle glow bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-amber-400 to-sky-400 opacity-90" />

      {/* Header with Live Status & Controls */}
      <div className="p-3.5 sm:p-5 border-b border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 backdrop-blur-md shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <Flame className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  MAPA DE CALOR JUST-IN-TIME
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AO VIVO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Monitoramento contínuo de calor, dinâmicos e concentração de chamados em Sorocaba e Votorantim.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Live Refresh Ticker */}
          <button
            onClick={handleManualRefresh}
            title="Atualizar varredura agora"
            className="flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs transition backdrop-blur-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="font-mono text-[11px]">Varredura: {secondsAgo}s atrás</span>
          </button>

          {/* Radar toggle */}
          <button
            onClick={() => setShowRadarSweep(!showRadarSweep)}
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition backdrop-blur-sm ${
              showRadarSweep
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                : 'bg-white/[0.05] border-white/10 text-slate-400'
            }`}
            title="Ativar/desativar feixe de varredura radar"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Radar</span>
          </button>

          {/* Expand to Full Tactical Map */}
          <button
            onClick={onOpenFullMap}
            className="flex items-center gap-1.5 bg-sky-600/90 hover:bg-sky-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-md shadow-sky-900/30 border border-sky-400/30 active:scale-95"
            title="Abrir em tela cheia com rotas e camadas completas"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TELA CHEIA</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-3.5 sm:px-5 py-2.5 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold uppercase mr-1">Filtro:</span>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterMode === 'ALL'
                ? 'bg-white/20 text-white border border-white/30 font-bold'
                : 'bg-white/[0.05] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Todas as Zonas ({regions.length})
          </button>
          <button
            onClick={() => setFilterMode('SURGE_ONLY')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition ${
              filterMode === 'SURGE_ONLY'
                ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-white/[0.05] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Com Adicional (+R$)</span>
          </button>
          <button
            onClick={() => setFilterMode('HIGH_DEMAND')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition ${
              filterMode === 'HIGH_DEMAND'
                ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50 font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'bg-white/[0.05] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-purple-400" />
            <span>Alta Demanda (Score &gt; 70)</span>
          </button>
        </div>

        {/* Fast Register Button */}
        <button
          onClick={onOpenDemandRegistration}
          className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-2.5 py-1 rounded-lg transition backdrop-blur-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Informar Mapa Uber</span>
        </button>
      </div>

      {/* Main Interactive Map & Radar Grid */}
      <div className="relative w-full h-[360px] sm:h-[440px] bg-slate-950/70 overflow-hidden select-none">
        {/* Dark Tactical Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Concentric Radar Distance Rings centered on driver */}
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 border border-sky-500/15 rounded-full"
          style={{
            left: `${driverPos.x}%`,
            top: `${driverPos.y}%`,
            width: '180px',
            height: '180px',
          }}
        >
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-sky-400/50">
            2 km
          </span>
        </div>
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 border border-sky-500/15 rounded-full"
          style={{
            left: `${driverPos.x}%`,
            top: `${driverPos.y}%`,
            width: '360px',
            height: '360px',
          }}
        >
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-sky-400/50">
            5 km
          </span>
        </div>
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 border border-dashed border-sky-500/10 rounded-full"
          style={{
            left: `${driverPos.x}%`,
            top: `${driverPos.y}%`,
            width: '560px',
            height: '560px',
          }}
        >
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-sky-400/40">
            10 km
          </span>
        </div>

        {/* Rotating Radar Sweep Beam */}
        {showRadarSweep && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-radar-sweep origin-center"
            style={{
              left: `${driverPos.x}%`,
              top: `${driverPos.y}%`,
              width: '480px',
              height: '480px',
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(56, 189, 248, 0.25) 0deg, rgba(168, 85, 247, 0.15) 30deg, transparent 70deg)',
              }}
            />
          </div>
        )}

        {/* Vector Road Corridors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Marginal Dom Aguirre */}
          <path
            d="M 50 18 C 50 35, 48 50, 52 75 C 53 82, 54 88, 54 94"
            stroke="#38bdf8"
            strokeWidth="2.2"
            fill="none"
            opacity={0.4}
            strokeDasharray="4 2"
          />
          {/* Rodovia Raposo Tavares */}
          <path
            d="M 8 72 L 40 70 L 52 75 L 85 78 L 96 80"
            stroke="#f59e0b"
            strokeWidth="2"
            fill="none"
            opacity={0.45}
          />
          {/* Av. Comitre / Washington Luiz (Campolim to Centro) */}
          <path
            d="M 48 48 L 51 72 L 53 82"
            stroke="#a855f7"
            strokeWidth="2"
            fill="none"
            opacity={0.5}
          />
          {/* Av. 31 de Março (Votorantim connection) */}
          <path
            d="M 42 75 L 56 82 L 60 92"
            stroke="#10b981"
            strokeWidth="1.8"
            fill="none"
            opacity={0.45}
          />
        </svg>

        {/* Multi-tier Heat Contours (Thermal Blobs) */}
        {visibleRegions.map((region) => {
          const pos = projectToPercent(region.center.lat, region.center.lng);
          const score = region.currentDemandScore;
          const hasSurge = region.surgeObserved > 0;

          // Color & size based on demand score and surge
          let heatBg = 'rgba(56, 189, 248, 0.2)';
          let innerBg = 'rgba(34, 197, 94, 0.3)';
          let size = 90;

          if (score >= 80 || hasSurge) {
            heatBg = 'rgba(239, 68, 68, 0.35)'; // Red/crimson
            innerBg = 'rgba(245, 158, 11, 0.45)'; // Amber
            size = 140;
          } else if (score >= 70) {
            heatBg = 'rgba(168, 85, 247, 0.3)'; // Purple
            innerBg = 'rgba(236, 72, 153, 0.35)'; // Pink
            size = 115;
          } else if (score >= 60) {
            heatBg = 'rgba(245, 158, 11, 0.25)'; // Amber
            innerBg = 'rgba(56, 189, 248, 0.25)';
            size = 100;
          }

          return (
            <div
              key={`heat-${region.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              {/* Outer pulsing thermal wave */}
              <div
                className="w-full h-full rounded-full blur-xl animate-pulse-heat"
                style={{ backgroundColor: heatBg }}
              />
              {/* Concentric core heat */}
              <div
                className="absolute inset-0 m-auto w-1/2 h-1/2 rounded-full blur-md"
                style={{ backgroundColor: innerBg }}
              />
            </div>
          );
        })}

        {/* User-submitted demand observation thermal pins */}
        {demandObservations.map((obs) => {
          const pos = projectToPercent(obs.lat, obs.lng);
          return (
            <div
              key={obs.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="w-24 h-24 rounded-full bg-purple-500/25 blur-lg animate-ping" />
            </div>
          );
        })}

        {/* Interactive Zone Markers */}
        {visibleRegions.map((region) => {
          const pos = projectToPercent(region.center.lat, region.center.lng);
          const isSelected = selectedZone.id === region.id;
          const isCurrent = currentRegion.id === region.id;
          const hasSurge = region.surgeObserved > 0;

          return (
            <div
              key={region.id}
              onClick={() => {
                setSelectedZone(region);
                onSelectRegion(region);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition-transform active:scale-95"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {/* Dynamic Surge Halo */}
              {hasSurge && (
                <span className="absolute -inset-1 rounded-2xl bg-amber-400/40 animate-ping opacity-60" />
              )}

              {/* Marker Pill/Badge */}
              <div
                className={`relative px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl transition-all duration-200 backdrop-blur-md border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-300 ring-4 ring-amber-400/40 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                    : isCurrent
                    ? 'bg-emerald-600/90 text-white font-bold border-emerald-400 ring-2 ring-emerald-400/60 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                    : hasSurge
                    ? 'bg-purple-900/90 text-purple-100 font-bold border-purple-500/70 hover:scale-105'
                    : 'bg-slate-900/80 text-slate-200 border-white/20 hover:border-white/40 hover:scale-105'
                }`}
              >
                <span className="font-mono text-xs font-black">{region.currentDemandScore}</span>
                <span className="text-[11px] font-semibold truncate max-w-[80px] sm:max-w-[110px]">
                  {region.name}
                </span>

                {hasSurge && (
                  <span className="text-[10px] font-mono font-black bg-amber-400 text-slate-950 px-1 rounded shadow-sm">
                    +R${region.surgeObserved.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Current Driver Position Pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%` }}
        >
          <div className="relative flex items-center justify-center">
            {/* GPS Pulse Ring */}
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-60" />
            <div className="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-[0_0_12px_rgba(56,189,248,0.9)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div className="mt-1 whitespace-nowrap bg-slate-950/90 border border-sky-400/50 backdrop-blur-md rounded-md px-1.5 py-0.5 text-[9px] font-bold text-sky-300 shadow-md">
            Você está aqui
          </div>
        </div>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 border border-white/15 backdrop-blur-md rounded-2xl p-2.5 text-[10px] text-slate-300 space-y-1 shadow-lg pointer-events-none">
          <div className="font-bold text-white uppercase text-[9px] tracking-wider mb-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-purple-400" />
            Intensidade Térmica
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
            <span>Crítica / Dinâmico (+R$)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Alta Demanda (&gt; 70)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Moderada (60-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Regular / Fluido</span>
          </div>
        </div>
      </div>

      {/* Selected Zone Quick Inspection & Action Bar */}
      <div className="p-3.5 sm:p-4 bg-white/[0.04] border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md flex items-center justify-center font-mono font-black text-sm text-amber-400 shadow-inner">
            {selectedZone.currentDemandScore}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {selectedZone.name} ({selectedZone.city})
              </span>
              {selectedZone.surgeObserved > 0 ? (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  +R$ {selectedZone.surgeObserved.toFixed(2)} dinâmico
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
                  Sem adicional
                </span>
              )}
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Espera média: <strong>~{selectedZone.typicalWaitMinutes} min</strong> • Trânsito:{' '}
              <strong className="text-white capitalize">{selectedZone.currentTraffic}</strong>
              {selectedStop && (
                <span className="hidden sm:inline text-slate-400">
                  {' '}
                  • Parada segura: {selectedStop.name}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Buttons for selected zone */}
        <div className="flex items-center gap-2">
          {currentRegion.id !== selectedZone.id && (
            <button
              onClick={() => onSelectRegion(selectedZone)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition backdrop-blur-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fixar como Atual</span>
            </button>
          )}

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-cyan-900/30 border border-cyan-400/30 active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Navegar no Waze</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>

      {/* Live Just-in-Time Event Stream Ticker */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
          <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">
            Feed Just-In-Time:
          </span>
        </div>

        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3 text-[11px]">
          {liveEvents.slice(0, 3).map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1 whitespace-nowrap backdrop-blur-sm"
            >
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${ev.tagColor}`}>
                {ev.time}
              </span>
              <strong className="text-white">{ev.location}:</strong>
              <span className="text-slate-300">{ev.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
