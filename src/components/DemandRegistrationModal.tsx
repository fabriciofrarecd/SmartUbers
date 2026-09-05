import React, { useState, useRef } from 'react';
import { RegionZone, DemandObservation } from '../types';
import {
  X,
  Upload,
  Camera,
  MapPin,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface DemandRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  regions: RegionZone[];
  currentRegion: RegionZone;
  driverId: string;
  onSaveObservation: (obs: DemandObservation) => void;
}

export const DemandRegistrationModal: React.FC<DemandRegistrationModalProps> = ({
  isOpen,
  onClose,
  regions,
  currentRegion,
  driverId,
  onSaveObservation,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>(currentRegion.id);
  const [surgeValueBonus, setSurgeValueBonus] = useState<number>(4.50);
  const [estimatedWaitTimeMin, setEstimatedWaitTimeMin] = useState<number>(4);
  const [notes, setNotes] = useState<string>('Mancha de demanda observada no aplicativo de motorista');
  const [confidence, setConfidence] = useState<'alta' | 'moderada' | 'baixa'>('alta');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const targetRegion = regions.find((r) => r.id === selectedRegionId) || currentRegion;

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        const res = await fetch('/api/analyze-demand-map', {
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
          if (ext.surgeValueBonus !== undefined) setSurgeValueBonus(Number(ext.surgeValueBonus));
          if (ext.estimatedWaitTimeMin) setEstimatedWaitTimeMin(Number(ext.estimatedWaitTimeMin));
          if (ext.notes) setNotes(ext.notes);

          // Attempt to match region
          const neighborhood = (ext.neighborhood || '').toLowerCase();
          const match = regions.find(
            (r) =>
              r.name.toLowerCase().includes(neighborhood) ||
              neighborhood.includes(r.name.toLowerCase())
          );
          if (match) setSelectedRegionId(match.id);
        } else {
          setErrorMsg(data.error || 'Não foi possível analisar o print.');
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg('Erro: ' + (err.message || 'Falha ao enviar arquivo'));
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    const obs: DemandObservation = {
      id: 'obs-' + Date.now(),
      driverId,
      timestamp: new Date().toISOString(),
      city: targetRegion.city,
      neighborhood: targetRegion.name,
      lat: targetRegion.center.lat,
      lng: targetRegion.center.lng,
      surgeMultiplier: surgeValueBonus > 0 ? Number((1 + surgeValueBonus / 15).toFixed(2)) : 1.0,
      surgeValueBonus,
      estimatedWaitTimeMin,
      confidence,
      source: 'UBER_OBSERVED_BY_USER',
      notes,
    };

    onSaveObservation(obs);
    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-2xl p-4 sm:p-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">REGISTRAR MAPA UBER</h2>
              <span className="text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Colaborativo
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Alimente o mapa de calor local compartilhando a leitura de demanda observada.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Transparency Disclaimer */}
        <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/15 backdrop-blur-sm p-3 text-xs text-sky-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Transparência Legal:</strong> Este registro é uma{' '}
            <strong>observação voluntária de demanda informada pelo usuário</strong>. Não constitui
            acesso à API privada de terceiros nem garante faturamento fixo.
          </div>
        </div>

        {/* Upload Print Option with Gemini Vision */}
        <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 backdrop-blur-sm">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>ENVIAR PRINT DO MAPA DE DEMANDA</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-200 px-1.5 py-0.2 rounded font-mono border border-purple-500/30">
                  IA Gemini
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                A IA detecta região, multiplicadores e adicionais (+R$)
              </div>
            </div>
          </div>

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
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="rounded-xl border border-purple-500/40 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-semibold px-3 py-2 transition flex items-center gap-1.5 disabled:opacity-50 backdrop-blur-sm shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isAnalyzing ? 'Interpretando...' : 'Selecionar Imagem'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 p-2 rounded-xl backdrop-blur-sm">
            {errorMsg}
          </div>
        )}

        {/* Observation Form Fields */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Região / Bairro de Sorocaba ou Votorantim
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/15 text-white font-medium rounded-xl px-3 py-2 text-sm focus:border-purple-400 focus:outline-none backdrop-blur-sm"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.name} — {r.city}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Adicional Visível (+R$)
              </label>
              <input
                type="number"
                step="0.50"
                value={surgeValueBonus}
                onChange={(e) => setSurgeValueBonus(Number(e.target.value))}
                placeholder="Ex: 5.00"
                className="w-full bg-white/[0.06] border border-white/15 text-amber-400 font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-purple-400 focus:outline-none backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Tempo Estimado de Espera (min)
              </label>
              <input
                type="number"
                step="1"
                value={estimatedWaitTimeMin}
                onChange={(e) => setEstimatedWaitTimeMin(Number(e.target.value))}
                placeholder="Ex: 3"
                className="w-full bg-white/[0.06] border border-white/15 text-white font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-purple-400 focus:outline-none backdrop-blur-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Observações Operacionais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Concentração forte na saída da Ala Sul do Iguatemi Esplanada."
              className="w-full bg-white/[0.06] border border-white/15 text-slate-200 rounded-xl p-3 text-xs focus:border-purple-400 focus:outline-none backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Save confirmation */}
        {successNotice && (
          <div className="mt-3 flex items-center gap-2 text-emerald-300 text-xs bg-emerald-500/15 p-2.5 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Observação registrada com sucesso! Atualizando mapa de calor.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.15] px-4 py-2.5 text-xs font-semibold text-slate-300 transition backdrop-blur-sm"
          >
            Cancelar
          </button>

          <button
            id="save-demand-obs-btn"
            onClick={handleSave}
            className="rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2.5 transition flex items-center gap-2 shadow-lg shadow-purple-900/40 active:scale-95 border border-purple-400/30 backdrop-blur-sm"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Salvar Observação</span>
          </button>
        </div>
      </div>
    </div>
  );
};
