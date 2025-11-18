
import TruckRoutingForm from '@/components/truck-routing-form';
import { Truck, MapPin, Shield, Route, Navigation2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/95 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg border border-blue-500">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  TruckGPS
                </h1>
                <p className="text-xs text-slate-300 font-medium">Professional Route Planning</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-400 rounded-md">
              <Route className="w-4 h-4 text-slate-900" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Route Optimizer</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Commercial Truck Routing
            </h2>
            <p className="text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed">
              Calculate compliant routes based on your vehicle specifications and cargo requirements. 
              Professional-grade navigation for the demands of commercial trucking.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-blue-300">
              <div className="flex flex-col items-start">
                <div className="p-3 bg-blue-100 rounded-lg mb-3">
                  <Truck className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Vehicle Specifications</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Input precise dimensions and weight to ensure route compliance with bridge clearances and weight restrictions.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-yellow-400">
              <div className="flex flex-col items-start">
                <div className="p-3 bg-yellow-100 rounded-lg mb-3">
                  <Shield className="w-6 h-6 text-yellow-700" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Hazmat Compliance</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Automatic routing around restricted zones for hazardous materials transport with full regulatory compliance.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-blue-300">
              <div className="flex flex-col items-start">
                <div className="p-3 bg-slate-100 rounded-lg mb-3">
                  <Navigation2 className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Turn-by-Turn Navigation</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Detailed driving instructions with mileage and time estimates for each segment of your route.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Form */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Route Calculator</h3>
                <p className="text-sm text-slate-600">Enter vehicle specs and destinations below</p>
              </div>
            </div>
            <TruckRoutingForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-6 text-center border-t border-slate-200 mt-8 pt-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          Professional Truck Navigation System • Phase 1A
        </p>
      </footer>
    </main>
  );
}
