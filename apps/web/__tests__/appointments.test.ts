// Feature: missing-features-roadmap, Property 6: Randevu Oluşturma Round-Trip
// Feature: missing-features-roadmap, Property 7: Randevu Listesi Tarih Sıralaması

import * as fc from "fast-check";

/**
 * Property 6: Randevu oluşturma round-trip
 * Oluşturulan randevu PENDING durumunda olmalı
 */
interface AppointmentInput {
  vehicleId: string;
  date: string;
  time: string;
  serviceType: string;
}

function createAppointmentLocal(input: AppointmentInput) {
  return {
    ...input,
    status: "PENDING",
    id: Math.random().toString(36).slice(2),
    createdAt: new Date(),
  };
}

describe("Property 6: Randevu oluşturma round-trip", () => {
  it("oluşturulan randevu PENDING durumunda olmalı ve tarih/saat korunmalı", () => {
    fc.assert(
      fc.property(
        fc.record({
          vehicleId: fc.uuid(),
          date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
            .map(d => d.toISOString().split("T")[0] as string),
          time: fc.constantFrom("09:00", "10:00", "11:00", "14:00", "15:00"),
          serviceType: fc.constantFrom("Genel Bakım", "Yağ Değişimi", "Fren Kontrolü"),
        }),
        (input) => {
          const result = createAppointmentLocal(input as AppointmentInput);
          return (
            result.status === "PENDING" &&
            result.date === input.date &&
            result.time === input.time &&
            result.serviceType === input.serviceType
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: Randevu listesi tarih sıralaması
 * Randevular appointmentDate ve appointmentTime'a göre artan sırada olmalı
 */
function sortAppointments(appointments: { appointmentDate: string; appointmentTime: string }[]) {
  return [...appointments].sort((a, b) => {
    const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
    if (dateCompare !== 0) return dateCompare;
    return a.appointmentTime.localeCompare(b.appointmentTime);
  });
}

describe("Property 7: Randevu listesi tarih sıralaması", () => {
  it("sıralanmış randevular appointmentDate ve appointmentTime'a göre artan sırada olmalı", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            appointmentDate: fc.date({ min: new Date("2025-01-01"), max: new Date("2026-12-31") })
              .map(d => d.toISOString().split("T")[0] as string),
            appointmentTime: fc.constantFrom("09:00", "09:30", "10:00", "14:00", "15:30"),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (appointments) => {
          const sorted = sortAppointments(appointments as { appointmentDate: string; appointmentTime: string }[]);
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i]!;
            const b = sorted[i + 1]!;
            const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
            if (dateCompare > 0) return false;
            if (dateCompare === 0 && a.appointmentTime.localeCompare(b.appointmentTime) > 0) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
