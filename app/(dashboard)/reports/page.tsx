import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50 text-xs">
          Upcoming Module • Phase 4
        </Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Safety & Incident Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Confidential feedback, emergency reporting, and safety support for campus commuters.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="text-center py-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3 ring-8 ring-rose-50/50">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            Safety & Incident Center Coming in Phase 4
          </CardTitle>
          <CardDescription className="max-w-md mx-auto text-sm text-slate-500 mt-2">
            In Phase 4, employees can submit feedback, dispute ride incidents, and access emergency support.
          </CardDescription>
        </CardHeader>
        <CardContent className="border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-50/50">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
