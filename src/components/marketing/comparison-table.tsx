const rows = [
  {
    label: "Price",
    spreadsheet: "Free",
    subcertify: "$99/mo, on the site",
    mycoi: "Quote after a demo",
  },
  {
    label: "Start",
    spreadsheet: "Already have it",
    subcertify: "Signup today, 14-day trial",
    mycoi: "Sales call, usually annual",
  },
  {
    label: "Built for",
    spreadsheet: "A handful of PDFs",
    subcertify: "Small GC / PM office",
    mycoi: "Enterprise compliance program",
  },
  {
    label: "Vendor accounts",
    spreadsheet: "You chase the file",
    subcertify: "Subs upload via a link, no login",
    mycoi: "Vendor portal / onboarding",
  },
  {
    label: "Review",
    spreadsheet: "You",
    subcertify: "You confirm AI extract on a split-screen",
    mycoi: "Full compliance workflow",
  },
];

export function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-left text-sm">
          <caption className="sr-only">
            How SubCertify compares to a spreadsheet and myCOI
          </caption>
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                <span className="sr-only">Category</span>
              </th>
              <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                Spreadsheet
              </th>
              <th
                scope="col"
                className="bg-muted/50 px-4 py-3 font-medium text-foreground sm:px-5"
              >
                SubCertify
              </th>
              <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                myCOI
                <span className="mt-0.5 block font-normal text-muted-foreground">
                  now illumend
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <th
                  scope="row"
                  className="px-4 py-3.5 align-top font-medium sm:px-5"
                >
                  {row.label}
                </th>
                <td className="px-4 py-3.5 align-top text-muted-foreground sm:px-5">
                  {row.spreadsheet}
                </td>
                <td className="bg-muted/50 px-4 py-3.5 align-top font-medium sm:px-5">
                  {row.subcertify}
                </td>
                <td className="px-4 py-3.5 align-top text-muted-foreground sm:px-5">
                  {row.mycoi}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
        myCOI / illumend does not publish pricing. We don&apos;t invent their numbers.
      </p>
    </div>
  );
}
