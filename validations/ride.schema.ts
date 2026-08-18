import { z } from "zod";

export const locationCoordinateSchema = z.object({
  address: z.string().default(""),
  latitude: z.coerce.number().default(0),
  longitude: z.coerce.number().default(0),
});

export const rideStopSchema = z.object({
  name: z.string().trim().min(1, "Stop location name is required"),
  address: z.string().optional().default(""),
  latitude: z.coerce.number().optional().default(0),
  longitude: z.coerce.number().optional().default(0),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  estimatedTime: z.string().optional().or(z.literal("")),
});

export const offerRideSchema = z.object({
  vehicleId: z.string({ required_error: "Please select a vehicle" }).min(1, "Please select a vehicle"),
  rideType: z.enum(["pickup", "drop"]).default("pickup"),
  startingLocation: z
    .string({ required_error: "Starting location is required" })
    .trim()
    .min(2, "Starting location must be at least 2 characters")
    .max(150, "Starting location cannot exceed 150 characters"),
  destination: z
    .string({ required_error: "Destination is required" })
    .trim()
    .min(2, "Destination must be at least 2 characters")
    .max(150, "Destination cannot exceed 150 characters"),
  startLocation: locationCoordinateSchema.optional(),
  endLocation: locationCoordinateSchema.optional(),
  distanceKm: z.coerce.number().optional().default(0),
  durationMinutes: z.coerce.number().optional().default(0),
  departureDate: z.string({ required_error: "Departure date is required" }).min(1, "Please select a date"),
  departureTime: z.string({ required_error: "Departure time is required" }).min(1, "Please select a departure time"),
  availableSeats: z.coerce
    .number({ required_error: "Available seats are required" })
    .int("Must be a whole number")
    .min(1, "At least 1 seat is required")
    .max(10, "Maximum seats allowed is 10"),
  stops: z.array(rideStopSchema).default([]),
  notes: z.string().max(300, "Notes cannot exceed 300 characters").optional().or(z.literal("")),
});

export const rideRequestSchema = z.object({
  pickupStop: z.string().trim().min(1, "Pickup stop is required"),
  dropStop: z.string().trim().min(1, "Drop stop is required"),
  seatsRequested: z.coerce.number().int().min(1, "At least 1 seat is required").default(1),
  fare: z.coerce.number().min(0).default(0),
  notes: z.string().max(250).optional().or(z.literal("")),
});

export type OfferRideInput = z.infer<typeof offerRideSchema>;
export type RideRequestInput = z.infer<typeof rideRequestSchema>;
