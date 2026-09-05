import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  // Support JSON payload up to 25MB for screenshot analysis
  app.use(express.json({ limit: '25mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasMapsKey: Boolean(process.env.VITE_GOOGLE_MAPS_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Copilot API (operational chat with Gemini 3.8 Flash)
  app.post('/api/copilot', async (req, res) => {
    try {
      const { message, driverContext } = req.body;
      const ai = getGenAI();

      if (!ai) {
        // Fallback intelligent answer if GEMINI_API_KEY is not set yet
        return res.json({
          reply:
            'Copiloto Operacional Sorocaba-Votorantim (Modo Padrão Offline):\n\n' +
            'Com base na análise de tráfego local e custo estrutural (R$ 2,30/km):\n' +
            '• Parque Campolim e Parque Bela Vista apresentam o menor tempo ocioso neste momento.\n' +
            '• Recomendação: Evite deslocamentos vazios superiores a 2,5 km para perseguir dinâmicos voláteis.\n' +
            '• Se estiver na divisa de Votorantim (Shopping Iguatemi), permaneça posicionado no bolsão seguro.\n\n' +
            '*(Configure a GEMINI_API_KEY no menu de Secrets para respostas dinâmicas em tempo real com IA)*',
          sources: ['Histórico Operacional', 'Regras de Custos Sorocaba/Votorantim'],
        });
      }

      const systemInstruction = `Você é o "COPILOTO DE OPERAÇÃO" para motoristas de aplicativo nas cidades vizinhas de Sorocaba e Votorantim (SP).
Seu objetivo absoluto é ajudar o motorista a maximizar a RENTABILIDADE REAL LíQUIDA e REDUZIR QUILÔMETROS VAZIOS, e NUNCA perseguir dinâmicos cegamente.

Regras inegociáveis:
1. Nunca prometa precisão inexistente. Não diga "você vai tocar em 2 minutos". Diga "Historicamente esta região tem menor tempo de espera".
2. Nunca afirme ser dado oficial ou API da Uber. É um sistema independente de apoio à decisão com dados fornecidos voluntariamente e trânsito Google.
3. Regra de ouro: NÃO PERSEGUIR O DINÂMICO se a distância for maior que 2,5 km ou se o custo de deslocamento consumir mais da metade do adicional.
4. Conheça detalhadamente as vias de Sorocaba e Votorantim:
   - Av. Antônio Carlos Comitre (Campolim): alta demanda, mas trânsito trava em pico.
   - Divisa Iguatemi / Pq Bela Vista: ponto estratégico fluido para atender Sorocaba Sul e Votorantim.
   - Av. 31 de Março (Centro Votorantim): corridas mais curtas, pouco congestionamento.
   - Av. Dom Aguirre / Marginal: conexão rápida, mas cuidado com radares e horários de chuva/alagamento.
   - Éden / Zona Industrial: corridas longas, porém ALTO RISCO DE VOLTAR VAZIO.
5. Leve em conta os parâmetros operacionais enviados no contexto:
   - Custo total por km do veículo: ${driverContext?.totalCostPerKm ? 'R$ ' + driverContext.totalCostPerKm + '/km' : 'R$ 2,72/km'}
   - Localização informada: ${driverContext?.currentArea || 'Sorocaba / Votorantim'}
   - Status do motorista: ${driverContext?.shiftActive ? 'Em turno ativo' : 'Fora de turno'}
   
Seja direto, profissional, fale português do Brasil de forma clara e focada no bolso do motorista. Responda em no máximo 3 parágrafos curtos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: message || 'Onde devo trabalhar agora?' }],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({
        reply: response.text || 'Sem resposta disponível no momento.',
        sources: ['Google GenAI (Gemini 3.8 Flash)', 'Histórico Operacional Local'],
      });
    } catch (error: any) {
      console.error('Error in /api/copilot:', error);
      res.status(500).json({
        error: 'Falha ao consultar o copiloto Gemini',
        details: error?.message || String(error),
      });
    }
  });

  // Analyze Offer Screenshot (Vision multimodal)
  app.post('/api/analyze-screenshot', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      }

      const ai = getGenAI();
      if (!ai) {
        // Fallback simulation with realistic defaults if key not configured
        return res.json({
          success: true,
          extracted: {
            fareValue: 24.50,
            pickupDistanceKm: 1.4,
            tripDistanceKm: 6.8,
            estimatedDurationMin: 18,
            observedSurge: 4.00,
            pickupArea: 'Parque Bela Vista, Votorantim',
            destinationArea: 'Parque Campolim, Sorocaba',
            visibleNotes: 'Identificado print de corrida Uber. Dados simulados (configure GEMINI_API_KEY para OCR real com IA).',
          },
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const prompt = `Analise atentamente esta captura de tela do aplicativo de motorista (ex: Uber Driver).
Extraia os seguintes dados operacionais visíveis e retorne APENAS um JSON válido no seguinte formato:
{
  "fareValue": number (valor total em R$, ex: 18.50),
  "pickupDistanceKm": number (distância até o passageiro em km, ex: 1.2),
  "tripDistanceKm": number (distância da corrida com o passageiro em km, ex: 5.4),
  "estimatedDurationMin": number (tempo estimado total em minutos, ex: 15),
  "observedSurge": number (valor adicional/dinâmico visível em R$, ou 0 se nenhum),
  "pickupArea": string (bairro ou rua de embarque visível),
  "destinationArea": string (bairro ou região de destino visível),
  "visibleNotes": string (detalhes adicionais como UberX, Confort, pontuação do passageiro ou aviso de trânsito)
}

Se algum campo não for claramente legível, faça uma estimativa razoável baseada na tela ou coloque 0.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fareValue: { type: Type.NUMBER },
              pickupDistanceKm: { type: Type.NUMBER },
              tripDistanceKm: { type: Type.NUMBER },
              estimatedDurationMin: { type: Type.NUMBER },
              observedSurge: { type: Type.NUMBER },
              pickupArea: { type: Type.STRING },
              destinationArea: { type: Type.STRING },
              visibleNotes: { type: Type.STRING },
            },
            required: ['fareValue', 'pickupDistanceKm', 'tripDistanceKm', 'estimatedDurationMin'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        extracted: parsed,
      });
    } catch (error: any) {
      console.error('Error analyzing screenshot:', error);
      res.status(500).json({
        error: 'Erro ao analisar screenshot com Gemini Vision',
        details: error?.message || String(error),
      });
    }
  });

  // Analyze Uber Demand Map Screenshot
  app.post('/api/analyze-demand-map', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.json({
          success: true,
          extracted: {
            city: 'Sorocaba',
            neighborhood: 'Campolim',
            surgeValueBonus: 5.50,
            estimatedWaitTimeMin: 4,
            notes: 'Área com manchas laranjas no mapa do Campolim. (Modo offline sem GEMINI_API_KEY)',
          },
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const prompt = `Esta imagem é uma captura de tela do mapa de demanda do aplicativo de transporte (ex: Uber Driver) na região de Sorocaba ou Votorantim.
Identifique as informações visíveis:
- Região ou bairro aproximado da maior mancha de demanda
- Cidade (Sorocaba ou Votorantim)
- Valor do adicional visível em R$ (ex: +R$ 4,50, +R$ 7,00) ou 0
- Estimativa de espera exibida (em minutos, ou 5 se não explícito)
- Resumo do padrão observado (ex: "Demanda concentrada na Av. Comitre e Parque Bela Vista")`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: { type: Type.STRING },
              neighborhood: { type: Type.STRING },
              surgeValueBonus: { type: Type.NUMBER },
              estimatedWaitTimeMin: { type: Type.NUMBER },
              notes: { type: Type.STRING },
            },
            required: ['city', 'neighborhood', 'surgeValueBonus'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        extracted: parsed,
      });
    } catch (error: any) {
      console.error('Error analyzing demand map:', error);
      res.status(500).json({
        error: 'Erro ao interpretar mapa de demanda com Gemini',
        details: error?.message || String(error),
      });
    }
  });

  // Setup Vite in Dev or static in Prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Operational Driver Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
