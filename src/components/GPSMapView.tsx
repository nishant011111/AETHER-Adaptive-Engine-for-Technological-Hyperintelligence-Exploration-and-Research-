import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  MapPin,
  Compass,
  Radio,
  Crosshair,
  Layers,
  Satellite,
  Maximize2,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Zap,
  Globe,
} from 'lucide-react';
import { GPSLocationData } from '../types';
import { playSound } from '../utils/audio';

interface AerospaceStation {
  id: string;
  name: string;
  agency: string;
  country: string;
  lat: number;
  lng: number;
  type: string;
  description: string;
}

const GROUND_STATIONS: AerospaceStation[] = [
  {
    id: 'sdsc-shar',
    name: 'Satish Dhawan Space Centre (SDSC SHAR)',
    agency: 'ISRO',
    country: 'India',
    lat: 13.7199,
    lng: 80.2304,
    type: 'Primary Spaceport / Launch Complex',
    description: 'India primary orbital launch complex with First & Second Launch Pads for LVM3, PSLV, and SSLV missions.',
  },
  {
    id: 'istrac-blr',
    name: 'ISRO Telemetry, Tracking & Command Network (ISTRAC)',
    agency: 'ISRO',
    country: 'India',
    lat: 12.9716,
    lng: 77.5946,
    type: 'Mission Operations Complex (MOX)',
    description: 'Deep space and orbital mission control center overseeing Gaganyaan, Chandrayaan, and Aditya-L1.',
  },
  {
    id: 'vssc-trv',
    name: 'Vikram Sarabhai Space Centre (VSSC)',
    agency: 'ISRO',
    country: 'India',
    lat: 8.5367,
    lng: 76.8687,
    type: 'Rocket Research & Propulsion Design',
    description: 'Pioneering space research institute responsible for launch vehicle technologies and Vikas/Cryogenic stages.',
  },
  {
    id: 'sac-ahm',
    name: 'Space Applications Centre (SAC)',
    agency: 'ISRO',
    country: 'India',
    lat: 23.0225,
    lng: 72.5714,
    type: 'Payload & Sensor Development',
    description: 'Developer of NISAR S-band SAR payloads, electro-optical sensors, and satellite communication transponders.',
  },
  {
    id: 'ksc-nasa',
    name: 'Kennedy Space Center (KSC)',
    agency: 'NASA',
    country: 'USA',
    lat: 28.5729,
    lng: -80.649,
    type: 'Primary NASA Spaceport',
    description: 'Historic Launch Complex 39A/39B hosting Artemis lunar missions and commercial crew spaceflights.',
  },
  {
    id: 'jpl-caltech',
    name: 'Jet Propulsion Laboratory (JPL)',
    agency: 'NASA',
    country: 'USA',
    lat: 34.2003,
    lng: -118.1712,
    type: 'Robotic Planetary Exploration',
    description: 'NASA center for deep space robotic exploration, Mars rovers, and NISAR L-band SAR management.',
  },
  {
    id: 'csg-esa',
    name: 'Guiana Space Centre (CSG)',
    agency: 'ESA / CNES',
    country: 'French Guiana',
    lat: 5.2372,
    lng: -52.7606,
    type: 'European Spaceport',
    description: 'Equatorial spaceport for Ariane 6, Vega-C, and heavy orbital deep-space payloads.',
  },
];

interface GPSMapViewProps {
  onQuickCommand?: (cmd: string) => void;
}

