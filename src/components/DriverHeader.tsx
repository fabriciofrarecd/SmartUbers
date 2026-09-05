import React from 'react';
import { Driver, VehicleConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { Car, Shield, Sliders, Users } from 'lucide-react';

interface DriverHeaderProps {
  currentMode: 'DRIVER' | 'ADMIN';
  onModeChange: (mode: 'DRIVER' | 'ADMIN') => void;
  selectedDriver: Driver;
  onSelectDriver: (driver: Driver) => void;
  drivers: Driver[];
  vehicleConfig: VehicleConfig;
  onOpenVehicleConfig: () => void;
  onOpenAudit: () => void;
  shiftActive: boolean;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  currentMode,
  onModeChange,
  selectedDriver,
  onSelectDriver,
  drivers,
  vehicleConfig,
  onOpenVehicleConfig,
  onOpenAudit,
  shiftActive,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand and Driver indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-sm flex items-center justify-center">
              <Car className="w-5 h-5 text-sky-400" />
            </div>
            {shiftActive && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-white truncate tracking-tight">
                DriverFlow <span className="text-sky-400">Pro</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/[0.07] backdrop-blur-sm text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
                Sorocaba • Votorantim
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${shiftActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`} />
                {shiftActive ? 'Turno Ativo' : 'Turno Encerrado'}
              </span>
              <span>•</span>
              <button
                onClick={onOpenVehicleConfig}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition"
                title="Configurar Custo do Veículo"
              >
                R$ {vehicleConfig.totalCostPerKm.toFixed(2)}/km
                <Sliders className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Driver selector dropdown */}
          <div className="relative">
            <select
              id="driver-select"
              value={selectedDriver.id}
              onChange={(e) => {
                const found = drivers.find((d) => d.id === e.target.value);
                if (found) onSelectDriver(found);
              }}
              className="bg-white/[0.06] backdrop-blur-md border border-white/10 text-slate-200 text-xs font-medium rounded-xl px-2.5 py-1.5 pr-6 cursor-pointer hover:bg-white/[0.1] hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
              title="Alternar motorista do piloto"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                  {d.nickname}
                </option>
              ))}
            </select>
          </div>

          {/* Mode switch (Driver vs Admin) */}
          <div className="flex items-center bg-black/30 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <button
              id="mode-driver-btn"
              onClick={() => onModeChange('DRIVER')}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentMode === 'DRIVER'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Motorista</span>
            </button>
            <button
              id="mode-admin-btn"
              onClick={() => onModeChange('ADMIN')}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentMode === 'ADMIN'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Gestão / Admin</span>
            </button>
          </div>

          {/* Audit / Docs Button */}
          <button
            id="open-audit-btn"
            onClick={onOpenAudit}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-md px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.12] hover:text-white transition"
            title="Auditoria Técnica e Termos Google"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Auditoria</span>
          </button>

          {/* In-app PWA install button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
