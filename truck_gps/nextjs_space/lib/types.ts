
export interface TruckSpecifications {
  heightFeet: number;
  heightInches: number;
  weightPounds: number;
  lengthFeet: number;
  hazmatClass: string;
}

export interface RouteRequest {
  origin: string;
  destination: string;
  truckSpecs: TruckSpecifications;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteInstruction {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteResult {
  distance: number; // in miles
  duration: number; // in minutes
  polyline: RoutePoint[];
  instructions: RouteInstruction[];
  summary: string;
}

export interface LocationSuggestion {
  label: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
}
