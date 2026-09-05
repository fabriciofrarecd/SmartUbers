import React, { useState, useRef } from 'react';
import { VehicleConfig, SystemSettings, TripOffer } from '../types';
import { evaluateTripOffer } from '../utils/operationalMath';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  PlusCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Fuel
} from 'lucide-react';

interface OfferAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleConfig: VehicleConfig;
  settings: SystemSettings;
  onAcceptAndRecordTrip: (trip: TripOffer) => void;
  driverId: string;
}

export const OfferAnalysisModal: React.FC<OfferAnalysisModalProps> = ({
  isOpen,
  onClose,
  vehicleConfig,
  settings,
  onAcceptAndRecordTrip,
  driverId,
}) => {
  const [fareValue, setFareValue] = useState<number>(24.80);
  const [pickupDistanceKm, setPickupDistanceKm] = useState<number>(1.5);
  const [tripDistanceKm, setTripDistanceKm] = useState<number>(7.2);
  const [estimatedDurationMin, setEstimatedDurationMin] = useState<number>(19);
  const [destinationArea, setDestinationArea] = useState<string>('Parque Campolim');
  const [observedSurge, setObservedSurge] = useState<number>(0);

  // Vision OCR state
  const [isAnalyzingScreenshot, setIsAnalyzingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [ocrConfirmationNeeded, setOcrConfirmationNeeded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Run calculation
  const evaluation = evaluateTripOffer(
    fareValue,
    pickupDistanceKm,
    tripDistanceKm,
    estimatedDurationMin,
    vehicleConfig,
    settings,
    destinationArea
  );

  const handleFileUpload = async (file: File) => {
    setScreenshotError(null);
    setIsAnalyzingScreenshot(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        setScreenshotPreview(base64Data);

        const res = await fetch('/api/analyze-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        const data = await res.json();
        if (data.success && data.extracted) {
          const ext = data.extracted;
          if (ext.fareValue) setFareValue(Number(ext.fareValue));
          if (ext.pickupDistanceKm) setPickupDistanceKm(Number(ext.pickupDistanceKm));
          if (ext.tripDistanceKm) setTripDistanceKm(Number(ext.tripDistanceKm));
          if (ext.estimatedDurationMin) setEstimatedDurationMin(Number(ext.estimatedDurationMin));
          if (ext.observedSurge) setObservedSurge(Number(ext.observedSurge));
          if (ext.destinationArea) setDestinationArea(ext.destinationArea);

          setOcrConfirmationNeeded(true);
        } else {
          setScreenshotError(data.error || 'Não foi possível extrair dados automaticamente.');
        }
        setIsAnalyzingScreenshot(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setScreenshotError('Erro ao carregar print: ' + (err.message || 'Erro desconhecido'));
      setIsAnalyzingScreenshot(false);
    }
  };

  const handleRecordTrip = () => {
    const trip: TripOffer = {
      id: 'trip-' + Date.now(),
      driverId,
      timestamp: new Date().toISOString(),
      observedSurge,
      pickupArea: 'Local do passageiro',
      source: screenshotPreview ? 'SCREENSHOT' : 'MANUAL',
      accepted: true,
      ...evaluation,
    };
    onAcceptAndRecordTrip(trip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-2xl p-4 sm:p-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">ANALISAR OFERTA</h2>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${
                  evaluation.semaphore === 'GREEN'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                    : evaluation.semaphore === 'YELLOW'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                }`}
              >
                {evaluation.semaphore === 'GREEN'
                  ? '🟢 OPORTUNIDADE FAVORÁVEL'
                  : evaluation.semaphore === 'YELLOW'
                  ? '🟡 OPORTUNIDADE MARGINAL'
                  : '🔴 DESFAVORÁVEL'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Avaliação financeira considerando custo estrutural (R$ {vehicleConfig.structuralCostPerKm.toFixed(2)}/km) e combustível.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Screenshot Upload Bar */}
        <div className="mt-4 p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 backdrop-blur-sm">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>IMPORTAR PRINT DO UBER DRIVER</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                  Gemini Vision
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Arraste ou selecione a captura de tela da oferta recebida
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <button
              id="upload-print-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzingScreenshot}
              className="rounded-xl border border-purple-500/40 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-semibold px-3 py-2 transition flex items-center gap-1.5 disabled:opacity-50 backdrop-blur-sm shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isAnalyzingScreenshot ? 'Analisando com IA...' : 'Carregar Imagem'}</span>
            </button>
          </div>
        </div>

        {screenshotError && (
          <div className="mt-2 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 p-2 rounded-xl backdrop-blur-sm">
            {screenshotError}
          </div>
        )}

        {ocrConfirmationNeeded && (
          <div className="mt-2 text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 p-2.5 rounded-xl flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                Dados extraídos pelo Gemini Vision. <strong>Confirme ou edite os valores abaixo</strong> antes de decidir.
              </span>
            </div>
            <button
              onClick={() => setOcrConfirmationNeeded(false)}
              className="font-bold underline text-white"
            >
              OK
            </button>
          </div>
        )}

        {/* Inputs Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Valor da Corrida (R$)
            </label>
            <input
              type="number"
              step="0.10"
              value={fareValue}
              onChange={(e) => setFareValue(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/15 text-white font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Até o Passageiro (km)
            </label>
            <input
              type="number"
              step="0.1"
              value={pickupDistanceKm}
              onChange={(e) => setPickupDistanceKm(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/15 text-amber-400 font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Trajeto Corrida (km)
            </label>
            <input
              type="number"
              step="0.1"
              value={tripDistanceKm}
              onChange={(e) => setTripDistanceKm(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/15 text-white font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Tempo Estimado (min)
            </label>
            <input
              type="number"
              step="1"
              value={estimatedDurationMin}
              onChange={(e) => setEstimatedDurationMin(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/15 text-white font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Region of Destination */}
        <div className="mt-3">
          <label className="text-xs text-slate-300 font-semibold block mb-1">
            Bairro / Destino Previsto
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={destinationArea}
              onChange={(e) => setDestinationArea(e.target.value)}
              placeholder="Ex: Campolim, Centro Votorantim, Wanel Ville, Éden..."
              className="flex-1 bg-white/[0.06] border border-white/15 text-white font-medium rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
            />
            {evaluation.destinationQuality === 'favoravel' && (
              <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold rounded-xl whitespace-nowrap backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Destino Bom
              </span>
            )}
            {evaluation.destinationQuality === 'desfavoravel' && (
              <span className="flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 text-xs font-bold rounded-xl whitespace-nowrap backdrop-blur-sm">
                <AlertTriangle className="w-3.5 h-3.5" /> Risco Volta Vazia
              </span>
            )}
          </div>
        </div>

        {/* RESULTS CALCULATION BOX (Specified output format) */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-black uppercase ${
                  evaluation.semaphore === 'GREEN'
                    ? 'text-emerald-400'
                    : evaluation.semaphore === 'YELLOW'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {evaluation.semaphore === 'GREEN'
                  ? 'BOA OPORTUNIDADE'
                  : evaluation.semaphore === 'YELLOW'
                  ? 'OPORTUNIDADE REGULAR'
                  : 'NÃO COMPENSA'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                | Score: <strong className="text-white">{evaluation.score}/100</strong>
              </span>
            </div>

            <div className="text-xs font-mono text-slate-300">
              Custo do veículo: <strong>R$ {vehicleConfig.totalCostPerKm.toFixed(2)}/km</strong>
            </div>
          </div>

          {/* Core Economic Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-center">
            <div className="bg-white/[0.05] p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">R$ / km Total</div>
              <div className="text-lg font-black text-white font-mono mt-0.5">
                R$ {evaluation.grossPerKm.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">{evaluation.totalDistanceKm} km totais</div>
            </div>

            <div className="bg-white/[0.05] p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">R$ / hora Proj.</div>
              <div className="text-lg font-black text-sky-400 font-mono mt-0.5">
                R$ {evaluation.grossPerHour.toFixed(2)}/h
              </div>
              <div className="text-[10px] text-slate-400">em {estimatedDurationMin} min</div>
            </div>

            <div className="bg-white/[0.05] p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Custo Total</div>
              <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
                R$ {evaluation.estimatedCost.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">estrutura + etanol</div>
            </div>

            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">Margem Líquida Real</div>
              <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                R$ {evaluation.estimatedNetMargin.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">
                {fareValue > 0 ? `${Math.round((evaluation.estimatedNetMargin / fareValue) * 100)}% de lucro` : ''}
              </div>
            </div>
          </div>

          {/* Operational Verdict Explanation */}
          <div className="mt-2 text-xs text-slate-300 bg-white/[0.03] p-3 rounded-xl border border-white/10 leading-relaxed backdrop-blur-sm">
            <strong className="text-white">Parecer Operacional: </strong>
            {evaluation.recommendationReason}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.15] transition backdrop-blur-sm"
          >
            Fechar
          </button>

          <button
            id="accept-record-trip-btn"
            onClick={handleRecordTrip}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 transition flex items-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95 border border-emerald-400/30 backdrop-blur-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Aceitar e Registrar no Turno</span>
          </button>
        </div>
      </div>
    </div>
  );
};
