import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import Vehicle from "@/models/Vehicle";
import User from "@/models/User"; // Ensure User model is loaded for populate

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const adminUsers = await User.find({ role: "admin" }).select("_id");
    const adminIds = adminUsers.map((u) => u._id);

    const vehicles = await Vehicle.find({ owner: { $nin: adminIds } })
      .populate("owner", "name email employeeId department phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      vehicles,
    });
  } catch (error: unknown) {
    console.error("Admin Vehicles GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch registered vehicles." },
      { status: 500 }
    );
  }
}
