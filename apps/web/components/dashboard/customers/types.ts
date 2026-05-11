export type CustomerListItem = {
  id: string;
  type: "INDIVIDUAL" | "CORPORATE";
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  balance: number;
  createdAt: Date | string;
  _count?: { vehicles: number };
  vehicles?: Array<{
    id: string;
    plate: string;
    brand: string;
    model: string;
  }>;
};

export function getCustomerDisplayName(customer: Pick<CustomerListItem, "type" | "firstName" | "lastName" | "companyName">) {
  return customer.type === "INDIVIDUAL"
    ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
    : customer.companyName ?? "";
}
