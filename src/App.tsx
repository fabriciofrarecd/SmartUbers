import React, { useState, useEffect } from 'react';
import {
  Driver,
  VehicleConfig,
  RegionZone,
  StrategicStop,
  DemandObservation,
  Shift,
  SystemSettings,
  TripOffer,
  PositioningRecommendation,
} from './types';
import {
  INITIAL_DRIVERS,
  INITIAL_VEHICLE_CONFIGS,
  INITIAL_SETTINGS,
  REGIONS_SOROCABA_VOTORANTIM,
  STRATEGIC_STOPS,
  INITIAL_DEMAND_OBSERVATIONS,
} from './data/mockOperationalData';
import { getTopPositioningRecommendations } from './utils/operationalMath';
import { DriverHeader } from './components/DriverHeader';
import { DriverHomeView } from './components/DriverHomeView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { OfferAnalysisModal } from './components/OfferAnalysisModal';
import { PositioningModal } from './components/PositioningModal';
import { DemandRegistrationModal } from './components/DemandRegistrationModal';
import { CopilotModal } from './components/CopilotModal';
import { OperationalMapView } from './components/OperationalMapView';
import { VehicleConfigModal } from './components/VehicleConfigModal';
import { AuditReportModal } from './components/AuditReportModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'DRIVER' | 'ADMIN'>('DRIVER');
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('op_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });
  const [selectedDriver, setSelectedDriver] = useState<Driver>(drivers[0]);

  const [vehicleConfigs, setVehicleConfigs] = useState<Record<string, VehicleConfig>>(() => {
    const saved = localStorage.getItem('op_vehicle_configs');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLE_CONFIGS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('op_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [regions, setRegions] = useState<RegionZone[]>(REGIONS_SOROCABA_VOTORANTIM);
  const [currentRegion, setCurrentRegion] = useState<RegionZone>(REGIONS_SOROCABA_VOTORANTIM[1]); // Parque Bela Vista / Iguatemi
  const [strategicStops] = useState<StrategicStop[]>(STRATEGIC_STOPS);

  const [demandObservations, setDemandObservations] = useState<DemandObservation[]>(() => {
    const saved = localStorage.getItem('op_demand_obs');
    return saved ? JSON.parse(saved) : INITIAL_DEMAND_OBSERVATIONS;
  });

  // Current driver's shift telemetry
  const [shift, setShift] = useState<Shift>(() => {
    const saved = localStorage.getItem('op_current_shift_' + selectedDriver.id);
    if (saved) return JSON.parse(saved);
    return {
      id: 'shift-' + selectedDriver.id,
      driverId: selectedDriver.id,
      startTime: new Date(Date.now() - 1000 * 60 * 145).toISOString(),
      isActive: true,
      kmTotal: 58.4,
      kmProductive: 47.2,
      kmEmpty: 11.2,
      minutesMoving: 105,
      minutesParked: 40,
      tripsCount: 5,
      grossRevenue: 174.50,
      calculatedCost: 58.4 * (INITIAL_VEHICLE_CONFIGS[selectedDriver.id]?.totalCostPerKm || 2.72),
      netMargin: 174.50 - (58.4 * (INITIAL_VEHICLE_CONFIGS[selectedDriver.id]?.totalCostPerKm || 2.72)),
      zonesVisited: ['Parque Bela Vista', 'Parque Campolim', 'Centro de Sorocaba'],
    };
  });

  // Modals state
  const [isOfferAnalysisOpen, setIsOfferAnalysisOpen] = useState(false);
  const [isPositioningOpen, setIsPositioningOpen] = useState(false);
  const [isDemandRegistrationOpen, setIsDemandRegistrationOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isVehicleConfigOpen, setIsVehicleConfigOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // User GPS coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({
    lat: currentRegion.center.lat,
    lng: currentRegion.center.lng,
  });
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const currentVehicleConfig =
    vehicleConfigs[selectedDriver.id] || INITIAL_VEHICLE_CONFIGS['drv-1'];

  // Save to localStorage when updated
  useEffect(() => {
    localStorage.setItem('op_vehicle_configs', JSON.stringify(vehicleConfigs));
  }, [vehicleConfigs]);

  useEffect(() => {
    localStorage.setItem('op_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('op_demand_obs', JSON.stringify(demandObservations));
  }, [demandObservations]);

  useEffect(() => {
    localStorage.setItem('op_current_shift_' + selectedDriver.id, JSON.stringify(shift));
  }, [shift, selectedDriver.id]);

  // Just-in-Time simulated pulse: periodically updates real-time demand score slightly
  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setRegions((prev) =>
        prev.map((r) => {
          // Slight realistic fluctuation between -2 and +3 points
          const delta = Math.floor(Math.random() * 5) - 2;
          const newScore = Math.max(45, Math.min(98, r.currentDemandScore + delta));
          return {
            ...r,
            currentDemandScore: newScore,
          };
        })
      );
    }, 28000);
    return () => clearInterval(pulseTimer);
  }, []);

  // Request user location with browser Geolocation API
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          setLocationPermissionGranted(true);

          // Find nearest region
          let nearest = regions[0];
          let minDist = 99999;
          regions.forEach((r) => {
            const d = Math.hypot(r.center.lat - lat, r.center.lng - lng);
            if (d < minDist) {
              minDist = d;
              nearest = r;
            }
          });
          setCurrentRegion(nearest);
        },
        (err) => {
          console.log('Geolocation note: using default Sorocaba/Votorantim coordinates');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Top positioning recommendation for the current driver's position
  const topRecommendations = getTopPositioningRecommendations(
    userCoords?.lat || currentRegion.center.lat,
    userCoords?.lng || currentRegion.center.lng,
    regions,
    currentVehicleConfig,
    settings,
    5
  );
  const topRecommendation = topRecommendations[0] || null;

  // Toggle shift on/off
  const handleToggleShift = () => {
    if (shift.isActive) {
      setShift((prev) => ({
        ...prev,
        isActive: false,
        endTime: new Date().toISOString(),
      }));
    } else {
      setShift((prev) => ({
        ...prev,
        isActive: true,
        startTime: new Date().toISOString(),
      }));
    }
  };

  // Record an accepted trip into current shift
  const handleAcceptAndRecordTrip = (trip: TripOffer) => {
    setShift((prev) => {
      const newTotalKm = Number((prev.kmTotal + trip.totalDistanceKm).toFixed(1));
      const newProductiveKm = Number((prev.kmProductive + trip.tripDistanceKm).toFixed(1));
      const newEmptyKm = Number((prev.kmEmpty + trip.pickupDistanceKm).toFixed(1));
      const newRevenue = Number((prev.grossRevenue + trip.fareValue).toFixed(2));
      const newCost = Number((prev.calculatedCost + trip.estimatedCost).toFixed(2));
      const newMargin = Number((newRevenue - newCost).toFixed(2));

      return {
        ...prev,
        kmTotal: newTotalKm,
        kmProductive: newProductiveKm,
        kmEmpty: newEmptyKm,
        tripsCount: prev.tripsCount + 1,
        grossRevenue: newRevenue,
        calculatedCost: newCost,
        netMargin: newMargin,
        minutesMoving: prev.minutesMoving + trip.estimatedDurationMin,
      };
    });
  };

  // Save new demand observation from user
  const handleSaveObservation = (obs: DemandObservation) => {
    setDemandObservations((prev) => [obs, ...prev]);

    // Update the surge in the corresponding region if observed
    if (obs.surgeValueBonus > 0) {
      setRegions((prev) =>
        prev.map((r) =>
          r.name.toLowerCase().includes(obs.neighborhood.toLowerCase())
            ? { ...r, surgeObserved: obs.surgeValueBonus, currentDemandScore: Math.min(95, r.currentDemandScore + 8) }
            : r
        )
      );
    }
  };

  // Save vehicle config
  const handleSaveVehicleConfig = (updated: VehicleConfig) => {
    setVehicleConfigs((prev) => ({
      ...prev,
      [selectedDriver.id]: updated,
    }));
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Frosted Glass Ambient Lighting Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-indigo-600/25 blur-[110px]" />
        <div className="absolute top-1/3 -right-32 w-[26rem] h-[26rem] rounded-full bg-sky-500/20 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] rounded-full bg-emerald-500/15 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Application Bar */}
        <DriverHeader
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        selectedDriver={selectedDriver}
        onSelectDriver={(d) => {
          setSelectedDriver(d);
          // Load driver's stored shift or initial
          const saved = localStorage.getItem('op_current_shift_' + d.id);
          if (saved) setShift(JSON.parse(saved));
        }}
        drivers={drivers}
        vehicleConfig={currentVehicleConfig}
        onOpenVehicleConfig={() => setIsVehicleConfigOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        shiftActive={shift.isActive}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentMode === 'DRIVER' ? (
          <DriverHomeView
            currentRegion={currentRegion}
            onSelectRegion={setCurrentRegion}
            regions={regions}
            topRecommendation={topRecommendation}
            shift={shift}
            onToggleShift={handleToggleShift}
            vehicleConfig={currentVehicleConfig}
            onOpenOfferAnalysis={() => setIsOfferAnalysisOpen(true)}
            onOpenPositioning={() => setIsPositioningOpen(true)}
            onOpenDemandRegistration={() => setIsDemandRegistrationOpen(true)}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onOpenVehicleConfig={() => setIsVehicleConfigOpen(true)}
            userCoords={userCoords}
            onRefreshLocation={requestLocation}
            locationPermissionGranted={locationPermissionGranted}
            onRequestLocationPermission={requestLocation}
            strategicStops={STRATEGIC_STOPS}
            demandObservations={demandObservations}
          />
        ) : (
          <AdminDashboardView
            drivers={drivers}
            vehicleConfigs={vehicleConfigs}
            settings={settings}
            onUpdateSettings={setSettings}
            regions={regions}
            onOpenVehicleConfig={() => setIsVehicleConfigOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <OfferAnalysisModal
        isOpen={isOfferAnalysisOpen}
        onClose={() => setIsOfferAnalysisOpen(false)}
        vehicleConfig={currentVehicleConfig}
        settings={settings}
        onAcceptAndRecordTrip={handleAcceptAndRecordTrip}
        driverId={selectedDriver.id}
      />

      <PositioningModal
        isOpen={isPositioningOpen}
        onClose={() => setIsPositioningOpen(false)}
        driverLat={userCoords?.lat || currentRegion.center.lat}
        driverLng={userCoords?.lng || currentRegion.center.lng}
        regions={regions}
        vehicleConfig={currentVehicleConfig}
        settings={settings}
        currentRegion={currentRegion}
        onSelectRegion={(r) => {
          setCurrentRegion(r);
          setIsPositioningOpen(false);
        }}
      />

      <DemandRegistrationModal
        isOpen={isDemandRegistrationOpen}
        onClose={() => setIsDemandRegistrationOpen(false)}
        regions={regions}
        currentRegion={currentRegion}
        driverId={selectedDriver.id}
        onSaveObservation={handleSaveObservation}
      />

      <OperationalMapView
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        regions={regions}
        currentRegion={currentRegion}
        onSelectRegion={setCurrentRegion}
        strategicStops={strategicStops}
        demandObservations={demandObservations}
        userCoords={userCoords}
        onOpenDemandRegistration={() => {
          setIsMapOpen(false);
          setIsDemandRegistrationOpen(true);
        }}
      />

      <CopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentRegion={currentRegion}
        vehicleConfig={currentVehicleConfig}
        shift={shift}
      />

      <VehicleConfigModal
        isOpen={isVehicleConfigOpen}
        onClose={() => setIsVehicleConfigOpen(false)}
        driver={selectedDriver}
        currentConfig={currentVehicleConfig}
        onSaveConfig={handleSaveVehicleConfig}
      />

      <AuditReportModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />
      </div>
    </div>
  );
}
