/**
 * Meilisearch Senkronizasyon Yardımcıları
 * Server Action'lardan çağrılır — create/update/delete sonrası index güncellenir
 */

import { upsertDocument, deleteDocument, SearchIndexes } from "./search";

// Müşteri senkronizasyonu
export async function syncCustomer(customer: {
  id: string;
  tenantId: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  type: string;
}): Promise<void> {
  await upsertDocument(SearchIndexes.customers, {
    id: customer.id,
    tenantId: customer.tenantId,
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    companyName: customer.companyName ?? "",
    phone: customer.phone,
    email: customer.email ?? "",
    type: customer.type,
  });
}

export async function removeCustomer(id: string): Promise<void> {
  await deleteDocument(SearchIndexes.customers, id);
}

// Araç senkronizasyonu
export async function syncVehicle(vehicle: {
  id: string;
  tenantId: string;
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  chassisNo?: string | null;
}): Promise<void> {
  await upsertDocument(SearchIndexes.vehicles, {
    id: vehicle.id,
    tenantId: vehicle.tenantId,
    customerId: vehicle.customerId,
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    chassisNo: vehicle.chassisNo ?? "",
  });
}

// Parça senkronizasyonu
export async function syncPart(part: {
  id: string;
  tenantId: string;
  categoryId: string;
  partNumber: string;
  name: string;
  description?: string | null;
  brand?: string | null;
}): Promise<void> {
  await upsertDocument(SearchIndexes.parts, {
    id: part.id,
    tenantId: part.tenantId,
    categoryId: part.categoryId,
    partNumber: part.partNumber,
    name: part.name,
    description: part.description ?? "",
    brand: part.brand ?? "",
  });
}

// Servis emri senkronizasyonu
export async function syncServiceOrder(order: {
  id: string;
  tenantId: string;
  orderNumber: number;
  status: string;
  complaintDescription: string;
  vehiclePlate?: string;
}): Promise<void> {
  await upsertDocument(SearchIndexes.serviceOrders, {
    id: order.id,
    tenantId: order.tenantId,
    orderNumber: String(order.orderNumber),
    status: order.status,
    complaintDescription: order.complaintDescription,
    vehiclePlate: order.vehiclePlate ?? "",
  });
}
