"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  IndianRupee,
  Navigation,
  FileText,
  MapPinned,
  Sun,
  Moon,
  ArrowRightLeft,
  Crosshair,
  Route,
  Navigation2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationSearchInput from "@/components/map/LocationSearchInput";
import MapView, { MapPoint } from "@/components/map/MapView";
import { useRoute } from "@/hooks/useRoute";
import { offerRideSchema } from "@/validations/ride.schema";

interface IVehicle {
  _id: string;
  vehicleType: "Car" | "SUV" | "Van" | "Bike" | "Other";
  vehicleModel: string;
  registrationNumber: string;
  seatingCapacity: number;
  availableSeats: number;
  vehiclePhoto?: string;
  verificationStatus?: "pending" | "approved" | "rejected";
  isApproved?: boolean;
}

interface IStopItem {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  estimatedTime?: string;
}

export default function OfferRidePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Map Click Picking Mode
  const [mapPickingTarget, setMapPickingTarget] = useState<"origin" | "destination" | "newStop" | null>(null);

  // Time-of-day smart default (Morning Pickup vs Evening Drop)
  const currentHour = new Date().getHours();
  const defaultIsMorning = currentHour < 13;

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: "",
    rideType: defaultIsMorning ? ("pickup" as "pickup" | "drop") : ("drop" as "pickup" | "drop"),
    startingLocation: defaultIsMorning ? "Tambaram Sanatorium" : "Tech Mahindra SEZ Campus, OMR",
    destination: defaultIsMorning ? "Tech Mahindra SEZ Campus, OMR" : "Tambaram Sanatorium",
    departureDate: new Date().toISOString().split("T")[0],
    departureTime: defaultIsMorning ? "08:30 AM" : "06:00 PM",
    availableSeats: 3,
    notes: "",
  });

  // Coordinate Points State
  const [startPoint, setStartPoint] = useState<MapPoint>({
    name: defaultIsMorning ? "Tambaram Sanatorium" : "Tech Mahindra SEZ Campus, OMR",
    address: defaultIsMorning ? "Tambaram Sanatorium, Chennai" : "Tech Mahindra SEZ Campus, OMR, Sholinganallur, Chennai",
    latitude: defaultIsMorning ? 12.9249 : 12.8988,
    longitude: defaultIsMorning ? 80.1332 : 80.2284,
  });

  const [endPoint, setEndPoint] = useState<MapPoint>({
    name: defaultIsMorning ? "Tech Mahindra SEZ Campus, OMR" : "Tambaram Sanatorium",
    address: defaultIsMorning ? "Tech Mahindra SEZ Campus, OMR, Sholinganallur, Chennai" : "Tambaram Sanatorium, Chennai",
    latitude: defaultIsMorning ? 12.8988 : 12.9249,
    longitude: defaultIsMorning ? 80.2284 : 80.1332,
  });

  // Dynamic Stops State with Coordinates
  const [stops, setStops] = useState<IStopItem[]>([
    {
      name: "Guindy Kathipara Flyover",
      address: "Kathipara Junction, Guindy, Chennai",
      latitude: 13.0067,
      longitude: 80.2025,
      price: 120,
    },
    {
      name: "Velachery Bypass Rd",
      address: "Velachery Bypass, Chennai",
      latitude: 12.9759,
      longitude: 80.2212,
      price: 180,
    },
  ]);

  // New Stop Input temporary state
  const [newStopName, setNewStopName] = useState("");
  const [newStopAddress, setNewStopAddress] = useState("");
  const [newStopLat, setNewStopLat] = useState<number>(0);
  const [newStopLng, setNewStopLng] = useState<number>(0);
  const [newStopPrice, setNewStopPrice] = useState<number>(100);

  // Routing Hook
  const { routeResult, isCalculating, calculateRoute } = useRoute();

  // Load User Vehicles
  useEffect(() => {
    async function loadVehicles() {
      try {
        const res = await fetch("/api/vehicles");
        if (res.ok) {
          const data = await res.json();
          const list: IVehicle[] = data.vehicles || [];
          setVehicles(list);

          if (list.length > 0) {
            const first = list[0];
            setFormData((prev) => ({
              ...prev,
              vehicleId: first._id,
              availableSeats: Math.min(first.availableSeats || 3, first.seatingCapacity),
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
      } finally {
        setIsLoadingVehicles(false);
      }
    }

    if (session?.user) {
      loadVehicles();
    }
  }, [session]);

  const selectedVehicle = vehicles.find((v) => v._id === formData.vehicleId);

  // Recalculate OSRM Route whenever start, destination, or stops change
  useEffect(() => {
    const waypoints: MapPoint[] = [];

    if (startPoint && startPoint.latitude && startPoint.longitude) {
      waypoints.push(startPoint);
    }

    stops.forEach((s) => {
      if (s.latitude && s.longitude) {
        waypoints.push({
          name: s.name,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          price: s.price,
        });
      }
    });

    if (endPoint && endPoint.latitude && endPoint.longitude) {
      waypoints.push(endPoint);
    }

    if (waypoints.length >= 2) {
      calculateRoute(waypoints);
    }
  }, [startPoint, endPoint, stops, calculateRoute]);

  const handleVehicleChange = (vId: string) => {
    const v = vehicles.find((veh) => veh._id === vId);
    setFormData((prev) => ({
      ...prev,
      vehicleId: vId,
      availableSeats: v ? (v.vehicleType === "Bike" ? 1 : Math.min(v.availableSeats || 3, v.seatingCapacity)) : 1,
    }));
  };

  const handleRideTypeChange = (newType: "pickup" | "drop") => {
    if (newType === "pickup") {
      setFormData((prev) => ({
        ...prev,
        rideType: "pickup",
        startingLocation: prev.startingLocation === "Tech Mahindra SEZ Campus, OMR" ? "Tambaram Sanatorium" : prev.startingLocation,
        destination: "Tech Mahindra SEZ Campus, OMR",
        departureTime: "08:30 AM",
      }));
      setStartPoint({
        name: "Tambaram Sanatorium",
        address: "Tambaram Sanatorium, Chennai",
        latitude: 12.9249,
        longitude: 80.1332,
      });
      setEndPoint({
        name: "Tech Mahindra SEZ Campus, OMR",
        address: "Tech Mahindra SEZ Campus, OMR, Sholinganallur, Chennai",
        latitude: 12.8988,
        longitude: 80.2284,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        rideType: "drop",
        startingLocation: "Tech Mahindra SEZ Campus, OMR",
        destination: prev.destination === "Tech Mahindra SEZ Campus, OMR" ? "Tambaram Sanatorium" : prev.destination,
        departureTime: "06:00 PM",
      }));
      setStartPoint({
        name: "Tech Mahindra SEZ Campus, OMR",
        address: "Tech Mahindra SEZ Campus, OMR, Sholinganallur, Chennai",
        latitude: 12.8988,
        longitude: 80.2284,
      });
      setEndPoint({
        name: "Tambaram Sanatorium",
        address: "Tambaram Sanatorium, Chennai",
        latitude: 12.9249,
        longitude: 80.1332,
      });
    }
  };

  const handleSwapRoute = () => {
    setFormData((prev) => ({
      ...prev,
      rideType: prev.rideType === "pickup" ? "drop" : "pickup",
      startingLocation: prev.destination,
      destination: prev.startingLocation,
      departureTime: prev.rideType === "pickup" ? "06:00 PM" : "08:30 AM",
    }));

    const prevStart = { ...startPoint };
    setStartPoint({ ...endPoint });
    setEndPoint(prevStart);
  };

  const handleMapClick = (loc: { address: string; latitude: number; longitude: number }) => {
    const short = loc.address.split(",")[0].trim();

    if (mapPickingTarget === "origin") {
      setFormData((prev) => ({ ...prev, startingLocation: short }));
      setStartPoint({ name: short, address: loc.address, latitude: loc.latitude, longitude: loc.longitude });
      setMapPickingTarget(null);
    } else if (mapPickingTarget === "destination") {
      setFormData((prev) => ({ ...prev, destination: short }));
      setEndPoint({ name: short, address: loc.address, latitude: loc.latitude, longitude: loc.longitude });
      setMapPickingTarget(null);
    } else if (mapPickingTarget === "newStop") {
      setNewStopName(short);
      setNewStopAddress(loc.address);
      setNewStopLat(loc.latitude);
      setNewStopLng(loc.longitude);
      setMapPickingTarget(null);
    }
  };

  const handleAddStop = () => {
    if (!newStopName.trim()) return;

    setStops((prev) => [
      ...prev,
      {
        name: newStopName.trim(),
        address: newStopAddress || newStopName.trim(),
        latitude: newStopLat || (startPoint.latitude ? startPoint.latitude + 0.01 : 12.95),
        longitude: newStopLng || (startPoint.longitude ? startPoint.longitude + 0.01 : 80.18),
        price: Number(newStopPrice) || 0,
      },
    ]);

    setNewStopName("");
    setNewStopAddress("");
    setNewStopLat(0);
    setNewStopLng(0);
    setNewStopPrice(100);
  };

  const handleRemoveStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStopPriceChange = (index: number, newPrice: number) => {
    setStops((prev) =>
      prev.map((stop, i) => (i === index ? { ...stop, price: newPrice } : stop))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    const payload = {
      ...formData,
      startLocation: {
        address: startPoint.address || formData.startingLocation,
        latitude: startPoint.latitude || 0,
        longitude: startPoint.longitude || 0,
      },
      endLocation: {
        address: endPoint.address || formData.destination,
        latitude: endPoint.latitude || 0,
        longitude: endPoint.longitude || 0,
      },
      distanceKm: routeResult?.distanceKm || 0,
      durationMinutes: routeResult?.durationMinutes || 0,
      stops: stops.map((s) => ({
        name: s.name,
        address: s.address || s.name,
        latitude: s.latitude || 0,
        longitude: s.longitude || 0,
        price: s.price,
      })),
    };

    const validation = offerRideSchema.safeParse(payload);
    if (!validation.success) {
      const formattedErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          formattedErrors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(formattedErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to offer ride.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Ride offered successfully! Redirecting to My Rides...");
      setTimeout(() => {
        router.push("/rides/my-rides");
      }, 1200);
    } catch (err) {
      console.error("Offer ride error:", err);
      setErrorMessage("Network error occurred while posting ride.");
      setIsSubmitting(false);
    }
  };

  const isPickup = formData.rideType === "pickup";

  const isEmployeeApproved =
    session?.user?.role === "admin" ||
    session?.user?.isApproved === true ||
    session?.user?.verificationStatus === "approved";

  const isVehicleApproved =
    session?.user?.role === "admin" ||
    (selectedVehicle &&
      (selectedVehicle.isApproved === true || selectedVehicle.verificationStatus === "approved"));

  const renderRideSummaryCard = () => (
    <Card className="border-slate-200 shadow-sm bg-slate-900 text-white rounded-2xl sticky top-20">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-white">Ride Summary</CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px]">
              {isPickup ? "🌅 Pickup" : "🌆 Drop"}
            </Badge>
            <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px]">
              {selectedVehicle?.vehicleType || "Car"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Origin</span>
              <span className="font-bold text-white">{formData.startingLocation || "Starting Location"}</span>
            </div>
          </div>

          {stops.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-700 text-slate-300">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-[11px] truncate">
                {isPickup ? "Pickup" : "Drop"}: {s.name} (₹{s.price})
              </span>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Destination</span>
              <span className="font-bold text-white">{formData.destination || "Destination"}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-3 space-y-2 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Distance:</span>
            <span className="font-bold text-emerald-400">
              {routeResult?.formattedDistance || "Calculating..."}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Estimated Duration:</span>
            <span className="font-semibold text-white">
              {routeResult?.formattedDuration || "Calculating..."}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Departure:</span>
            <span className="font-semibold text-white">
              {formData.departureDate} at {formData.departureTime}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Seats Offered:</span>
            <span className="font-bold text-emerald-400">{formData.availableSeats} Seats</span>
          </div>
        </div>

        {!isEmployeeApproved && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-xl text-[11px] pt-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Your account is pending Admin approval. You can offer rides once approved by Admin (Vathsan).</span>
          </div>
        )}

        {!isVehicleApproved && isEmployeeApproved && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-2.5 rounded-xl text-[11px] pt-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>Selected vehicle is awaiting Admin verification. Once approved by Admin, you can publish rides.</span>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3">
          <Button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-md transition-colors h-11 text-xs"
            disabled={isSubmitting || !isEmployeeApproved || !isVehicleApproved}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting Ride...
              </>
            ) : !isEmployeeApproved ? (
              "🔒 Account Pending Admin Approval"
            ) : !isVehicleApproved ? (
              "🔒 Vehicle Pending Admin Approval"
            ) : (
              `Post ${isPickup ? "Pickup" : "Drop"} Ride`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Offer a Ride
        </h1>
        <p className="text-sm text-slate-500">
          Share your commute with interactive OpenStreetMap routing, custom pickup/drop points, and real-time distance calculations
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200 animate-in fade-in-50">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200 animate-in fade-in-50">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoadingVehicles ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50/60 p-6 text-center space-y-3 rounded-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Car className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-amber-900">No Registered Vehicle Found</h2>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            You must register a verified car or bike in your profile before offering rides to colleagues.
          </p>
          <Link href="/vehicles">
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-xs mt-2">
              Register Vehicle Now
            </Button>
          </Link>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
          <div className="order-1 lg:order-2 lg:col-span-5 space-y-4">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Interactive Route Map
                  </CardTitle>
                </div>
                {isCalculating && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Calculating OSRM route...</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-0">
                <MapView
                  startLocation={startPoint}
                  destination={endPoint}
                  stops={stops
                    .filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number")
                    .map((s) => ({
                      name: s.name,
                      address: s.address,
                      latitude: s.latitude as number,
                      longitude: s.longitude as number,
                      price: s.price,
                    }))}
                  routeCoordinates={routeResult?.coordinates || []}
                  distanceText={routeResult?.formattedDistance}
                  durationText={routeResult?.formattedDuration}
                  onMapClick={handleMapClick}
                  isClickPicking={Boolean(mapPickingTarget)}
                  clickPickLabel={`Click anywhere on map to set ${
                    mapPickingTarget === "origin"
                      ? "Starting Origin"
                      : mapPickingTarget === "destination"
                      ? "Campus Destination"
                      : "New Stop"
                  }`}
                  height="340px"
                />
              </CardContent>
            </Card>

            <div className="hidden lg:block">
              {renderRideSummaryCard()}
            </div>
          </div>

          <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Car className="h-5 w-5 text-emerald-600" /> Post Campus Ride
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Configure commute direction, choose your vehicle, and set pickup points with fares
                    </CardDescription>
                  </div>

                  {selectedVehicle && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                      {selectedVehicle.vehicleType}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rideType" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Commute Direction</span>
                      <span className="text-[10px] text-emerald-700 font-medium lowercase font-mono">
                        {isPickup ? "morning pickup" : "evening drop"}
                      </span>
                    </Label>
                    <Select
                      value={formData.rideType}
                      onValueChange={(val: "pickup" | "drop") => handleRideTypeChange(val)}
                    >
                      <SelectTrigger id="rideType" className="rounded-xl h-11 text-xs font-semibold">
                        <SelectValue placeholder="Select Pickup or Drop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-amber-500" />
                            <span className="font-bold">Pickup</span>
                            <span className="text-slate-400 text-[11px]">(Morning to Campus)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="drop">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-indigo-500" />
                            <span className="font-bold">Drop</span>
                            <span className="text-slate-400 text-[11px]">(Evening from Campus)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="vehicleId" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Vehicle (Car or Bike)
                    </Label>
                    <Select
                      value={formData.vehicleId}
                      onValueChange={handleVehicleChange}
                    >
                      <SelectTrigger id="vehicleId" className="rounded-xl h-11 text-xs">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v) => {
                          const isApproved = v.isApproved || v.verificationStatus === "approved" || session?.user?.role === "admin";
                          return (
                            <SelectItem key={v._id} value={v._id}>
                              {v.vehicleModel} ({v.registrationNumber}) — {v.vehicleType} {!isApproved ? "⚠️ (Pending Admin Approval)" : "✓ Verified"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Commute Route ({isPickup ? "To Campus" : "From Campus"})
                    </Label>
                    <button
                      type="button"
                      onClick={handleSwapRoute}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <ArrowRightLeft className="h-3 w-3" /> Swap Direction
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Starting Location (Origin)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setMapPickingTarget(mapPickingTarget === "origin" ? null : "origin")}
                        className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                          mapPickingTarget === "origin"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        <Crosshair className="h-3 w-3" />
                        {mapPickingTarget === "origin" ? "Cancel Map Pick" : "Pick on Map"}
                      </button>
                    </div>
                    <LocationSearchInput
                      id="startingLocation"
                      placeholder="e.g. Tambaram Sanatorium, Chennai"
                      value={formData.startingLocation}
                      onChange={(loc) => {
                        setFormData((prev) => ({ ...prev, startingLocation: loc.address }));
                        setStartPoint({ name: loc.address, address: loc.address, latitude: loc.latitude, longitude: loc.longitude });
                      }}
                      hasError={Boolean(fieldErrors.startingLocation)}
                      required
                    />
                    {fieldErrors.startingLocation && (
                      <p className="text-xs text-rose-600">{fieldErrors.startingLocation}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        <span>Destination</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setMapPickingTarget(mapPickingTarget === "destination" ? null : "destination")}
                        className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                          mapPickingTarget === "destination"
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Crosshair className="h-3 w-3" />
                        {mapPickingTarget === "destination" ? "Cancel Map Pick" : "Pick on Map"}
                      </button>
                    </div>
                    <LocationSearchInput
                      id="destination"
                      placeholder="e.g. Tech Mahindra SEZ Campus, OMR, Sholinganallur"
                      value={formData.destination}
                      onChange={(loc) => {
                        setFormData((prev) => ({ ...prev, destination: loc.address }));
                        setEndPoint({ name: loc.address, address: loc.address, latitude: loc.latitude, longitude: loc.longitude });
                      }}
                      hasError={Boolean(fieldErrors.destination)}
                      required
                    />
                    {fieldErrors.destination && (
                      <p className="text-xs text-rose-600">{fieldErrors.destination}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                        Intermediary Pickup / Drop Stops
                      </Label>
                      <p className="text-[11px] text-slate-500">
                        Add key junction points along the route with suggested seat fares
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      {stops.length} Stops Added
                    </Badge>
                  </div>

                  {stops.length > 0 && (
                    <div className="space-y-2">
                      {stops.map((stop, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">
                                {stop.name}
                              </span>
                              {stop.address && stop.address !== stop.name && (
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {stop.address}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                              <span className="text-slate-500 text-[10px]">₹</span>
                              <input
                                type="number"
                                value={stop.price}
                                onChange={(e) => handleStopPriceChange(idx, Number(e.target.value) || 0)}
                                className="w-12 text-xs font-bold text-slate-800 focus:outline-none"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStop(idx)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Add Route Stop</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setMapPickingTarget(mapPickingTarget === "newStop" ? null : "newStop")}
                        className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                          mapPickingTarget === "newStop"
                            ? "bg-emerald-700 text-white"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        <Crosshair className="h-3 w-3" />
                        {mapPickingTarget === "newStop" ? "Cancel Map Pick" : "Pin on Map"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <LocationSearchInput
                          value={newStopName}
                          placeholder="Search stop name (e.g. Kathipara)"
                          onChange={(loc) => {
                            setNewStopName(loc.address.split(",")[0]);
                            setNewStopAddress(loc.address);
                            setNewStopLat(loc.latitude);
                            setNewStopLng(loc.longitude);
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">₹</span>
                          <Input
                            type="number"
                            placeholder="Fare"
                            value={newStopPrice}
                            onChange={(e) => setNewStopPrice(Number(e.target.value))}
                            className="pl-6 rounded-xl text-xs h-9"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddStop}
                          disabled={!newStopName.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs rounded-xl h-9 px-3"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <Label htmlFor="departureDate" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Departure Date
                    </Label>
                    <Input
                      id="departureDate"
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, departureDate: e.target.value }))}
                      className="rounded-xl h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="departureTime" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Departure Time
                    </Label>
                    <Input
                      id="departureTime"
                      placeholder="e.g. 08:30 AM"
                      value={formData.departureTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, departureTime: e.target.value }))}
                      className="rounded-xl h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="availableSeats" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Available Seats
                    </Label>
                    <Input
                      id="availableSeats"
                      type="number"
                      min={1}
                      max={selectedVehicle?.seatingCapacity || 6}
                      value={formData.availableSeats}
                      onChange={(e) => setFormData((prev) => ({ ...prev, availableSeats: Number(e.target.value) }))}
                      className="rounded-xl h-10 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Driver Notes & Route Instructions (Optional)
                  </Label>
                  <Input
                    id="notes"
                    placeholder="e.g. AC will be on, leaving sharp from campus gate"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="rounded-xl text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="block lg:hidden">
              {renderRideSummaryCard()}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
