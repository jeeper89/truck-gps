
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import RouteMap from '@/components/route-map';
import RouteResults from '@/components/route-results';
import type { RouteResult } from '@/lib/types';

interface FormData {
  heightFeet: number;
  heightInches: number;
  weightPounds: number;
  lengthFeet: number;
  hazmatClass: string;
  origin: string;
  destination: string;
}

export default function TruckRoutingForm() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      heightFeet: 13,
      heightInches: 6,
      weightPounds: 80000,
      lengthFeet: 53,
      hazmatClass: 'none',
      origin: '',
      destination: '',
    },
  });

  const hazmatClass = watch('hazmatClass');

  const onSubmit = async (data: FormData) => {
    setIsCalculating(true);
    setRouteResult(null);

    try {
      const response = await fetch('/api/route-truck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: data?.origin ?? '',
          destination: data?.destination ?? '',
          truckSpecs: {
            heightFeet: data?.heightFeet ?? 13,
            heightInches: data?.heightInches ?? 6,
            weightPounds: data?.weightPounds ?? 80000,
            lengthFeet: data?.lengthFeet ?? 53,
            hazmatClass: data?.hazmatClass ?? 'none',
          },
        }),
      });

      if (!response?.ok) {
        const errorData = await response?.json?.();
        throw new Error(errorData?.error ?? 'Failed to calculate route');
      }

      const result = await response?.json?.();
      setRouteResult(result ?? null);

      toast({
        title: 'Route calculated successfully',
        description: `Distance: ${result?.distance?.toFixed?.(1) ?? 0} miles, Time: ${Math.round(result?.duration ?? 0)} minutes`,
      });
    } catch (error: any) {
      toast({
        title: 'Route calculation failed',
        description: error?.message ?? 'Unable to calculate route. Please check your inputs.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <div className="bg-slate-50 rounded-lg shadow-md p-6 border border-slate-300">
        <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2 pb-3 border-b border-slate-300">
          <Navigation className="w-5 h-5 text-blue-600" />
          Route Parameters
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Origin and Destination */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="origin" className="text-sm font-medium text-gray-700">
                Origin Address
              </Label>
              <div className="mt-1.5 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="origin"
                  placeholder="Enter starting address"
                  className="pl-10"
                  {...register('origin', { required: 'Origin is required' })}
                />
              </div>
              {errors?.origin && (
                <p className="text-sm text-red-600 mt-1">{errors?.origin?.message ?? ''}</p>
              )}
            </div>

            <div>
              <Label htmlFor="destination" className="text-sm font-medium text-gray-700">
                Destination Address
              </Label>
              <div className="mt-1.5 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="destination"
                  placeholder="Enter destination address"
                  className="pl-10"
                  {...register('destination', { required: 'Destination is required' })}
                />
              </div>
              {errors?.destination && (
                <p className="text-sm text-red-600 mt-1">{errors?.destination?.message ?? ''}</p>
              )}
            </div>
          </div>

          {/* Truck Specifications */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Truck Specifications</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Height */}
              <div>
                <Label htmlFor="heightFeet" className="text-sm font-medium text-gray-700">
                  Height (ft)
                </Label>
                <Input
                  id="heightFeet"
                  type="number"
                  min="0"
                  max="20"
                  className="mt-1.5"
                  {...register('heightFeet', {
                    required: 'Height is required',
                    min: { value: 8, message: 'Minimum 8 feet' },
                    max: { value: 20, message: 'Maximum 20 feet' },
                  })}
                />
                {errors?.heightFeet && (
                  <p className="text-xs text-red-600 mt-1">{errors?.heightFeet?.message ?? ''}</p>
                )}
              </div>

              <div>
                <Label htmlFor="heightInches" className="text-sm font-medium text-gray-700">
                  Height (in)
                </Label>
                <Input
                  id="heightInches"
                  type="number"
                  min="0"
                  max="11"
                  className="mt-1.5"
                  {...register('heightInches', {
                    min: { value: 0, message: 'Min 0' },
                    max: { value: 11, message: 'Max 11' },
                  })}
                />
              </div>

              {/* Weight */}
              <div className="col-span-2">
                <Label htmlFor="weightPounds" className="text-sm font-medium text-gray-700">
                  Weight (lbs)
                </Label>
                <Input
                  id="weightPounds"
                  type="number"
                  min="0"
                  max="120000"
                  className="mt-1.5"
                  {...register('weightPounds', {
                    required: 'Weight is required',
                    min: { value: 10000, message: 'Minimum 10,000 lbs' },
                    max: { value: 120000, message: 'Maximum 120,000 lbs' },
                  })}
                />
                {errors?.weightPounds && (
                  <p className="text-xs text-red-600 mt-1">{errors?.weightPounds?.message ?? ''}</p>
                )}
              </div>

              {/* Length */}
              <div className="col-span-2">
                <Label htmlFor="lengthFeet" className="text-sm font-medium text-gray-700">
                  Length (ft)
                </Label>
                <Input
                  id="lengthFeet"
                  type="number"
                  min="0"
                  max="80"
                  className="mt-1.5"
                  {...register('lengthFeet', {
                    required: 'Length is required',
                    min: { value: 20, message: 'Minimum 20 feet' },
                    max: { value: 80, message: 'Maximum 80 feet' },
                  })}
                />
                {errors?.lengthFeet && (
                  <p className="text-xs text-red-600 mt-1">{errors?.lengthFeet?.message ?? ''}</p>
                )}
              </div>

              {/* Hazmat */}
              <div className="col-span-2">
                <Label htmlFor="hazmatClass" className="text-sm font-medium text-gray-700">
                  Hazmat Class
                </Label>
                <Select
                  value={hazmatClass ?? 'none'}
                  onValueChange={(value) => setValue('hazmatClass', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select hazmat class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="explosive">Explosive</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="flammable">Flammable</SelectItem>
                    <SelectItem value="combustible">Combustible</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="poison">Poison</SelectItem>
                    <SelectItem value="radioActive">Radioactive</SelectItem>
                    <SelectItem value="corrosive">Corrosive</SelectItem>
                    <SelectItem value="poisonousInhalation">Poisonous Inhalation</SelectItem>
                    <SelectItem value="harmfulToWater">Harmful to Water</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all text-base font-bold py-6 uppercase tracking-wide"
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Calculating Route...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 mr-2" />
                Calculate Route
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {routeResult ? (
          <>
            <RouteResults result={routeResult} />
            <RouteMap result={routeResult} />
          </>
        ) : (
          <div className="bg-slate-50 rounded-lg shadow-md p-12 border border-slate-300 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Ready to Calculate
              </h3>
              <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
                Enter your truck specifications and route details to begin navigation planning.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
