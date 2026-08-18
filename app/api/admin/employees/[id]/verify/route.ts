import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/models/User";
import Vehicle from "@/models/Vehicle";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee identifier." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action, rejectionReason } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const isApprove = action === "approve";

    const updatedEmployee = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          verificationStatus: isApprove ? "approved" : "rejected",
          isApproved: isApprove,
          rejectionReason: isApprove ? "" : rejectionReason || "Rejected by administrator",
        },
      },
      { new: true }
    ).select("-passwordHash");

    if (!updatedEmployee) {
      return NextResponse.json(
        { success: false, error: "Employee account not found." },
        { status: 404 }
      );
    }

    // When an employee is approved, also automatically approve their registered fleet
    if (isApprove) {
      await Vehicle.updateMany(
        { owner: updatedEmployee._id },
        { $set: { verificationStatus: "approved", isApproved: true } }
      );
    }

    return NextResponse.json({
      success: true,
      message: isApprove
        ? `Employee ${updatedEmployee.name} has been verified and approved.`
        : `Employee ${updatedEmployee.name} verification status set to rejected.`,
      employee: updatedEmployee,
    });
  } catch (error: unknown) {
    console.error("Employee verification API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update employee verification status." },
      { status: 500 }
    );
  }
}
