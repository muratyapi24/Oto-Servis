import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { search, SearchIndexes } from "@/lib/search";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "all";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const tenantId = session.user.tenantId;

  try {
    if (type === "all") {
      // Tüm index'lerde paralel arama
      const [customers, vehicles, serviceOrders, parts] = await Promise.all([
        search(SearchIndexes.customers, query, tenantId, { limit: 5 }),
        search(SearchIndexes.vehicles, query, tenantId, { limit: 5 }),
        search(SearchIndexes.serviceOrders, query, tenantId, { limit: 5 }),
        search(SearchIndexes.parts, query, tenantId, { limit: 5 }),
      ]);

      return NextResponse.json({
        results: {
          customers: customers.hits,
          vehicles: vehicles.hits,
          serviceOrders: serviceOrders.hits,
          parts: parts.hits,
        },
        totals: {
          customers: customers.total,
          vehicles: vehicles.total,
          serviceOrders: serviceOrders.total,
          parts: parts.total,
        },
      });
    }

    // Belirli bir index'te arama
    const indexMap: Record<string, string> = {
      customers: SearchIndexes.customers,
      vehicles: SearchIndexes.vehicles,
      serviceOrders: SearchIndexes.serviceOrders,
      parts: SearchIndexes.parts,
    };

    const indexName = indexMap[type];
    if (!indexName) {
      return NextResponse.json({ error: "Geçersiz arama tipi" }, { status: 400 });
    }

    const result = await search(indexName, query, tenantId, { limit });
    return NextResponse.json({ results: result.hits, total: result.total });
  } catch {
    return NextResponse.json({ error: "Arama hatası" }, { status: 500 });
  }
}
