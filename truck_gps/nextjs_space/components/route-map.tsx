
'use client';

import { useEffect, useRef, useState } from 'react';
import type { RouteResult } from '@/lib/types';
import { MapPin } from 'lucide-react';

interface RouteMapProps {
  result: RouteResult;
}

// Dynamic import for Leaflet to avoid SSR issues
export default function RouteMap({ result }: RouteMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet dynamically
    const loadMap = async () => {
      if (typeof window === 'undefined' || !mapRef?.current) return;

      try {
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default;

        // Load Leaflet CSS
        if (!document?.querySelector?.('link[href*="leaflet.css"]')) {
          const link = document?.createElement?.('link');
          if (link) {
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document?.head?.appendChild?.(link);
          }
        }

        // Clear existing map
        if (mapInstanceRef?.current) {
          mapInstanceRef?.current?.remove?.();
        }

        // Initialize map
        const map = L?.map?.(mapRef?.current ?? '', {
          zoomControl: true,
        });

        if (!map) return;

        mapInstanceRef.current = map;

        // Add tile layer
        L?.tileLayer?.('https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Tissot_mercator.png/400px-Tissot_mercator.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        })?.addTo?.(map);

        // Draw route
        const polyline = result?.polyline ?? [];
        if (polyline?.length > 0) {
          const latLngs: [number, number][] = polyline?.map?.((point) => [point?.lat ?? 0, point?.lng ?? 0] as [number, number]) ?? [];

          // Add route line
          L?.polyline?.(latLngs, {
            color: '#2563eb',
            weight: 5,
            opacity: 0.7,
          })?.addTo?.(map);

          // Add start marker
          const startIcon = L?.divIcon?.({
            html: `<div style="background: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span style="color: white; font-weight: bold; font-size: 12px;">A</span></div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          L?.marker?.(latLngs?.[0] ?? [0, 0], {
            icon: startIcon,
          })?.addTo?.(map);

          // Add end marker
          const endIcon = L?.divIcon?.({
            html: `<div style="background: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><span style="color: white; font-weight: bold; font-size: 12px;">B</span></div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const lastIndex = polyline?.length - 1;
          L?.marker?.(latLngs?.[lastIndex] ?? [0, 0], {
            icon: endIcon,
          })?.addTo?.(map);

          // Fit bounds to show entire route
          const bounds = L?.latLngBounds?.(latLngs);
          map?.fitBounds?.(bounds, { padding: [50, 50] });
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef?.current) {
        mapInstanceRef?.current?.remove?.();
      }
    };
  }, [result]);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Interactive Route Map
        </h3>
      </div>
      <div className="relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-[400px] lg:h-[500px]" />
      </div>
    </div>
  );
}
