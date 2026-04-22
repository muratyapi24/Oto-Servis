import { getLocations, getConsolidatedReport } from "@/lib/actions/location.actions";
import { LocationsClient } from "./LocationsClient";

export default async function LocationsPage() {
  const [locationsResult, reportResult] = await Promise.all([
    getLocations(),
    getConsolidatedReport(),
  ]);

  return (
    <LocationsClient
      locations={("locations" in locationsResult ? locationsResult.locations : undefined) ?? []}
      report={"totals" in reportResult && !("error" in reportResult) ? reportResult as any : null}
    />
  );
}
