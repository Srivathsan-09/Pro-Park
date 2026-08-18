import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50">
      {/* Left Side: Clean Full Brand Logo Showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 bg-white border-r border-slate-200/80 relative overflow-hidden">
        {/* Subtle decorative background light green radial gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Full Pro Park Logo - Clean & Centered */}
        <div className="relative z-10 w-full max-w-lg flex items-center justify-center p-4">
          <img
            src="/images/logo.png"
            alt="PRO PARK — Smart Ride • Better Tomorrow"
            className="w-full h-auto object-contain max-h-[420px] drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      </div>

      {/* Right Side: Clean Green & White Form Container */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo Presentation */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 max-w-[260px]">
              <img
                src="/images/logo.png"
                alt="PRO PARK"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
