import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-2">
        <Link href="/admin" className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview
        </Link>
        <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50 text-xs ml-2">
          Upcoming Module • Phase 4
        </Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Incident & Safety Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review employee dispute reports, safety escalations, and platform compliance audits.
        </p>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="text-center py-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3 ring-8 ring-rose-50/50">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            Safety & Incident Review Center Coming in Phase 4
          </CardTitle>
          <CardDescription className="max-w-md mx-auto text-sm text-slate-500 mt-2">
            In Phase 4, administrators will have an incident triage desk to investigate disputes, review user ratings, and take safety actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="border-t border-slate-100 p-6 flex justify-center bg-slate-50/50">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Return to Admin Overview
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
