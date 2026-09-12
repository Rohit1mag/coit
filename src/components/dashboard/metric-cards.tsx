import { AlertTriangle, Building2, ShieldX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCards({
  active,
  expiring,
  expired,
}: {
  active: number;
  expiring: number;
  expired: number;
}) {
  const cards = [
    {
      label: "Active vendors",
      value: active,
      hint: "Subcontractors on file",
      icon: Building2,
      className: "",
    },
    {
      label: "Expiring in 30 days",
      value: expiring,
      hint: "Renewals to chase this month",
      icon: AlertTriangle,
      className: "text-amber-700",
    },
    {
      label: "Expired",
      value: expired,
      hint: "No current coverage on file",
      icon: ShieldX,
      className: "text-red-700",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <Icon className={`size-4 ${card.className || "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <p className={`font-mono text-3xl font-semibold tracking-tight ${card.className}`}>
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
