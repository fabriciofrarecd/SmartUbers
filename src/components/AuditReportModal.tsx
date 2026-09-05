import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Key, Smartphone, Database, ExternalLink } from 'lucide-react';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-2xl p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                AUDITORIA TÉCNICA & TERMOS DE SERVIÇO
              </h2>
              <p className="text-xs text-slate-300">
                Transparência operacional, arquitetura de dados e conformidade com Google Maps Platform.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: What is 100% Functional vs Baseline */}
        <div className="mt-4 space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1. Estado Funcional da Aplicação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <span className="font-bold text-emerald-400">Totalmente Funcional em Tempo Real:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li>Semáforo de Ganhos (R$/km, R$/h, margem líquida real)</li>
                  <li>Cálculo de custo veicular (R$ 2,30/km estrutural + etanol)</li>
                  <li>Filtro anti-corrida atrás de dinâmico</li>
                  <li>Copiloto Gemini 3.8 Flash via endpoint Express seguro</li>
                  <li>Análise de print de corrida com Gemini Vision OCR</li>
                  <li>PWA instalável e funcionamento em cache offline</li>
                  <li>Deep-links instantâneos para navegação no Waze</li>
                </ul>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-amber-400">Base Histórica & Colaborativa:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li>Zonas mapeadas de Sorocaba e Votorantim</li>
                  <li>Métricas do piloto de 4 motoristas (Carlos, Rafael, Thiago, Marcelo)</li>
                  <li>Observações de demanda Uber inseridas voluntariamente</li>
                  <li>Pontos estratégicos de parada segura (postos 24h e shopping)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Keys and APIs */}
          <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              2. APIs e Chaves de Acesso
            </h3>
            <div className="space-y-2 text-slate-300">
              <p>
                • <strong className="text-white">GEMINI_API_KEY:</strong> Configurada no backend Express em <code className="text-amber-300 bg-white/10 px-1 py-0.5 rounded">server.ts</code>. Mantida 100% protegida no lado do servidor, sem exposição ao navegador. Utilizada pelo modelo <code className="text-white">gemini-3.8-flash</code> para o Copiloto e OCR multimodal de prints.
              </p>
              <p>
                • <strong className="text-white">VITE_GOOGLE_MAPS_API_KEY:</strong> Opcional no <code className="text-sky-300 bg-white/10 px-1 py-0.5 rounded">.env.example</code> para exibição de camadas de tráfego vetorial do Google Maps. O aplicativo inclui visualizador de mapa operacional independente que não quebra mesmo sem chave.
              </p>
            </div>
          </div>

          {/* Section 3: Android Permissions & PWA */}
          <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              3. Permissões Android e PWA
            </h3>
            <div className="space-y-1 text-slate-300">
              <p>
                • <strong className="text-white">Geolocation:</strong> Registrada em <code className="text-slate-200">metadata.json</code> (<code className="text-emerald-300">requestFramePermissions: ["geolocation"]</code>). O acesso ao GPS do motorista solicita consentimento explícito do navegador/dispositivo.
              </p>
              <p>
                • <strong className="text-white">PWA Manifest:</strong> Configurado com ícone SVG de alta resolução, capacidade de tela cheia (standalone) e botão de instalação in-app para Android e instrução para iOS Safari.
              </p>
            </div>
          </div>

          {/* Section 4: ToS & Transparency */}
          <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              4. Conformidade Legal e Termos de Uso
            </h3>
            <p className="text-slate-300 leading-relaxed">
              O aplicativo segue estritamente a diferenciação obrigatória de fontes:
              <br />
              • <strong className="text-sky-400">🔵 Google:</strong> Trânsito e tempos estimados de rota.
              <br />
              • <strong className="text-purple-400">🟣 Uber:</strong> Observação de demanda informada voluntariamente pelo usuário (via print ou formulário). Não é uma API oficial ou acesso confidencial.
              <br />
              • <strong className="text-emerald-400">🟢 Histórico:</strong> Banco local de corridas e pilotagem.
              <br />
              • <strong className="text-amber-400">🟠 IA:</strong> Previsão algorítmica e copiloto operacional.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.15] px-5 py-2 text-xs font-semibold text-white transition backdrop-blur-sm"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};
