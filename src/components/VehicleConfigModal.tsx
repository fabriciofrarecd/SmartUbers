import React, { useState } from 'react';
import { VehicleConfig, Driver } from '../types';
import { X, Fuel, Sliders, Check, ShieldCheck, HelpCircle } from 'lucide-react';

interface VehicleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  currentConfig: VehicleConfig;
  onSaveConfig: (updated: VehicleConfig) => void;
}

export const VehicleConfigModal: React.FC<VehicleConfigModalProps> = ({
  isOpen,
  onClose,
  driver,
  currentConfig,
  onSaveConfig,
}) => {
  const [structuralCost, setStructuralCost] = useState<number>(currentConfig.structuralCostPerKm);
  const [fuelType, setFuelType] = useState<'ethanol' | 'gasoline' | 'cng'>(currentConfig.fuelType);
  const [consumption, setConsumption] = useState<number>(currentConfig.fuelConsumptionKmPerLiter);
  const [fuelPrice, setFuelPrice] = useState<number>(currentConfig.fuelPricePerLiter);

  if (!isOpen) return null;

  const fuelCostPerKm = consumption > 0 ? fuelPrice / consumption : 0;
  const totalCostPerKm = Number((structuralCost + fuelCostPerKm).toFixed(2));

  const handleSave = () => {
    onSaveConfig({
      ...currentConfig,
      structuralCostPerKm: structuralCost,
      fuelType,
      fuelConsumptionKmPerLiter: consumption,
      fuelPricePerLiter: fuelPrice,
      fuelCostPerKm: Number(fuelCostPerKm.toFixed(2)),
      totalCostPerKm,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-2xl p-4 sm:p-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">CUSTO REAL DO VEÍCULO</h2>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 backdrop-blur-sm">
                {driver.vehicleModel}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Motorista: <strong>{driver.name}</strong> ({driver.plate})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cost Summary Box */}
        <div className="mt-4 p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Custo Total por KM</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              R$ {totalCostPerKm.toFixed(2)} <span className="text-xs text-slate-400">/ km rodado</span>
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-300 space-y-0.5">
            <div>Estrutura: R$ {structuralCost.toFixed(2)}</div>
            <div>Combustível: R$ {fuelCostPerKm.toFixed(2)}</div>
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-300 font-semibold">
                Custo Estrutural por KM (R$)
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Padrão: R$ 2,30/km</span>
            </div>
            <input
              type="number"
              step="0.05"
              value={structuralCost}
              onChange={(e) => setStructuralCost(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/15 text-white font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Inclui depreciação do carro, manutenção preventiva, 4 pneus, troca de óleo, seguro e lavagem.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Tipo de Combustível
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full bg-white/[0.06] border border-white/15 text-white rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
              >
                <option value="ethanol" className="bg-slate-900 text-white">Etanol</option>
                <option value="gasoline" className="bg-slate-900 text-white">Gasolina</option>
                <option value="cng" className="bg-slate-900 text-white">GNV</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Preço por Litro em Sorocaba (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(Number(e.target.value))}
                className="w-full bg-white/[0.06] border border-white/15 text-white font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Consumo Médio Urbano (km / Litro)
            </label>
            <input
              type="number"
              step="0.1"
              value={consumption}
              onChange={(e) => setConsumption(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/15 text-white font-mono font-bold rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none backdrop-blur-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Consumo real verificado no trânsito de Sorocaba e Votorantim com ar condicionado ligado.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.15] px-4 py-2.5 text-xs font-semibold text-slate-300 transition backdrop-blur-sm"
          >
            Cancelar
          </button>

          <button
            id="save-vehicle-cost-btn"
            onClick={handleSave}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 transition flex items-center gap-1.5 shadow-md active:scale-95 border border-emerald-400/30 backdrop-blur-sm"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Custo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
