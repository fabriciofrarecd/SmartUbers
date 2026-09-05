import React, { useState } from 'react';
import { Driver, VehicleConfig, SystemSettings, RegionZone } from '../types';
import {
  Users,
  Car,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Fuel,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface AdminDashboardViewProps {
  drivers: Driver[];
  vehicleConfigs: Record<string, VehicleConfig>;
  settings: SystemSettings;
  onUpdateSettings: (s: SystemSettings) => void;
  regions: RegionZone[];
  onOpenVehicleConfig: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  drivers,
  vehicleConfigs,
  settings,
  onUpdateSettings,
  regions,
  onOpenVehicleConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'PILOT_30D' | 'REGIONS' | 'SETTINGS'>('METRICS');

  // Realistic mock consolidated stats for the 4 pilots
  const pilotDriversStats = [
    {
      driver: drivers[0], // Carlos Machado
      hoursOnline: 36.5,
      kmTotal: 780,
      kmEmpty: 135,
      emptyPercent: 17,
      grossRevenue: 2340.00,
      realCost: 780 * (vehicleConfigs['drv-1']?.totalCostPerKm || 2.72),
      tripsCount: 68,
      predominantZone: 'Campolim / Iguatemi',
      efficiencyBadge: 'Mais Eficiente em Margem',
    },
    {
      driver: drivers[1], // Rafael Santos
      hoursOnline: 34.0,
      kmTotal: 690,
      kmEmpty: 110,
      emptyPercent: 16,
      grossRevenue: 2010.00,
      realCost: 690 * (vehicleConfigs['drv-2']?.totalCostPerKm || 2.65),
      tripsCount: 62,
      predominantZone: 'Votorantim / Bela Vista',
      efficiencyBadge: 'Menor KM Vazio (16%)',
    },
    {
      driver: drivers[2], // Thiago Lima
      hoursOnline: 38.0,
      kmTotal: 840,
      kmEmpty: 195,
      emptyPercent: 23,
      grossRevenue: 2280.00,
      realCost: 840 * (vehicleConfigs['drv-3']?.totalCostPerKm || 2.73),
      tripsCount: 71,
      predominantZone: 'Wanel Ville / Centro',
      efficiencyBadge: 'Alta Densidade de Viagens',
    },
    {
      driver: drivers[3], // Marcelo Pereira
      hoursOnline: 40.0,
      kmTotal: 960,
      kmEmpty: 265,
      emptyPercent: 28,
      grossRevenue: 2650.00,
      realCost: 960 * (vehicleConfigs['drv-4']?.totalCostPerKm || 2.92),
      tripsCount: 59,
      predominantZone: 'Zona Industrial / Éden',
      efficiencyBadge: 'Alto Faturamento / Ajustar KM Vazio',
    },
  ];

  // Consolidated aggregates
  const totalGrossRevenue = pilotDriversStats.reduce((acc, d) => acc + d.grossRevenue, 0);
  const totalRealCost = pilotDriversStats.reduce((acc, d) => acc + d.realCost, 0);
  const totalNetMargin = totalGrossRevenue - totalRealCost;
  const totalKm = pilotDriversStats.reduce((acc, d) => acc + d.kmTotal, 0);
  const totalEmptyKm = pilotDriversStats.reduce((acc, d) => acc + d.kmEmpty, 0);
  const totalHours = pilotDriversStats.reduce((acc, d) => acc + d.hoursOnline, 0);
  const avgHourlyRate = totalGrossRevenue / totalHours;
  const avgGrossPerKm = totalGrossRevenue / totalKm;
  const avgEmptyPercent = Math.round((totalEmptyKm / totalKm) * 100);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Top Banner with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              PAINEL ESTRATÉGICO & GESTÃO DO PILOTO
            </h1>
            <span className="bg-sky-500/20 text-sky-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-sky-500/40 backdrop-blur-sm">
              4 Motoristas Piloto
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Sorocaba & Votorantim • Acompanhamento de rentabilidade real, custo operacional e km vazio.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-black/30 backdrop-blur-md p-1 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'METRICS'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Métricas Piloto
          </button>
          <button
            onClick={() => setActiveTab('PILOT_30D')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'PILOT_30D'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ciclo 30 Dias
          </button>
          <button
            onClick={() => setActiveTab('REGIONS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'REGIONS'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ranking Zonas
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'SETTINGS'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Parâmetros
          </button>
        </div>
      </div>

      {activeTab === 'METRICS' && (
        <div className="space-y-6">
          {/* Consolidated 7 Macro Cards with Frosted Glass styling */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white/[0.06] backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Motoristas Ativos</div>
              <div className="text-xl font-black text-white font-mono mt-1">4 / 4</div>
              <div className="text-[10px] text-emerald-400 font-semibold">100% no piloto</div>
            </div>

            <div className="bg-white/[0.06] backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Carros Monitorados</div>
              <div className="text-xl font-black text-white font-mono mt-1">4 carros</div>
              <div className="text-[10px] text-slate-400 font-semibold">Onix, HB20, Argo, Logan</div>
            </div>

            <div className="bg-white/[0.06] backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ganho Médio / Hora</div>
              <div className="text-xl font-black text-sky-400 font-mono mt-1">
                R$ {avgHourlyRate.toFixed(2)}/h
              </div>
              <div className="text-[10px] text-slate-400">Meta: R$ 45,00/h</div>
            </div>

            <div className="bg-white/[0.06] backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ganho Médio / KM</div>
              <div className="text-xl font-black text-white font-mono mt-1">
                R$ {avgGrossPerKm.toFixed(2)}/km
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">+18% vs média local</div>
            </div>

            <div className="bg-white/[0.06] backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">% KM Vazio</div>
              <div className="text-xl font-black text-amber-400 font-mono mt-1">
                {avgEmptyPercent}%
              </div>
              <div className="text-[10px] text-slate-400">Limite seguro: 25%</div>
            </div>

            <div className="bg-white/[0.06] backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Custo Operacional</div>
              <div className="text-xl font-black text-rose-400 font-mono mt-1">
                -R$ {totalRealCost.toFixed(0)}
              </div>
              <div className="text-[10px] text-slate-400">Desgaste + Etanol</div>
            </div>

            <div className="bg-emerald-500/10 backdrop-blur-xl p-3.5 rounded-2xl border border-emerald-500/30 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Margem Líquida Real</div>
              <div className="text-xl font-black text-emerald-300 font-mono mt-1">
                R$ {totalNetMargin.toFixed(0)}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">
                {Math.round((totalNetMargin / totalGrossRevenue) * 100)}% rentabilidade
              </div>
            </div>
          </div>

          {/* Strategic Real-Time Fleet Alerts */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-4 sm:p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Alertas Estratégicos Ativos (Sorocaba & Votorantim)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-3 text-xs text-amber-200">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Saturação no Campolim
                </div>
                Lentidão pesada na Av. Antônio Carlos Comitre (-22% de velocidade média). Recomendado priorizar chamados no Parque Bela Vista ou divisa Iguatemi.
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md p-3 text-xs text-emerald-200">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Divisa Iguatemi Aquecendo
                </div>
                Aumento de 35% no fluxo de saídas do Shopping Iguatemi Esplanada com adicionais de R$ 4,50 sem gerar trânsito travado.
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-md p-3 text-xs text-rose-200">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Atenção ao KM Vazio (Éden)
                </div>
                Corridas para a Zona Industrial do Éden estão registrando 34% de retorno vazio após as 20h. Reforçar orientação de não descer sem corrida de volta.
              </div>
            </div>
          </div>

          {/* Pilot Drivers Performance Table */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-4 sm:p-5 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Desempenho dos 4 Motoristas (Piloto de Sorocaba/Votorantim)
              </h3>
              <span className="text-xs text-slate-400">
                Linguagem construtiva focada em ganho líquido
              </span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.06] backdrop-blur-md text-slate-400 uppercase font-semibold text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-3">Motorista</th>
                    <th className="p-3">Veículo / Placa</th>
                    <th className="p-3">Zona Principal</th>
                    <th className="p-3">Horas / Corridas</th>
                    <th className="p-3">% KM Vazio</th>
                    <th className="p-3">Faturamento</th>
                    <th className="p-3">Custo Real</th>
                    <th className="p-3">Margem Líquida</th>
                    <th className="p-3">Destaque Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pilotDriversStats.map((item) => {
                    const margin = item.grossRevenue - item.realCost;
                    const marginPercent = Math.round((margin / item.grossRevenue) * 100);

                    return (
                      <tr key={item.driver.id} className="hover:bg-white/[0.08] transition">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <img
                            src={item.driver.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-white/20"
                          />
                          <span>{item.driver.name}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {item.driver.vehicleModel}
                        </td>
                        <td className="p-3 font-medium text-slate-200">
                          {item.predominantZone}
                        </td>
                        <td className="p-3 font-mono">
                          {item.hoursOnline}h ({item.tripsCount} corridas)
                        </td>
                        <td className="p-3 font-mono">
                          <span
                            className={`font-bold ${
                              item.emptyPercent > 25 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {item.emptyPercent}%
                          </span>
                        </td>
                        <td className="p-3 font-mono text-sky-400 font-semibold">
                          R$ {item.grossRevenue.toFixed(2)}
                        </td>
                        <td className="p-3 font-mono text-rose-400">
                          -R$ {item.realCost.toFixed(2)}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-black">
                          R$ {margin.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            ({marginPercent}%)
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="bg-white/[0.08] text-slate-200 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 whitespace-nowrap">
                            {item.efficiencyBadge}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 30-Day Pilot Methodology (Week 1 Baseline -> Weeks 2-3 Guidance -> Week 4 Consolidation) */}
      {activeTab === 'PILOT_30D' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-5 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" />
              Metodologia de Validação do Piloto de 30 Dias
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Estruturado para comparar o ganho por hora e o percentual de km vazio antes e depois da adoção do Semáforo Operacional e das Recomendações Estratégicas nas cidades de Sorocaba e Votorantim.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {/* Semana 1 */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-4 relative">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Dias 01 a 07
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Semana 1: Linha de Base</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Os 4 motoristas operam com suas rotinas habituais, sem auxílio do semáforo. Coleta de dados brutos: faturamento, km vazio natural (~28%) e margem real inicial.
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 text-xs font-mono text-slate-300">
                  Margem média: <strong className="text-amber-400">24.2%</strong>
                </div>
              </div>

              {/* Semana 2 */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-4 relative">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Dias 08 a 14
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Semana 2: Adoção do Semáforo</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Início do filtro de ofertas com semáforo (recusa de corridas deficitárias ou com km vazio excessivo). Foco em aceitar apenas Verde e Amarelo com margem positiva.
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 text-xs font-mono text-slate-300">
                  Margem média: <strong className="text-emerald-400">31.8%</strong>
                </div>
              </div>

              {/* Semana 3 */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-4 relative">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Dias 15 a 21
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Semana 3: Posicionamento Estratégico</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Adoção rigorosa da regra "Não perseguir o dinâmico". Posicionamento prévio nos bolsões seguros (Posto Shell Campolim, Praça Lecy Votorantim, Tauste).
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 text-xs font-mono text-slate-300">
                  Margem média: <strong className="text-emerald-400">36.5%</strong>
                </div>
              </div>

              {/* Semana 4 */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-md p-4 relative">
                <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  Dias 22 a 30
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Semana 4: Consolidação</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Avaliação consolidada dos ganhos reais. Redução do km vazio de 28% para 17% e aumento médio de R$ 9,80 por hora trabalhada.
                </p>
                <div className="mt-4 pt-3 border-t border-emerald-500/20 text-xs font-mono text-emerald-300 font-bold">
                  Margem final: 38.4% (+14.2% real)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regions Ranking Tab */}
      {activeTab === 'REGIONS' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Ranking de Rentabilidade Operacional por Região (Sorocaba & Votorantim)
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Baseado em densidade histórica de corridas, tempo de espera e taxa de retorno remunerado.
            </p>

            <div className="space-y-2.5">
              {regions.map((region, idx) => (
                <div
                  key={region.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-white/10 text-white font-black text-xs flex items-center justify-center font-mono border border-white/10">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {region.name}{' '}
                        <span className="text-xs text-slate-400 font-normal">({region.city})</span>
                      </div>
                      <div className="text-xs text-slate-400 max-w-lg">{region.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-slate-400">
                      Espera típica: <strong className="text-white">~{region.typicalWaitMinutes} min</strong>
                    </div>
                    <div className="text-slate-400">
                      Score histórico: <strong className="text-emerald-400">{region.historicalScore}/100</strong>
                    </div>
                    <div className="text-slate-400">
                      Trânsito: <strong className="text-amber-400 capitalize">{region.currentTraffic}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'SETTINGS' && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-5 max-w-2xl shadow-xl">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            Configuração dos Parâmetros do Semáforo
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            Ajuste os limiares de rentabilidade mínima e alertas de deslocamento vazio.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Limiar do Semáforo Verde (Score Mínimo: {settings.scoreGreenThreshold}/100)
              </label>
              <input
                type="range"
                min="65"
                max="85"
                value={settings.scoreGreenThreshold}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    scoreGreenThreshold: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Limiar do Semáforo Amarelo (Score Mínimo: {settings.scoreYellowThreshold}/100)
              </label>
              <input
                type="range"
                min="45"
                max="65"
                value={settings.scoreYellowThreshold}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    scoreYellowThreshold: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Distância Máxima para Perseguir Dinâmico ({settings.maxDynamicChaseDistanceKm} km)
              </label>
              <input
                type="range"
                min="1.5"
                max="4.0"
                step="0.1"
                value={settings.maxDynamicChaseDistanceKm}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    maxDynamicChaseDistanceKm: Number(e.target.value),
                  })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Acima deste raio, o sistema alerta o motorista a não se deslocar vazio para evitar perda de combustível.
              </span>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">Configuração de Custos dos Veículos:</span>
              <button
                onClick={onOpenVehicleConfig}
                className="rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 text-xs font-semibold px-4 py-2 transition border border-white/15"
              >
                Editar Custos do Carro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
