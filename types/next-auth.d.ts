import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "employee" | "admin";
      employeeId: string;
      department: string;
      verificationStatus: "pending" | "approved" | "rejected";
      isApproved: boolean;
      phone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "employee" | "admin";
    employeeId: string;
    department: string;
    verificationStatus: "pending" | "approved" | "rejected";
    isApproved: boolean;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "employee" | "admin";
    employeeId: string;
    department: string;
    verificationStatus: "pending" | "approved" | "rejected";
    isApproved: boolean;
    phone?: string;
  }
}
