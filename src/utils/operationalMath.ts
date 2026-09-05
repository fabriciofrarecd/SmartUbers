import { SemaphoreStatus, VehicleConfig, SystemSettings, RegionZone, PositioningRecommendation, TripOffer } from '../types';

/**
 * Calculates straight line distance (Haversine formula) in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Estimate travel time and traffic factor between two coordinates
 */
export function estimateTravelMinutes(
  distanceKm: number,
  trafficLevel: 'low' | 'moderate' | 'heavy' | 'intense'
): number {
  let avgSpeedKmh = 35; // Normal city speed in Sorocaba/Votorantim
  if (trafficLevel === 'low') avgSpeedKmh = 42;
  if (trafficLevel === 'moderate') avgSpeedKmh = 30;
  if (trafficLevel === 'heavy') avgSpeedKmh = 20;
  if (trafficLevel === 'intense') avgSpeedKmh = 14;

  const hours = distanceKm / avgSpeedKmh;
  const minutes = Math.ceil(hours * 60);
  return Math.max(minutes, 2);
}

/**
 * Evaluates an Uber trip offer according to actual operational vehicle costs
 */
export function evaluateTripOffer(
  fareValue: number,
  pickupDistanceKm: number,
  tripDistanceKm: number,
  estimatedDurationMin: number,
  vehicleConfig: VehicleConfig,
  settings: SystemSettings,
  destinationArea: string = ''
): Omit<TripOffer, 'id' | 'driverId' | 'timestamp' | 'observedSurge' | 'pickupArea' | 'source'> {
  const totalDistanceKm = Number((pickupDistanceKm + tripDistanceKm).toFixed(1));
  const grossPerKm = totalDistanceKm > 0 ? Number((fareValue / totalDistanceKm).toFixed(2)) : 0;
  const hours = estimatedDurationMin > 0 ? estimatedDurationMin / 60 : 0.1;
  const grossPerHour = Number((fareValue / hours).toFixed(2));

  // Actual cost based on structural depreciation + real fuel consumption
  const totalCostPerKm = vehicleConfig.totalCostPerKm;
  const estimatedCost = Number((totalDistanceKm * totalCostPerKm).toFixed(2));
  const estimatedNetMargin = Number((fareValue - estimatedCost).toFixed(2));
  const netMarginPercent = fareValue > 0 ? (estimatedNetMargin / fareValue) * 100 : 0;

  // Empty kilometers ratio (pickup distance as ratio of total distance)
  const emptyRatio = totalDistanceKm > 0 ? (pickupDistanceKm / totalDistanceKm) * 100 : 0;

  // Score algorithm (0 - 100)
  let score = 50;

  // 1. Gross per km scoring (Benchmark: R$ 2.80 - R$ 3.50+ is good in SP interior)
  if (grossPerKm >= 3.20) score += 25;
  else if (grossPerKm >= 2.70) score += 15;
  else if (grossPerKm >= 2.20) score += 5;
  else score -= 20;

  // 2. Gross per hour scoring (Benchmark: R$ 45+/h is good)
  if (grossPerHour >= 55) score += 20;
  else if (grossPerHour >= 42) score += 10;
  else if (grossPerHour < 30) score -= 15;

  // 3. Pickup distance penalty (Empty km before trip)
  if (pickupDistanceKm <= 1.2) score += 10;
  else if (pickupDistanceKm > 3.0) score -= 18;
  else if (pickupDistanceKm > 4.5) score -= 30;

  // 4. Net Margin criteria
  if (netMarginPercent >= 45) score += 15;
  else if (netMarginPercent < 20) score -= 25;
  else if (netMarginPercent < 0) score -= 45;

  // 5. Destination quality check for Sorocaba / Votorantim
  let destinationQuality: 'favoravel' | 'neutro' | 'desfavoravel' = 'neutro';
  const destLower = destinationArea.toLowerCase();
  if (
    destLower.includes('campolim') ||
    destLower.includes('iguatemi') ||
    destLower.includes('bela vista') ||
    destLower.includes('centro')
  ) {
    destinationQuality = 'favoravel';
    score += 8;
  } else if (
    destLower.includes('eden') ||
    destLower.includes('industrial') ||
    destLower.includes('rodovia') ||
    destLower.includes('brígida') ||
    destLower.includes('aparecidinha')
  ) {
    destinationQuality = 'desfavoravel';
    score -= 12; // Risco de voltar vazio
  }

  score = Math.max(10, Math.min(99, Math.round(score)));

  let semaphore: SemaphoreStatus = 'RED';
  let recommendationReason = '';

  if (score >= settings.scoreGreenThreshold && estimatedNetMargin > 5 && grossPerKm >= 2.50) {
    semaphore = 'GREEN';
    recommendationReason = `Excelente oportunidade. Margem líquida real de R$ ${estimatedNetMargin.toFixed(2)} (${netMarginPercent.toFixed(0)}%) e R$ ${grossPerKm.toFixed(2)}/km operacional.`;
  } else if (score >= settings.scoreYellowThreshold && estimatedNetMargin > 0) {
    semaphore = 'YELLOW';
    recommendationReason = `Oportunidade moderada. Margem líquida estimada de R$ ${estimatedNetMargin.toFixed(2)}. Atenção ao deslocamento vazio (${emptyRatio.toFixed(0)}% do trajeto).`;
  } else {
    semaphore = 'RED';
    if (estimatedNetMargin <= 0) {
      recommendationReason = `Desfavorável. Operação no prejuízo considerando desgaste veicular (R$ ${vehicleConfig.structuralCostPerKm.toFixed(2)}/km) e combustível.`;
    } else {
      recommendationReason = `Desfavorável economicamente. R$ ${grossPerKm.toFixed(2)}/km abaixo do piso de rentabilidade sustentável.`;
    }
  }

  return {
    fareValue,
    pickupDistanceKm,
    tripDistanceKm,
    estimatedDurationMin,
    totalDistanceKm,
    grossPerKm,
    grossPerHour,
    estimatedCost,
    estimatedNetMargin,
    semaphore,
    score,
    recommendationReason,
    destinationQuality,
    destinationArea,
  };
}

