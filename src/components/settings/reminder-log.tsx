import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ReminderLogRow = {
  id: string;
  alert_type: string;
  sent_on: string;
  sent_at?: string | null;
  recipients?: string[] | null;
  vendors: { name: string; contact_email?: string | null } | { name: string; contact_email?: string | null }[] | null;
};

function vendorRow(row: ReminderLogRow) {
  return Array.isArray(row.vendors) ? row.vendors[0] : row.vendors;
}

function vendorName(row: ReminderLogRow) {
  return vendorRow(row)?.name ?? "Unknown vendor";
}

function recipientsFor(row: ReminderLogRow) {
  if (row.recipients && row.recipients.length > 0) return row.recipients;
  return [vendorRow(row)?.contact_email].filter((email): email is string => Boolean(email));
}

function reminderLabel(type: string) {
  if (type === "expired") return "Expired";
  if (/^\d+$/.test(type)) return `${type} days left`;
  return type;
}

function formatWhen(row: ReminderLogRow) {
  const raw = row.sent_at || row.sent_on;
  try {
    return format(parseISO(raw), row.sent_at ? "MMM d, yyyy p" : "MMM d, yyyy");
  } catch {
    return row.sent_on;
  }
}

export function ReminderLog({ rows }: { rows: ReminderLogRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminder log</CardTitle>
        <CardDescription>
          Every expiration email we sent, and who received it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sent</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead>Recipients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No reminder emails yet. They go out on the daily check when a certificate hits a
                    reminder day and the sub has a contact email.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap font-mono text-sm">
                      {formatWhen(row)}
                    </TableCell>
                    <TableCell className="font-medium">{vendorName(row)}</TableCell>
                    <TableCell>{reminderLabel(row.alert_type)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {recipientsFor(row).join(", ") || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
