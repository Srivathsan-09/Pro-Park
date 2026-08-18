import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/validations/auth.schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Validation
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message);
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    const { name, employeeId, email, phone, department, companyName, password } = validationResult.data;

    // 2. Connect Database
    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmpId = employeeId.toUpperCase().trim();

    // 3. Check duplicate Email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "An account already exists with this corporate email. Please sign in instead.",
          accountExists: true,
        },
        { status: 409 }
      );
    }

    // 4. Check duplicate Company ID / Employee ID
    const existingEmpId = await User.findOne({ employeeId: normalizedEmpId });
    if (existingEmpId) {
      return NextResponse.json(
        {
          success: false,
          error: "An account is already registered with this Company Employee ID.",
          accountExists: true,
        },
        { status: 409 }
      );
    }

    // 5. Hash Password securely
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 6. Create User (Default to employee, pending admin verification)
    const newUser = await User.create({
      name,
      employeeId: normalizedEmpId,
      email: normalizedEmail,
      phone,
      department,
      companyName: companyName || "Tech Mahindra",
      passwordHash,
      role: "employee",
      verificationStatus: "pending",
      isApproved: false,
    });

    // 7. Safe response
    return NextResponse.json(
      {
        success: true,
        message: "Registration successful! Your corporate account has been submitted for campus admin verification.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          employeeId: newUser.employeeId,
          email: newUser.email,
          department: newUser.department,
          role: newUser.role,
          verificationStatus: newUser.verificationStatus,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("❌ Registration API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during registration. Please try again later.",
      },
      { status: 500 }
    );
  }
}