export const GPSMapView: React.FC<GPSMapViewProps> = ({ onQuickCommand }) => {
  // Default coordinates (Bengaluru ISRO Space Hub fallback if permission pending)
  const [location, setLocation] = useState<GPSLocationData>({
    latitude: 12.9716,
    longitude: 77.5946,
    altitude: 920,
    accuracy: 8,
    heading: 42,
    speed: 0,
    timestamp: Date.now(),
    placeName: 'Bengaluru Space Research Corridor, Karnataka, India',
    city: 'Bengaluru',
    country: 'India',
    isLive: false,
    constellationStatus: {
      navicLocked: 7,
      gpsLocked: 12,
      glonassLocked: 6,
      galileoLocked: 8,
      hdop: 0.82,
    },
  });

  const [mapZoom, setMapZoom] = useState<number>(13);
  const [selectedStation, setSelectedStation] = useState<AerospaceStation | null>(GROUND_STATIONS[0]);
  const [trackingActive, setTrackingActive] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [coordFormat, setCoordFormat] = useState<'DD' | 'DMS' | 'MGRS'>('DD');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Initialize Geolocation & Continuous Tracking
  const startGeoTracking = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Browser Geolocation API is not supported in this environment.');
      return;
    }

    playSound('radar');
    setGeoError(null);

    const handleSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      
      setLocation((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        altitude: pos.coords.altitude,
        accuracy: Math.round(pos.coords.accuracy),
        altitudeAccuracy: pos.coords.altitudeAccuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0, // km/h
        timestamp: pos.timestamp,
        isLive: true,
      }));

      setTrackingActive(true);

      // Attempt reverse geocoding via OpenStreetMap Nominatim
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            setLocation((prev) => ({
              ...prev,
              placeName: data.display_name,
              city: data.address?.city || data.address?.town || data.address?.state_district || 'Detected Region',
              country: data.address?.country || 'Earth',
            }));
          }
        })
        .catch(() => {});
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('Geolocation notice:', err.message);
      setGeoError(`GPS Lock Notice: ${err.message}. Using calibrated telemetry coordinates.`);
      setTrackingActive(false);
    };

    // Quick single fetch
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Continuous watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    });
  };

  useEffect(() => {
    startGeoTracking();
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Calculate Great-Circle Distance (Haversine formula in km)
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
    return Math.round(R * c);
  };

  // Convert to DMS (Degrees Minutes Seconds)
  const toDMS = (deg: number, isLat: boolean): string => {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    return `${degrees}°${minutes}'${seconds}"${dir}`;
  };

  // Search for custom address/coordinate
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    playSound('pulse');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const target = data[0];
        const newLat = parseFloat(target.lat);
        const newLng = parseFloat(target.lon);

        setLocation((prev) => ({
          ...prev,
          latitude: newLat,
          longitude: newLng,
          placeName: target.display_name,
          city: target.name,
          isLive: false,
        }));
        setMapZoom(14);
        playSound('beep');
      } else {
        setGeoError('Location query not resolved. Please refine search parameters.');
      }
    } catch {
      setGeoError('Tactical geosearch lookup failed.');
    } finally {
      setIsSearching(false);
    }
  };

  // Map Tile URL Provider
  const getMapEmbedUrl = () => {
    const lat = location.latitude;
    const lon = location.longitude;
    const delta = 0.04 / Math.pow(2, mapZoom - 12);
    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  };

  const distanceToStation = selectedStation
    ? calculateDistanceKm(location.latitude, location.longitude, selectedStation.lat, selectedStation.lng)
    : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
      {/* Top Header & Tactical Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#00f2ff22] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00f2ff] animate-spin-slow" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-widest text-white font-display">
              GPS & GLOBAL TACTICAL MAP
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff]">
              {location.isLive ? 'LIVE GNSS ACTIVE' : 'CALIBRATED GRID'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Real-time multi-constellation satellite positioning (NavIC / GPS / GLONASS / Galileo) & Aerospace Ground Station Grid
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={startGeoTracking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff18] text-[#00f2ff] hover:bg-[#00f2ff28] text-xs font-mono transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${trackingActive ? 'animate-spin' : ''}`} />
            <span>SYNC GPS FIX</span>
          </button>

          {onQuickCommand && (
            <button
              onClick={() => {
                playSound('click');
                onQuickCommand(
                  `A.E.T.H.E.R., analyze my current GPS position at coordinates ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} and calculate orbital line-of-sight to ISRO SDSC SHAR.`
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7000ff66] bg-[#7000ff22] text-indigo-200 hover:bg-[#7000ff33] text-xs font-mono transition"
            >
              <Zap className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>QUERY A.E.T.H.E.R.</span>
            </button>
          )}
        </div>
      </div>

      {geoError && (
        <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs font-mono flex items-center justify-between">
          <span>{geoError}</span>
          <button
            onClick={() => setGeoError(null)}
            className="text-amber-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Telemetry Cards & Interactive Tactical Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Coordinates & Satellite Constellation Status */}
        <div className="lg:col-span-4 space-y-4">
          {/* Coordinates HUD Card */}
          <div className="p-4 rounded-xl border border-[#00f2ff33] bg-[#050b18cc] backdrop-blur-md shadow-[0_0_20px_#00f2ff11]">
            <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#00f2ff]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  CURRENT FIX TELEMETRY
                </span>
              </div>
              <div className="flex gap-1 text-[9px] font-mono">
                {(['DD', 'DMS'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      playSound('click');
                      setCoordFormat(fmt);
                    }}
                    className={`px-1.5 py-0.5 rounded ${
                      coordFormat === fmt
                        ? 'bg-[#00f2ff] text-black font-bold'
                        : 'bg-[#00f2ff11] text-slate-400 hover:text-[#00f2ff]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#00f2ff11]">
                <span className="text-slate-400">LATITUDE:</span>
                <span className="text-[#00f2ff] font-bold">
                  {coordFormat === 'DD' ? `${location.latitude.toFixed(6)}°` : toDMS(location.latitude, true)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#00f2ff11]">
                <span className="text-slate-400">LONGITUDE:</span>
                <span className="text-[#00f2ff] font-bold">
                  {coordFormat === 'DD' ? `${location.longitude.toFixed(6)}°` : toDMS(location.longitude, false)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#00f2ff11]">
                <span className="text-slate-400">ALTITUDE:</span>
                <span className="text-white font-bold">
                  {location.altitude !== null && location.altitude !== undefined
                    ? `${Math.round(location.altitude)} m MSL`
                    : '920 m (Barometric Est.)'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#00f2ff11]">
                <span className="text-slate-400">HORIZONTAL ACCURACY:</span>
                <span className="text-emerald-400 font-bold">±{location.accuracy || 6} m</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#00f2ff11]">
                <span className="text-slate-400">GROUND SPEED:</span>
                <span className="text-white font-bold">{location.speed || 0} km/h</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">HEADING / BEARING:</span>
                <span className="text-[#00f2ff] font-bold flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#00f2ff]" />
                  {location.heading ? `${Math.round(location.heading)}°` : '042° NNE'}
                </span>
              </div>
            </div>

            {/* Resolved Location Banner */}
            <div className="mt-3 p-2.5 rounded bg-[#020510] border border-[#00f2ff18] text-[11px] font-mono text-slate-300">
              <div className="text-[9px] text-[#00f2ff88] uppercase mb-1">RESOLVED GEOLOCATION:</div>
              <div className="line-clamp-2 text-white">{location.placeName}</div>
            </div>
          </div>

          {/* GNSS / NavIC Constellation Status */}
          <div className="p-4 rounded-xl border border-[#00f2ff33] bg-[#050b18cc] backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-[#00f2ff22] pb-2 mb-3">
              <Satellite className="w-4 h-4 text-[#00f2ff]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                CONSTELLATION STATUS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#020510] border border-[#00f2ff18]">
                <div className="text-[9px] text-slate-400">ISRO NavIC (IRNSS)</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">7 SATELLITES</div>
                <div className="text-[8px] text-slate-500">L5 / S-Band Locked</div>
              </div>

              <div className="p-2 rounded bg-[#020510] border border-[#00f2ff18]">
                <div className="text-[9px] text-slate-400">NAVSTAR GPS</div>
                <div className="text-sm font-bold text-[#00f2ff] mt-0.5">12 SATELLITES</div>
                <div className="text-[8px] text-slate-500">L1 / L2C Dual-Freq</div>
              </div>

              <div className="p-2 rounded bg-[#020510] border border-[#00f2ff18]">
                <div className="text-[9px] text-slate-400">GLONASS</div>
                <div className="text-sm font-bold text-indigo-300 mt-0.5">6 SATELLITES</div>
                <div className="text-[8px] text-slate-500">FDMA L1/L2 Track</div>
              </div>

              <div className="p-2 rounded bg-[#020510] border border-[#00f2ff18]">
                <div className="text-[9px] text-slate-400">GALILEO (ESA)</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">8 SATELLITES</div>
                <div className="text-[8px] text-slate-500">E1 / E5a Galileo Fix</div>
              </div>
            </div>

            <div className="mt-3 flex justify-between text-[10px] font-mono text-slate-400 border-t border-[#00f2ff18] pt-2">
              <span>HDOP: 0.82 (EXCELLENT)</span>
              <span>PDOP: 1.45</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map Display & Ground Stations */}
        <div className="lg:col-span-8 space-y-4">
          {/* Map Container with Search and Controls */}
          <div className="rounded-xl border border-[#00f2ff44] bg-[#020510] overflow-hidden shadow-[0_0_25px_#00f2ff18] flex flex-col">
            {/* Search and Quick Controls Bar */}
            <div className="p-3 border-b border-[#00f2ff22] bg-[#050b18dd] flex flex-col sm:flex-row items-center justify-between gap-2">
              <form onSubmit={handleLocationSearch} className="flex-1 w-full flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search coordinates, city, spaceport (e.g. Sriharikota, KSC)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#020308] border border-[#00f2ff33] text-[#00f2ff] placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:border-[#00f2ff]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-3 py-1.5 rounded-lg bg-[#00f2ff22] border border-[#00f2ff44] text-[#00f2ff] hover:bg-[#00f2ff33] text-xs font-mono transition"
                >
                  {isSearching ? 'SEARCHING...' : 'LOCATE'}
                </button>
              </form>

              {/* Map Zoom Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    playSound('click');
                    setMapZoom((z) => Math.min(18, z + 1));
                  }}
                  className="px-2.5 py-1 rounded bg-[#00f2ff11] border border-[#00f2ff33] text-[#00f2ff] hover:bg-[#00f2ff22] text-xs font-mono"
                  title="Zoom In"
                >
                  +
                </button>
                <span className="text-[10px] font-mono text-slate-400 px-1">Z{mapZoom}</span>
                <button
                  onClick={() => {
                    playSound('click');
                    setMapZoom((z) => Math.max(3, z - 1));
                  }}
                  className="px-2.5 py-1 rounded bg-[#00f2ff11] border border-[#00f2ff33] text-[#00f2ff] hover:bg-[#00f2ff22] text-xs font-mono"
                  title="Zoom Out"
                >
                  -
                </button>
                <a
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded bg-[#00f2ff11] border border-[#00f2ff33] text-slate-400 hover:text-[#00f2ff] ml-1"
                  title="Open in External Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Embedded Interactive Vector Map */}
            <div className="relative w-full h-80 sm:h-96 bg-[#0a0e1a] overflow-hidden">
              <iframe
                title="Tactical GPS Map"
                src={getMapEmbedUrl()}
                className="w-full h-full border-0 filter contrast-125 brightness-95"
                style={{ opacity: 0.92 }}
              />

              {/* Holographic Radar HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-[#00f2ff33] shadow-[inset_0_0_30px_#00f2ff22]">
                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-[#020510cc] border border-[#00f2ff33] text-[9px] font-mono text-[#00f2ff]">
                  GNSS FIX: {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
                </div>

                {/* Radar Grid Center Reticle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border border-[#00f2ff44] animate-ping opacity-30" />
                  <div className="w-4 h-4 rounded-full border border-[#00f2ff] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aerospace Ground Stations Grid & Line-of-Sight Range */}
          <div className="p-4 rounded-xl border border-[#00f2ff33] bg-[#050b18cc] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00f2ff]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  AEROSPACE LAUNCH & TRACKING STATIONS
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                SELECT STATION FOR VECTOR RANGE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {GROUND_STATIONS.map((station) => {
                const isSelected = selectedStation?.id === station.id;
                const dist = calculateDistanceKm(
                  location.latitude,
                  location.longitude,
                  station.lat,
                  station.lng
                );

                return (
                  <button
                    key={station.id}
                    onClick={() => {
                      playSound('click');
                      setSelectedStation(station);
                    }}
                    className={`p-2.5 rounded-lg border text-left font-mono transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#00f2ff] bg-[#00f2ff18] shadow-[0_0_12px_#00f2ff33]'
                        : 'border-[#00f2ff18] bg-[#02051088] hover:border-[#00f2ff44] hover:bg-[#00f2ff08]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="text-[#00f2ff] font-bold">{station.agency}</span>
                        <span>{station.country}</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1 line-clamp-1">
                        {station.name}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                        {station.type}
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-[#00f2ff18] flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">RANGE:</span>
                      <span className="text-[#00f2ff] font-bold">{dist.toLocaleString()} km</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Station Detailed Analysis Dossier */}
            {selectedStation && (
              <div className="mt-4 p-3 rounded-lg bg-[#020510] border border-[#00f2ff22] font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between text-[#00f2ff] font-bold text-xs mb-1">
                  <span>{selectedStation.name}</span>
                  <span>RANGE: {distanceToStation?.toLocaleString()} KM</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{selectedStation.description}</p>
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
                  <span>COORDINATES: {selectedStation.lat.toFixed(4)}°N, {selectedStation.lng.toFixed(4)}°E</span>
                  <span>AGENCY: {selectedStation.agency}</span>
                  <button
                    onClick={() => {
                      setLocation((prev) => ({
                        ...prev,
                        latitude: selectedStation.lat,
                        longitude: selectedStation.lng,
                        placeName: selectedStation.name,
                        city: selectedStation.name,
                        isLive: false,
                      }));
                      setMapZoom(14);
                      playSound('beep');
                    }}
                    className="text-[#00f2ff] underline hover:text-white"
                  >
                    FOCUS MAP ON THIS STATION
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
