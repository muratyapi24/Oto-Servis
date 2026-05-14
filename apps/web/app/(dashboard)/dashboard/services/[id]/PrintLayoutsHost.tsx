"use client";

import type { Tenant } from "@repo/database";
import {
  InvoiceLayout,
  ServiceFormLayout,
  ServiceLabelLayout,
} from "./PrintLayouts";

interface PrintLayoutsHostProps {
  order: any;
  tenant: Tenant;
}

export default function PrintLayoutsHost({ order, tenant }: PrintLayoutsHostProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        pointerEvents: "none",
        zIndex: -1000,
      }}
    >
      <div id="print-service-form">
        <ServiceFormLayout order={order} tenant={tenant} />
      </div>
      <div id="print-invoice">
        <InvoiceLayout order={order} tenant={tenant} />
      </div>
      <div id="print-service-label">
        <ServiceLabelLayout order={order} tenant={tenant} />
      </div>
    </div>
  );
}
