import React from 'react';
import {
  RegionZone,
  Shift,
  VehicleConfig,
  PositioningRecommendation,
  StrategicStop,
  DemandObservation
} from '../types';
import { JustInTimeHeatmap } from './JustInTimeHeatmap';
import {
  Play,
  Square,
  Navigation,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Fuel,
  Info
} from 'lucide-react';

interface DriverHomeViewProps {
  currentRegion: RegionZone;
  onSelectRegion: (region: RegionZone) => void;
  regions: RegionZone[];
  topRecommendation: PositioningRecommendation | null;
  shift: Shift;
  onToggleShift: () => void;
  vehicleConfig: VehicleConfig;
  onOpenOfferAnalysis: () => void;
  onOpenPositioning: () => void;
  onOpenDemandRegistration: () => void;
  onOpenMap: () => void;
  onOpenCopilot: () => void;
  onOpenVehicleConfig: () => void;
  userCoords: { lat: number; lng: number } | null;
  onRefreshLocation: () => void;
  locationPermissionGranted: boolean;
  onRequestLocationPermission: () => void;
  strategicStops: StrategicStop[];
  demandObservations: DemandObservation[];
}

export const DriverHomeView: React.FC<DriverHomeViewProps> = ({
  currentRegion,
  onSelectRegion,
  regions,
  topRecommendation,
  shift,
  onToggleShift,
  vehicleConfig,
  onOpenOfferAnalysis,
  onOpenPositioning,
  onOpenDemandRegistration,
  onOpenMap,
  onOpenCopilot,
  onOpenVehicleConfig,
  userCoords,
  onRefreshLocation,
  locationPermissionGranted,
  onRequestLocationPermission,
  strategicStops,
  demandObservations,
}) => {
  const emptyKmPercent =
    shift.kmTotal > 0 ? Math.round((shift.kmEmpty / shift.kmTotal) * 100) : 0;

  // Strategic Stop coordinates for Waze
  const targetStop: StrategicStop | undefined = currentRegion.strategicStops[0];
  const targetLat = targetStop?.lat || currentRegion.center.lat;
  const targetLng = targetStop?.lng || currentRegion.center.lng;
  const wazeUrl = `https://waze.com/ul?ll=${targetLat},${targetLng}&navigate=yes`;

  const getTrafficBadge = (traffic: string) => {
    switch (traffic) {
      case 'low':
        return <span className="text-emerald-400 font-medium">Trânsito Fluido</span>;
      case 'moderate':
        return <span className="text-amber-400 font-medium">Trânsito Moderado</span>;
      case 'heavy':
        return <span className="text-orange-400 font-medium">Trânsito Lento</span>;
      case 'intense':
        return <span className="text-rose-500 font-bold">Congestionamento</span>;
      default:
        return <span className="text-slate-400">{traffic}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-4">
      {/* Location Permission / Accuracy Banner */}
      {!locationPermissionGranted && (
        <div className="rounded-2xl border border-blue-800/40 bg-blue-950/40 p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-blue-200">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" />
            <span>
              Ative a localização precisa do dispositivo para sugestões geográficas exatas em Sorocaba e Votorantim.
            </span>
          </div>
          <button
            id="grant-location-btn"
            onClick={onRequestLocationPermission}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition whitespace-nowrap"
          >
            Permitir GPS
          </button>
        </div>
      )}

      {/* CORE OPERATIONAL STATUS CARD (As specified in prompt page 7) */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl p-4 sm:p-6 shadow-2xl transition-all">
        {/* Subtle glow border top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 opacity-80" />

        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider bg-white/10 backdrop-blur-md px-2 py-0.5 rounded border border-white/15">
              AGORA
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Local Atual:
            </span>
            <select
              value={currentRegion.id}
              onChange={(e) => {
                const r = regions.find((item) => item.id === e.target.value);
                if (r) onSelectRegion(r);
              }}
              className="bg-white/[0.08] backdrop-blur-md border border-white/15 text-emerald-400 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                  {r.name} ({r.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            {getTrafficBadge(currentRegion.currentTraffic)}
            <span>•</span>
            <span>Espera média: ~{currentRegion.typicalWaitMinutes} min</span>
          </div>
        </div>

        {/* Big Decision Callout */}
        <div className="my-4 sm:my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              {/* Traffic light icon */}
              <span className="flex h-4 w-4 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                PERMANECER
              </h2>

              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                Score 84/100
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed max-w-xl">
              "Histórico favorável e baixo custo de deslocamento. O Parque Bela Vista / Shopping Iguatemi mantém tempo ocioso inferior a 4 min."
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 bg-white/[0.08] backdrop-blur-sm px-2 py-0.5 rounded-md text-slate-300 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Confiança: <strong className="text-white">Alta (76%)</strong>
              </span>
              <span>•</span>
              <span>Base: 27 observações históricas • trânsito Google Routes</span>
            </div>
          </div>

          {/* Quick action: Open in Waze */}
          <div className="flex sm:flex-col gap-2">
            <a
              id="open-waze-btn"
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-sm px-4 py-3 shadow-lg shadow-cyan-900/30 active:scale-95 transition-all backdrop-blur-md border border-cyan-400/30"
              title="Abrir rota para ponto estratégico no Waze"
            >
              <Navigation className="w-4 h-4" />
              <span>ABRIR NO WAZE</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              onClick={onOpenPositioning}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 text-xs font-medium px-3 py-2 transition backdrop-blur-md"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Comparar 3 Zonas</span>
            </button>
          </div>
        </div>

        {/* Strategic Stop recommendation in current zone */}
        {targetStop && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-3 flex items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded whitespace-nowrap">
                Ponto de Espera
              </span>
              <span className="font-semibold text-white truncate">{targetStop.name}</span>
              <span className="hidden md:inline text-slate-400 truncate">• {targetStop.notes}</span>
            </div>
            <a
              href={`https://waze.com/ul?ll=${targetStop.lat},${targetStop.lng}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              Navegar <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* SHIFT TELEMETRY BAR (KM TOTAL, PRODUTIVO, VAZIO, FATURAMENTO, CUSTO, MARGEM) */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-3 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <button
              id="toggle-shift-btn"
              onClick={onToggleShift}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                shift.isActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {shift.isActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>ENCERRAR TURNO</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>INICIAR TURNO</span>
                </>
              )}
            </button>

            <span className="text-xs text-slate-400">
              {shift.isActive ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Clock className="w-3.5 h-3.5" /> Em andamento ({shift.minutesMoving + shift.minutesParked} min)
                </span>
              ) : (
                'Turno fechado. Inicie para registrar telemetria.'
              )}
            </span>
          </div>

          {/* Vehicle cost indicator */}
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              Custo do veículo:
            </span>
            <button
              onClick={onOpenVehicleConfig}
              className="font-bold text-white hover:text-emerald-400 underline decoration-dotted transition"
            >
              R$ {vehicleConfig.totalCostPerKm.toFixed(2)}/km
            </button>
          </div>
        </div>

        {/* 6 Key Operational Metrics with Frosted Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pt-3">
          <div className="bg-white/[0.05] backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">KM Total</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{shift.kmTotal.toFixed(1)} km</div>
            <div className="text-[10px] text-slate-400">{shift.tripsCount} corridas</div>
          </div>

          <div className="bg-white/[0.05] backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">KM Produtivo</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{shift.kmProductive.toFixed(1)} km</div>
            <div className="text-[10px] text-emerald-400/80">com passageiro</div>
          </div>

          <div className="bg-white/[0.05] backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">KM Vazio</span>
              {emptyKmPercent > 25 && (
                <AlertTriangle className="w-3 h-3 text-rose-400" title="KM vazio alto!" />
              )}
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">{shift.kmEmpty.toFixed(1)} km</div>
            <div className={`text-[10px] font-bold ${emptyKmPercent > 25 ? 'text-rose-400' : 'text-slate-400'}`}>
              {emptyKmPercent}% vazio
            </div>
          </div>

          <div className="bg-white/[0.05] backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Ganhos</div>
            <div className="text-xl font-bold text-sky-400 font-mono mt-0.5">
              R$ {shift.grossRevenue.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">bruto recebido</div>
          </div>

          <div className="bg-white/[0.05] backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Custo Real</div>
            <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
              -R$ {shift.calculatedCost.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">estrutura + etanol</div>
          </div>

          <div className="bg-emerald-500/10 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/30">
            <div className="text-[10px] text-emerald-400 uppercase font-semibold tracking-wider">Margem Real</div>
            <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">
              R$ {shift.netMargin.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold">
              {shift.grossRevenue > 0
                ? `${Math.round((shift.netMargin / shift.grossRevenue) * 100)}% líquido`
                : 'lucro real'}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE JUST-IN-TIME HEATMAP SECTION (Monitoramento em Tempo Real) */}
      <JustInTimeHeatmap
        regions={regions}
        currentRegion={currentRegion}
        onSelectRegion={onSelectRegion}
        strategicStops={strategicStops}
        demandObservations={demandObservations}
        userCoords={userCoords}
        onOpenFullMap={onOpenMap}
        onOpenDemandRegistration={onOpenDemandRegistration}
      />

      {/* BIG OPERATIONAL TOUCH BUTTONS (Frosted Glass panels with vibrant accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* 1. Analisar Oferta (Manual or Screenshot) */}
        <button
          id="btn-analisar-oferta"
          onClick={onOpenOfferAnalysis}
          className="group relative flex items-center justify-between p-4 sm:p-5 rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl hover:bg-white/[0.12] hover:border-emerald-500/50 active:scale-[0.98] transition-all shadow-xl text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white">ANALISAR OFERTA</span>
                <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 backdrop-blur-sm">
                  Semáforo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Calcula R$/km, R$/h, margem real líquida ou importa print do Uber Driver.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        {/* 2. Onde Devo Ficar? (Positioning & Anti-surge chase) */}
        <button
          id="btn-onde-devo-ficar"
          onClick={onOpenPositioning}
          className="group relative flex items-center justify-between p-4 sm:p-5 rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl hover:bg-white/[0.12] hover:border-amber-500/50 active:scale-[0.98] transition-all shadow-xl text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-md flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white">ONDE DEVO FICAR?</span>
                <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 backdrop-blur-sm">
                  Estratégia
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Top 3 zonas em raios de 1 a 10 km • Regra "Não perseguir dinâmico".
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        {/* 3. Registrar Mapa Uber */}
        <button
          id="btn-registrar-uber"
          onClick={onOpenDemandRegistration}
          className="group relative flex items-center justify-between p-4 sm:p-5 rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl hover:bg-white/[0.12] hover:border-purple-500/50 active:scale-[0.98] transition-all shadow-xl text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 backdrop-blur-md flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white">REGISTRAR UBER</span>
                <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40 backdrop-blur-sm">
                  Colaborativo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Envie observação ou print do mapa de demanda para alimentar o histórico.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        {/* 4. Mapa Operacional & Calor */}
        <button
          id="btn-mapa-operacional"
          onClick={onOpenMap}
          className="group relative flex items-center justify-between p-4 sm:p-5 rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl hover:bg-white/[0.12] hover:border-sky-500/50 active:scale-[0.98] transition-all shadow-xl text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 backdrop-blur-md flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white">MAPA OPERACIONAL</span>
                <span className="text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/40 backdrop-blur-sm">
                  Google Maps
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Mapa de calor, trânsito em tempo real e pontos de parada estratégica.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* COPILOTO OPERACIONAL GEMINI BANNER (Frosted Glass with Amber Glow) */}
      <div className="rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/25 border border-amber-500/40 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base">Copiloto Gemini de Operação</span>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Tire dúvidas operacionais: "Vale sair de Votorantim pro Campolim?", "Esse +R$ 10 compensa 4 km vazio?"
            </p>
          </div>
        </div>

        <button
          id="btn-consultar-copiloto"
          onClick={onOpenCopilot}
          className="rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 hover:text-white font-semibold text-xs px-4 py-2.5 transition border border-white/15 backdrop-blur-md flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Perguntar ao Copiloto</span>
        </button>
      </div>

      {/* DATA SOURCES TRANSPARENCY PILL (Mandatory differentiation of sources) */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-300 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Diferenciação de Fontes:
        </span>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
            <strong className="text-sky-300">Google:</strong> Trânsito e rotas
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
            <strong className="text-purple-300">Uber:</strong> Dado informado por motoristas
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
            <strong className="text-emerald-300">Histórico:</strong> Banco operacional
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            <strong className="text-amber-300">IA:</strong> Previsão estratégica
          </span>
        </div>
      </div>
    </div>
  );
};
