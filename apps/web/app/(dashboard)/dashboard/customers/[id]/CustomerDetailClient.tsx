"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCustomerSchema, UpdateCustomerInput } from "@/lib/validations/customers";
import { updateCustomer } from "@/lib/actions/customer.actions";
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Car,
  Wrench,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  X,
  AlertCircle,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

type CustomerWithRelations = {
  id: string;
  type: "INDIVIDUAL" | "CORPORATE";
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string;
  secondaryPhone: string | null;
  taxOffice: string | null;
  taxNumber: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  notes: string | null;
  balance: number;
  isBlacklisted: boolean;
  vehicles: { id: string; plate: string; brand: string; model: string; year: number | null }[];
  serviceOrders: {
    id: string;
    orderNumber: number;
    status: string;
    receptionDate: string;
    totalAmount: number;
    vehicle: { plate: string; brand: string; model: string };
  }[];
  payments: {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    notes: string | null;
  }[];
  _count: { invoices: number };
};

const STATUS_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Bekliyor",
    className: "bg-gray-100 text-gray-700",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  IN_PROGRESS: {
    label: "İşlemde",
    className: "bg-blue-100 text-blue-800",
    icon: <Wrench className="w-3.5 h-3.5" />,
  },
  WAITING_APPROVAL: {
    label: "Onay Bekliyor",
    className: "bg-orange-100 text-orange-800",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  COMPLETED: {
    label: "Tamamlandı",
    className: "bg-green-100 text-green-800",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  CANCELLED: {
    label: "İptal",
    className: "bg-red-100 text-red-800",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Kartı",
  BANK_TRANSFER: "Banka Transferi",
  CHECK: "Çek",
  OTHER: "Diğer",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: "bg-gray-100 text-gray-700", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.className}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

export default function CustomerDetailClient({ customer }: { customer: CustomerWithRelations }) {
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const displayName =
    customer.type === "CORPORATE"
      ? customer.companyName ?? "—"
      : `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "—";

  const form = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      id: customer.id,
      type: customer.type,
      firstName: customer.firstName ?? "",
      lastName: customer.lastName ?? "",
      companyName: customer.companyName ?? "",
      contactPerson: customer.contactPerson ?? "",
      email: customer.email ?? "",
      phone: customer.phone,
      secondaryPhone: customer.secondaryPhone ?? "",
      taxOffice: customer.taxOffice ?? "",
      taxNumber: customer.taxNumber ?? "",
      city: customer.city ?? "",
      district: customer.district ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
    },
  });

  const watchedType = form.watch("type");

  async function onSubmit(data: UpdateCustomerInput) {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const res = await updateCustomer(data);
      if (res?.error) {
        setSubmitError(res.error);
      } else {
        setSubmitSuccess("Müşteri bilgileri güncellendi.");
        setEditOpen(false);
      }
    } catch {
      setSubmitError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Başlık Satırı ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            {customer.type === "CORPORATE" ? (
              <Building2 className="w-6 h-6 text-blue-700" />
            ) : (
              <User className="w-6 h-6 text-blue-700" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {customer.type === "CORPORATE" ? "Kurumsal Müşteri" : "Bireysel Müşteri"}
            </p>
          </div>
          {customer.isBlacklisted && (
            <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Kara Liste
            </span>
          )}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Edit2 className="w-4 h-4" />
          Düzenle
        </button>
      </div>

      {submitSuccess && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-xl p-4 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" />
          {submitSuccess}
        </div>
      )}

      {/* ── Üst Grid: Bilgi Kartı + Finansal Özet ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Müşteri Bilgi Kartı */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
            <User className="w-4 h-4" /> İletişim Bilgileri
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {customer.type === "CORPORATE" && customer.contactPerson && (
              <InfoRow icon={<User className="w-4 h-4" />} label="Yetkili Kişi" value={customer.contactPerson} />
            )}
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefon" value={customer.phone} />
            {customer.secondaryPhone && (
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Alt Telefon" value={customer.secondaryPhone} />
            )}
            {customer.email && (
              <InfoRow icon={<Mail className="w-4 h-4" />} label="E-Posta" value={customer.email} />
            )}
            {(customer.city || customer.district || customer.address) && (
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label="Adres"
                value={[customer.address, customer.district, customer.city].filter(Boolean).join(", ")}
                className="sm:col-span-2"
              />
            )}
          </div>

          {(customer.taxOffice || customer.taxNumber) && (
            <>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2 pt-2">
                <FileText className="w-4 h-4" /> Vergi Bilgileri
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {customer.taxOffice && (
                  <InfoRow icon={<FileText className="w-4 h-4" />} label="Vergi Dairesi" value={customer.taxOffice} />
                )}
                {customer.taxNumber && (
                  <InfoRow icon={<FileText className="w-4 h-4" />} label="VKN / TCKN" value={customer.taxNumber} />
                )}
              </div>
            </>
          )}

          {customer.notes && (
            <>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2 pt-2">
                <FileText className="w-4 h-4" /> Notlar
              </h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{customer.notes}</p>
            </>
          )}
        </div>

        {/* Finansal Özet */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Finansal Özet
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Bakiye</span>
                <span className={`text-lg font-bold font-mono ${customer.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                  ₺{customer.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Toplam Fatura</span>
                <span className="text-base font-bold text-gray-800">{customer._count.invoices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Kayıtlı Araç</span>
                <span className="text-base font-bold text-gray-800">{customer.vehicles.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Servis Kaydı</span>
                <span className="text-base font-bold text-gray-800">{customer.serviceOrders.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Araç Listesi ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
          <Car className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Araçlar</h3>
          <span className="ml-auto text-xs font-bold text-gray-400">{customer.vehicles.length} araç</span>
        </div>
        {customer.vehicles.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            <Car className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            Kayıtlı araç bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {customer.vehicles.map((v) => (
              <Link
                key={v.id}
                href={`/dashboard/vehicles/${v.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-900 text-base font-mono">{v.plate}</span>
                  <span className="text-sm text-gray-600">
                    {v.brand} {v.model}
                    {v.year ? ` (${v.year})` : ""}
                  </span>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">Detay →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Servis Geçmişi ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
          <Wrench className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Servis Geçmişi</h3>
          <span className="ml-auto text-xs font-bold text-gray-400">{customer.serviceOrders.length} kayıt</span>
        </div>
        {customer.serviceOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            Servis kaydı bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">İş Emri</th>
                  <th className="px-5 py-3 text-left">Araç</th>
                  <th className="px-5 py-3 text-left">Tarih</th>
                  <th className="px-5 py-3 text-left">Durum</th>
                  <th className="px-5 py-3 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.serviceOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/services/${order.id}`}
                        className="font-bold text-blue-700 hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      <span className="font-mono font-bold text-gray-800">{order.vehicle.plate}</span>
                      <span className="text-xs text-gray-400 ml-1">
                        {order.vehicle.brand} {order.vehicle.model}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {dayjs(order.receptionDate).locale("tr").format("DD MMM YYYY")}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-gray-800">
                      ₺{order.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Son Ödemeler ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
          <CreditCard className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Son Ödemeler</h3>
          <span className="ml-auto text-xs font-bold text-gray-400">Son {customer.payments.length} kayıt</span>
        </div>
        {customer.payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            Ödeme kaydı bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {customer.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {PAYMENT_METHOD_MAP[p.paymentMethod] ?? p.paymentMethod}
                    </p>
                    {p.notes && <p className="text-xs text-gray-400">{p.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-green-700">
                    ₺{p.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {dayjs(p.paymentDate).locale("tr").format("DD MMM YYYY")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Düzenleme Modalı ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Müşteri Bilgilerini Düzenle</h2>
              <button onClick={() => setEditOpen(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {submitError && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {submitError}
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <input type="hidden" {...form.register("id")} />

                {/* Müşteri Tipi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Tipi</label>
                  <select
                    {...form.register("type")}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary"
                  >
                    <option value="INDIVIDUAL">Şahıs (Bireysel)</option>
                    <option value="CORPORATE">Firma (Kurumsal)</option>
                  </select>
                </div>

                {/* Ad/Soyad veya Firma */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {watchedType === "INDIVIDUAL" ? (
                    <>
                      <FormField label="Ad *" error={form.formState.errors.firstName?.message}>
                        <input {...form.register("firstName")} className={inputCls} placeholder="Ad" />
                      </FormField>
                      <FormField label="Soyad *" error={form.formState.errors.lastName?.message}>
                        <input {...form.register("lastName")} className={inputCls} placeholder="Soyad" />
                      </FormField>
                    </>
                  ) : (
                    <>
                      <FormField label="Firma Ünvanı *" className="md:col-span-2" error={form.formState.errors.companyName?.message}>
                        <input {...form.register("companyName")} className={inputCls} placeholder="Tam şirket ünvanı" />
                      </FormField>
                      <FormField label="Yetkili Kişi" className="md:col-span-2">
                        <input {...form.register("contactPerson")} className={inputCls} placeholder="İlgili kişi" />
                      </FormField>
                    </>
                  )}
                </div>

                {/* İletişim */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Telefon *" error={form.formState.errors.phone?.message}>
                    <input {...form.register("phone")} className={inputCls} placeholder="05XX XXX XX XX" />
                  </FormField>
                  <FormField label="Alternatif Telefon">
                    <input {...form.register("secondaryPhone")} className={inputCls} placeholder="Opsiyonel" />
                  </FormField>
                  <FormField label="E-Posta" className="md:col-span-2" error={form.formState.errors.email?.message}>
                    <input type="email" {...form.register("email")} className={inputCls} placeholder="ornek@mail.com" />
                  </FormField>
                </div>

                {/* Vergi / Adres */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Vergi Dairesi">
                    <input {...form.register("taxOffice")} className={inputCls} />
                  </FormField>
                  <FormField label="VKN / TCKN">
                    <input {...form.register("taxNumber")} className={inputCls} />
                  </FormField>
                  <FormField label="İl">
                    <input {...form.register("city")} className={inputCls} />
                  </FormField>
                  <FormField label="İlçe">
                    <input {...form.register("district")} className={inputCls} />
                  </FormField>
                  <FormField label="Açık Adres" className="md:col-span-2">
                    <textarea {...form.register("address")} rows={2} className={inputCls} placeholder="Mahalle, sokak, no..." />
                  </FormField>
                  <FormField label="Notlar" className="md:col-span-2">
                    <textarea {...form.register("notes")} rows={3} className={inputCls} placeholder="Müşteri hakkında notlar..." />
                  </FormField>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-70"
                  >
                    {submitting ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Yardımcı bileşenler ──

const inputCls =
  "w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary";

function InfoRow({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
