
'use client';

import { Clock, Navigation2, TrendingUp } from 'lucide-react';
import type { RouteResult } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface RouteResultsProps {
  result: RouteResult;
}

export default function RouteResults({ result }: RouteResultsProps) {
  const hours = Math.floor((result?.duration ?? 0) / 60);
  const minutes = Math.round((result?.duration ?? 0) % 60);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-slate-300">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-300">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        Route Summary
      </h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Navigation2 className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Distance</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">
            {result?.distance?.toFixed?.(1) ?? 0}
            <span className="text-sm font-normal text-blue-700 ml-1">mi</span>
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-300">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-700" />
            <span className="text-xs font-bold text-yellow-900 uppercase tracking-wide">Duration</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800">
            {hours > 0 ? `${hours}h ` : ''}
            {minutes}m
          </p>
        </div>
      </div>

      {/* Turn-by-Turn Directions */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">
          Turn-by-Turn Directions
        </h4>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {(result?.instructions ?? [])?.map?.((instruction, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 font-medium">
                  {instruction?.instruction ?? ''}
                </p>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  {((instruction?.distance ?? 0) * 0.000621371)?.toFixed?.(1) ?? 0} mi • {' '}
                  {Math.round((instruction?.duration ?? 0) / 60)} min
                </p>
              </div>
            </div>
          )) ?? null}
        </div>
      </div>
    </div>
  );
}
