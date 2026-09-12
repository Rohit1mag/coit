import { StatusBadge } from "@/components/status-badge";
import type { DocumentStatus } from "@/types/database";

const rows: { name: string; trade: string; expires: string; status: DocumentStatus }[] = [
  { name: "Valley Mechanical", trade: "HVAC", expires: "Nov 12, 2026", status: "valid" },
  { name: "Meridian Electric", trade: "Electrical", expires: "Oct 3, 2026", status: "expiring_soon" },
  { name: "ABC Roofing Systems", trade: "Roofing", expires: "Apr 27, 2024", status: "expired" },
];

export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_80px_-32px_rgba(23,32,56,0.45)]">
      <div className="flex items-center justify-between border-b bg-muted/60 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">Certificates · sample board</p>
        <span className="w-10" />
      </div>
      <div className="grid grid-cols-3 gap-3 border-b p-4">
        {[
          { label: "On file", value: "24" },
          { label: "Expiring in 30 days", value: "3" },
          { label: "Expired", value: "1" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border bg-background px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">{metric.label}</p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-tight">{metric.value}</p>
          </div>
        ))}
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="px-4 py-2.5 font-medium">Vendor</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Trade</th>
            <th className="px-4 py-2.5 font-medium">Expiration</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{row.name}</td>
              <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{row.trade}</td>
              <td className="px-4 py-3 font-mono text-xs sm:text-sm">{row.expires}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
