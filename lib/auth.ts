import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // 1. Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    // 2. Corporate Credentials Provider
    CredentialsProvider({
      name: "Corporate Credentials",
      credentials: {
        email: { label: "Corporate Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your corporate email and password.");
        }

        await connectToDatabase();

        const normalizedEmail = credentials.email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

        if (!user) {
          throw new Error("No account found with this corporate email address.");
        }

        if (!user.passwordHash) {
          throw new Error("This account was created with Google Sign-In. Please sign in with Google.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error("Invalid password. Please check your credentials.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
          department: user.department,
          phone: user.phone,
          role: user.role,
          verificationStatus: user.verificationStatus || (user.role === "admin" ? "approved" : "pending"),
          isApproved: user.isApproved ?? (user.role === "admin"),
          image: user.profileImage || "",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          if (!user.email) return false;

          const normalizedEmail = user.email.toLowerCase().trim();
          let dbUser = await User.findOne({ email: normalizedEmail });

          if (!dbUser) {
            // Generate a unique Company ID for first-time Google sign-ins
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const employeeId = `EMP-G${randomCode}`;

            dbUser = await User.create({
              name: user.name || "Corporate Employee",
              email: normalizedEmail,
              employeeId,
              department: "Engineering",
              phone: "",
              role: "employee",
              verificationStatus: "pending",
              isApproved: false,
              profileImage: user.image || "",
            });
          } else if (!dbUser.profileImage && user.image) {
            dbUser.profileImage = user.image;
            await dbUser.save();
          }

          // Populate user object so JWT callback receives latest verification details
          user.id = dbUser._id.toString();
          user.role = dbUser.role;
          user.employeeId = dbUser.employeeId;
          user.department = dbUser.department;
          user.phone = dbUser.phone;
          user.verificationStatus = dbUser.verificationStatus || "pending";
          user.isApproved = dbUser.isApproved || false;

          return true;
        } catch (error) {
          console.error("❌ Google OAuth signIn error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.department = user.department;
        token.phone = user.phone;
        token.verificationStatus = user.verificationStatus;
        token.isApproved = user.isApproved;
      }

      // Re-verify against MongoDB if token is pending approval or during dynamic update
      if (token.email && (token.verificationStatus !== "approved" || trigger === "update")) {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: token.email.toLowerCase() });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.employeeId = dbUser.employeeId;
            token.department = dbUser.department;
            token.phone = dbUser.phone;
            token.verificationStatus = dbUser.verificationStatus || (dbUser.role === "admin" ? "approved" : "pending");
            token.isApproved = dbUser.isApproved ?? (dbUser.role === "admin");
          }
        } catch (e) {
          console.error("JWT sync error:", e);
        }
      }

      // Support dynamic session update when profile is modified
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.department) token.department = session.department;
        if (session.phone) token.phone = session.phone;
        if (session.image) token.picture = session.image;
        if (session.verificationStatus) token.verificationStatus = session.verificationStatus;
        if (session.isApproved !== undefined) token.isApproved = session.isApproved;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "employee" | "admin") || "employee";
        session.user.employeeId = token.employeeId as string;
        session.user.department = token.department as string;
        session.user.phone = token.phone as string | undefined;
        session.user.verificationStatus = (token.verificationStatus as "pending" | "approved" | "rejected") || "pending";
        session.user.isApproved = Boolean(token.isApproved);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "propark_corporate_mobility_platform_super_secret_2026_key",
};
