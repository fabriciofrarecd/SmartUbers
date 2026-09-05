import React, { useState } from 'react';
import { CopilotMessage, RegionZone, VehicleConfig, Shift } from '../types';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  Fuel,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: RegionZone;
  vehicleConfig: VehicleConfig;
  shift: Shift;
}

const PRESET_PROMPTS = [
  'Onde devo trabalhar agora em Sorocaba/Votorantim?',
  'Vale a pena sair de Votorantim para ir ao Campolim?',
  'Estou rodando vazio demais (mais de 25%)?',
  'Esse adicional de +R$ 10 compensa andar 4 km vazio?',
  'Qual ponto de parada é mais seguro agora?',
];

export const CopilotModal: React.FC<CopilotModalProps> = ({
  isOpen,
  onClose,
  currentRegion,
  vehicleConfig,
  shift,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `Olá! Sou o seu Copiloto de Operação para Sorocaba e Votorantim. Meu foco absoluto é proteger sua margem líquida (custo de R$ ${vehicleConfig.totalCostPerKm.toFixed(2)}/km) e evitar que você gaste combustível à toa correndo atrás de dinâmicos falsos. Como posso ajudar agora?`,
      contextData: {
        region: currentRegion.name,
        semaphore: 'GREEN',
        sources: ['Histórico Operacional', 'Regras de Custos Veiculares'],
      },
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const emptyKmPercent =
        shift.kmTotal > 0 ? Math.round((shift.kmEmpty / shift.kmTotal) * 100) : 0;

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          driverContext: {
            currentArea: `${currentRegion.name} (${currentRegion.city})`,
            currentTraffic: currentRegion.currentTraffic,
            totalCostPerKm: vehicleConfig.totalCostPerKm.toFixed(2),
            shiftActive: shift.isActive,
            kmTotal: shift.kmTotal,
            kmEmptyPercent: emptyKmPercent,
            netMargin: shift.netMargin,
          },
        }),
      });

      const data = await res.json();

      const assistantMsg: CopilotMessage = {
        id: 'ast-' + Date.now(),
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: data.reply || 'Sem resposta do copiloto no momento.',
        contextData: {
          region: currentRegion.name,
          sources: data.sources || ['Google Trânsito', 'Histórico Sorocaba/Votorantim', 'Gemini IA'],
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: 'Desculpe, houve uma instabilidade de conexão com o Copiloto. Tente novamente em alguns instantes.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col h-[85vh] max-h-[720px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  COPILOTO DE OPERAÇÃO
                </h2>
                <span className="text-[10px] bg-amber-950 text-amber-400 font-bold border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Contexto: {currentRegion.name} • Custo: R$ {vehicleConfig.totalCostPerKm.toFixed(2)}/km
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Prompt Pills */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[11px] text-slate-500 uppercase font-semibold whitespace-nowrap">
            Sugestões:
          </span>
          {PRESET_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 whitespace-nowrap transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {m.contextData?.sources && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-300">Fontes consultadas:</span>
                      {m.contextData.sources.map((s, idx) => (
                        <span key={idx} className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Calculando rentabilidade e trânsito em Sorocaba/Votorantim...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(input);
            }}
            placeholder="Pergunte ao copiloto (ex: vale a pena ir para o Campolim?)"
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
          />

          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