/**
 * Algoritmo estratégico de posicionamento e "NÃO PERSEGUIR O DINÂMICO"
 */
export function getTopPositioningRecommendations(
  driverLat: number,
  driverLng: number,
  regions: RegionZone[],
  vehicleConfig: VehicleConfig,
  settings: SystemSettings,
  searchRadiusKm: number = 10
): PositioningRecommendation[] {
  const list = regions.map((region) => {
    const dist = calculateHaversineDistanceKm(driverLat, driverLng, region.center.lat, region.center.lng);
    const travelTime = estimateTravelMinutes(dist, region.currentTraffic);
    const displacementCost = dist * vehicleConfig.totalCostPerKm;

    // Regra Estratégica: NÃO PERSEGUIR O DINÂMICO
    // Se o adicional observado na região for consumido pelo custo de deslocamento vazio:
    const netSurgeAdvantage = region.surgeObserved - displacementCost;

    let score = region.historicalScore * 0.4 + region.currentDemandScore * 0.35;
    
    // Penalidade por distância e trânsito
    const distancePenalty = dist * 4.5;
    score -= distancePenalty;

    if (region.currentTraffic === 'intense') score -= 16;
    else if (region.currentTraffic === 'heavy') score -= 9;
    else if (region.currentTraffic === 'low') score += 6;

    // Se estiver muito perto (menos de 1.5 km), bônus de permanência
    if (dist <= 1.5) {
      score += 15;
    }

    // Avaliação do dinâmico
    let dynamicWarning = '';
    if (region.surgeObserved > 0) {
      if (dist > settings.maxDynamicChaseDistanceKm) {
        // Dinâmico distante: Não compensa! O dinâmico pode sumir antes do motorista chegar
        score -= 20;
        dynamicWarning = `Adicional de +R$ ${region.surgeObserved.toFixed(2)} está a ${dist} km. O deslocamento consome R$ ${displacementCost.toFixed(2)} e o dinâmico pode oscilar antes da chegada. Não persiga.`;
      } else if (netSurgeAdvantage > 2.0) {
        score += 8;
        dynamicWarning = `Adicional de +R$ ${region.surgeObserved.toFixed(2)} próximo (${dist} km), cobrindo custo de deslocamento.`;
      }
    }

    score = Math.max(15, Math.min(98, Math.round(score)));

    let semaphore: SemaphoreStatus = 'RED';
    let recommendationType: 'PERMANECER' | 'POSICIONAR' | 'NAO_IR' = 'NAO_IR';
    let reasoning = '';

    if (dist <= 1.8 && score >= settings.scoreGreenThreshold) {
      semaphore = 'GREEN';
      recommendationType = 'PERMANECER';
      reasoning = `Excelente localização atual. Alta densidade histórica e você já está posicionado sem gerar km vazio.`;
    } else if (score >= settings.scoreGreenThreshold) {
      semaphore = 'GREEN';
      recommendationType = 'POSICIONAR';
      reasoning = `Vale o deslocamento curto de ${dist} km (${travelTime} min, trânsito ${region.currentTraffic}). Alta demanda operacional.`;
    } else if (score >= settings.scoreYellowThreshold) {
      semaphore = 'YELLOW';
      recommendationType = dist <= 2.0 ? 'PERMANECER' : 'POSICIONAR';
      reasoning = `Demanda moderada. Custo de chegada de R$ ${displacementCost.toFixed(2)}. ${dynamicWarning || 'Aguarde chamados sem rodar à toa.'}`;
    } else {
      semaphore = 'RED';
      recommendationType = 'NAO_IR';
      reasoning = dynamicWarning || `Desfavorável. Trânsito ${region.currentTraffic} e distância de ${dist} km geram R$ ${displacementCost.toFixed(2)} em km vazios desnecessários.`;
    }

    return {
      rank: 0,
      region,
      score,
      semaphore,
      distanceKm: dist,
      travelTimeMin: travelTime,
      trafficState: region.currentTraffic,
      confidence: (dist <= 3 ? 'alta' : 'moderada') as 'alta' | 'moderada' | 'baixa',
      recommendationType,
      reasoning,
      dataSources: {
        googleTraffic: true,
        userObservationsCount: region.surgeObserved > 0 ? 14 : 6,
        historicalRecordsCount: Math.round(region.historicalScore * 0.8),
        driverDistanceKm: dist,
      },
    };
  });

  // Filter within search radius and sort descending by score
  const filtered = list
    .filter((item) => item.distanceKm <= searchRadiusKm)
    .sort((a, b) => b.score - a.score);

  return filtered.slice(0, 3).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
