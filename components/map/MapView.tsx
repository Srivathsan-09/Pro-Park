"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import type { MapPoint, DriverLivePoint } from "./LeafletRouteMap";

export type { MapPoint, DriverLivePoint };

export interface MapViewProps {
  startLocation?: MapPoint | null;
  destination?: MapPoint | null;
  stops?: MapPoint[];
  customPickupPoint?: MapPoint | null;
  driverLocation?: DriverLivePoint | null;
  driverName?: string;
  driverVehicleType?: string;
  panToDriver?: boolean;
  routeCoordinates?: [number, number][];
  distanceText?: string;
  durationText?: string;
  onMapClick?: (location: { address: string; latitude: number; longitude: number }) => void;
  isClickPicking?: boolean;
  clickPickLabel?: string;
  height?: string;
  showStats?: boolean;
  className?: string;
}

const DynamicLeafletMap = dynamic(() => import("./LeafletRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 animate-pulse">
      <MapPin className="h-8 w-8 text-slate-300" />
      <span className="text-xs font-semibold text-slate-400">Loading OpenStreetMap...</span>
    </div>
  ),
});

export default function MapView(props: MapViewProps) {
  return <DynamicLeafletMap {...props} />;
}
