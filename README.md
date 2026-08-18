# 🚗 Pro Park – Smart Corporate Mobility & Carpooling System

**Pro Park** is an enterprise-grade corporate ride-sharing and parking optimization platform built with Next.js 14, OpenStreetMap, Leaflet, OSRM routing, Nominatim geocoding, NextAuth, and MongoDB.

---

## 🌟 Key Features

### 🗺️ 100% Free & Open-Source Mapping Stack
- **Interactive OpenStreetMap + Leaflet:** Dynamic maps with custom HTML markers and bounds fitting.
- **OSRM Road Routing:** Precise road path polylines, driving distances (km), and estimated commute times (mins).
- **Nominatim Geocoding & Reverse Geocoding:** Address search with autocomplete and click-to-pick GPS coordinates.
- **Live Driver GPS Tracking:** Drivers broadcast real-time location (`navigator.geolocation.watchPosition`), while passengers see live moving markers.

### 👥 Corporate Ride Sharing & Carpooling
- **Offer a Ride:** Set starting origin, campus destination, and intermediate pickup/drop points with individual fares.
- **Smart Commute Direction:** Supports **Morning Pickups (To Campus)** and **Evening Drops (From Campus)**.
- **Continuous Live Seat Sync:** Real-time seat availability updates (`🔥 1 Seat Left!`, `🔴 Fully Booked`).
- **Custom Boarding Points:** Passengers can click anywhere on the OpenStreetMap route to request custom boarding points.
- **Real-Time In-App Notifications:** Passengers receive instant alerts when their driver starts the commute.

### 🛡️ Campus Administration Console
- **Employee Verification Desk:** Review and verify corporate credentials.
- **Fleet Verification Desk:** Verify employee vehicles, number plates, and registration documents.
- **Live Campus Rides Oversight:** Track all active and scheduled commutes with complete passenger manifests.

---

## 🚀 Tech Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Maps & Routing:** [Leaflet](https://leafletjs.com/), [OpenStreetMap](https://www.openstreetmap.org/), [OSRM](http://project-osrm.org/), [Nominatim](https://nominatim.openstreetmap.org/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Credentials & Google OAuth)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Validation:** [Zod](https://zod.dev/)

---

## ⚙️ Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Srivathsan-09/Pro-Park.git
cd Pro-Park
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/propark
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📦 Deployment to Vercel

1. Push this repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/new).
3. Set your environment variables (`MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
4. Click **Deploy**.

---

## 📄 License
MIT License. Built for Smart Corporate Mobility.
