"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCustomerSchema, UpdateCustomerInput } from "@/lib/validations/customers";
import { updateCustomer } from "@/lib/actions/customer.actions";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_DETAIL,
  DASHBOARD_FORMS,
  DASHBOARD_MODAL,
  dashboardStatusBadgeClass,
  type DashboardStatusTone,
} from "@/lib/dashboard-ui-standards";
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

const STATUS_MAP: Record<string, { label: string; tone: DashboardStatusTone; icon: React.ReactNode }> = {
  PENDING: {
    label: "Bekliyor",
    tone: "neutral",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  IN_PROGRESS: {
    label: "İşlemde",
    tone: "info",
    icon: <Wrench className="w-3.5 h-3.5" />,
  },
  WAITING_APPROVAL: {
    label: "Onay Bekliyor",
    tone: "warning",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  COMPLETED: {
    label: "Tamamlandı",
    tone: "success",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  CANCELLED: {
    label: "İptal",
    tone: "danger",
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
  const s = STATUS_MAP[status] ?? { label: status, tone: "neutral" satisfies DashboardStatusTone, icon: null };
  return (
    <span className={dashboardStatusBadgeClass(s.tone, "px-2.5 py-1 text-xs")}>
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
      <div className={DASHBOARD_DETAIL.profileHeader}>
        <div className={DASHBOARD_DETAIL.profileIdentity}>
          <div className={DASHBOARD_DETAIL.profileAvatar}>
            {customer.type === "CORPORATE" ? (
              <Building2 className={DASHBOARD_DETAIL.profileIcon} />
            ) : (
              <User className={DASHBOARD_DETAIL.profileIcon} />
            )}
          </div>
          <div>
            <h2 className={DASHBOARD_DETAIL.profileTitle}>{displayName}</h2>
            <p className={DASHBOARD_DETAIL.profileMeta}>
              {customer.type === "CORPORATE" ? "Kurumsal Müşteri" : "Bireysel Müşteri"}
            </p>
          </div>
          {customer.isBlacklisted && (
            <span className={dashboardStatusBadgeClass("danger", "px-3 py-1 text-xs")}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Kara Liste
            </span>
          )}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className={DASHBOARD_ACTIONS.primaryButton}
        >
          <Edit2 className="w-4 h-4" />
          Düzenle
        </button>
      </div>

      {submitSuccess && (
        <div className={DASHBOARD_FORMS.alertSuccess}>
          <CheckCircle2 className="w-5 h-5" />
          {submitSuccess}
        </div>
      )}

      {/* ── Üst Grid: Bilgi Kartı + Finansal Özet ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Müşteri Bilgi Kartı */}
        <div className={`${DASHBOARD_DETAIL.infoCard} lg:col-span-2 space-y-4`}>
          <h3 className={DASHBOARD_DETAIL.sectionTitleRow}>
            <User className="w-4 h-4" /> İletişim Bilgileri
          </h3>
          <div className={DASHBOARD_DETAIL.infoRowsGrid}>
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
              <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} pt-2`}>
                <FileText className="w-4 h-4" /> Vergi Bilgileri
              </h3>
              <div className={DASHBOARD_DETAIL.infoRowsGrid}>
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
              <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} pt-2`}>
                <FileText className="w-4 h-4" /> Notlar
              </h3>
              <p className={`${DASHBOARD_DETAIL.notePanel} ${DASHBOARD_DETAIL.noteText}`}>{customer.notes}</p>
            </>
          )}
        </div>

        {/* Finansal Özet */}
        <div className="space-y-4">
          <div className={DASHBOARD_DETAIL.infoCard}>
            <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} mb-4`}>
              <CreditCard className="w-4 h-4" /> Finansal Özet
            </h3>
            <div className={DASHBOARD_DETAIL.financeMetricGroup}>
              <div className={DASHBOARD_DETAIL.financeMetricRow}>
                <span className={DASHBOARD_DETAIL.financeMetricLabel}>Bakiye</span>
                <span className={customer.balance > 0 ? DASHBOARD_DETAIL.financeMetricValueDanger : DASHBOARD_DETAIL.financeMetricValueSuccess}>
                  ₺{customer.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={DASHBOARD_DETAIL.financeMetricRow}>
                <span className={DASHBOARD_DETAIL.financeMetricLabel}>Toplam Fatura</span>
                <span className={DASHBOARD_DETAIL.financeMetricValue}>{customer._count.invoices}</span>
              </div>
              <div className={DASHBOARD_DETAIL.financeMetricRow}>
                <span className={DASHBOARD_DETAIL.financeMetricLabel}>Kayıtlı Araç</span>
                <span className={DASHBOARD_DETAIL.financeMetricValue}>{customer.vehicles.length}</span>
              </div>
              <div className={DASHBOARD_DETAIL.financeMetricRow}>
                <span className={DASHBOARD_DETAIL.financeMetricLabel}>Servis Kaydı</span>
                <span className={DASHBOARD_DETAIL.financeMetricValue}>{customer.serviceOrders.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Araç Listesi ── */}
      <div className={DASHBOARD_DETAIL.tableShell}>
        <div className={DASHBOARD_DETAIL.tableToolbarRow}>
          <Car className={DASHBOARD_DETAIL.tableTitleIcon} />
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Araçlar</h3>
          <span className={DASHBOARD_DETAIL.tableCount}>{customer.vehicles.length} araç</span>
        </div>
        {customer.vehicles.length === 0 ? (
          <div className={DASHBOARD_DETAIL.tableEmpty}>
            <Car className={DASHBOARD_DETAIL.tableEmptyIcon} />
            Kayıtlı araç bulunmuyor.
          </div>
        ) : (
          <div className={DASHBOARD_DETAIL.linkList}>
            {customer.vehicles.map((v) => (
              <Link
                key={v.id}
                href={`/dashboard/vehicles/${v.id}`}
                className={DASHBOARD_DETAIL.linkListRow}
              >
                <div className="flex items-center gap-3">
                  <span className={DASHBOARD_DETAIL.linkListPrimary}>{v.plate}</span>
                  <span className={DASHBOARD_DETAIL.linkListMeta}>
                    {v.brand} {v.model}
                    {v.year ? ` (${v.year})` : ""}
                  </span>
                </div>
                <span className={DASHBOARD_DETAIL.linkListAction}>Detay →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Servis Geçmişi ── */}
      <div className={DASHBOARD_DETAIL.tableShell}>
        <div className={DASHBOARD_DETAIL.tableToolbarRow}>
          <Wrench className={DASHBOARD_DETAIL.tableTitleIcon} />
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Servis Geçmişi</h3>
          <span className={DASHBOARD_DETAIL.tableCount}>{customer.serviceOrders.length} kayıt</span>
        </div>
        {customer.serviceOrders.length === 0 ? (
          <div className={DASHBOARD_DETAIL.tableEmpty}>
            <Wrench className={DASHBOARD_DETAIL.tableEmptyIcon} />
            Servis kaydı bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={DASHBOARD_DETAIL.tableHead}>
                <tr>
                  <th className={DASHBOARD_DETAIL.tableHeaderCell}>İş Emri</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCell}>Araç</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCell}>Tarih</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCell}>Durum</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellRight}>Tutar</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_DETAIL.tableBody}>
                {customer.serviceOrders.map((order) => (
                  <tr key={order.id} className={DASHBOARD_DETAIL.tableRow}>
                    <td className={DASHBOARD_DETAIL.tableCell}>
                      <Link
                        href={`/dashboard/services/${order.id}`}
                        className={DASHBOARD_DETAIL.relatedLink}
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className={`${DASHBOARD_DETAIL.tableCell} ${DASHBOARD_DETAIL.tableCellMuted}`}>
                      <span className={`${DASHBOARD_DETAIL.tableCellStrong} font-mono`}>{order.vehicle.plate}</span>
                      <span className={`${DASHBOARD_DETAIL.tableCellMutedSmall} ml-1`}>
                        {order.vehicle.brand} {order.vehicle.model}
                      </span>
                    </td>
                    <td className={`${DASHBOARD_DETAIL.tableCell} ${DASHBOARD_DETAIL.tableCellMutedSmall}`}>
                      {dayjs(order.receptionDate).locale("tr").format("DD MMM YYYY")}
                    </td>
                    <td className={DASHBOARD_DETAIL.tableCell}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className={`${DASHBOARD_DETAIL.tableCellRight} ${DASHBOARD_DETAIL.tableCellMoneyStrong}`}>
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
      <div className={DASHBOARD_DETAIL.tableShell}>
        <div className={DASHBOARD_DETAIL.tableToolbarRow}>
          <CreditCard className={DASHBOARD_DETAIL.tableTitleIcon} />
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Son Ödemeler</h3>
          <span className={DASHBOARD_DETAIL.tableCount}>Son {customer.payments.length} kayıt</span>
        </div>
        {customer.payments.length === 0 ? (
          <div className={DASHBOARD_DETAIL.tableEmpty}>
            <CreditCard className={DASHBOARD_DETAIL.tableEmptyIcon} />
            Ödeme kaydı bulunmuyor.
          </div>
        ) : (
          <div className={DASHBOARD_DETAIL.paymentList}>
            {customer.payments.map((p) => (
              <div key={p.id} className={DASHBOARD_DETAIL.paymentRow}>
                <div className="flex items-center gap-3">
                  <div className={DASHBOARD_DETAIL.paymentIcon}>
                    <CreditCard className={DASHBOARD_DETAIL.paymentIconGlyph} />
                  </div>
                  <div>
                    <p className={DASHBOARD_DETAIL.tableCellStrong}>
                      {PAYMENT_METHOD_MAP[p.paymentMethod] ?? p.paymentMethod}
                    </p>
                    {p.notes && <p className={DASHBOARD_DETAIL.tableCellMutedSmall}>{p.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={DASHBOARD_DETAIL.financeMetricValueSuccess}>
                    ₺{p.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className={DASHBOARD_DETAIL.tableCellMutedSmall}>
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
        <div className={`${DASHBOARD_MODAL.backdrop} backdrop-blur-sm`}>
          <div className={DASHBOARD_MODAL.dialogWide}>
            <div className={`${DASHBOARD_MODAL.header} sticky top-0 bg-surface-container-lowest z-10`}>
              <h2 className={DASHBOARD_ACTIONS.pageTitle}>Müşteri Bilgilerini Düzenle</h2>
              <button onClick={() => setEditOpen(false)} className={DASHBOARD_MODAL.closeButton}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {submitError && (
                <div className={DASHBOARD_FORMS.alertError}>
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {submitError}
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <input type="hidden" {...form.register("id")} />

                {/* Müşteri Tipi */}
                <div>
                  <label className={DASHBOARD_FORMS.label}>Müşteri Tipi</label>
                  <select
                    {...form.register("type")}
                    className={DASHBOARD_FORMS.select}
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

                <div className="pt-4 border-t border-outline-variant/20 flex justify-end gap-3 sticky bottom-0 bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className={DASHBOARD_ACTIONS.secondaryButton}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={DASHBOARD_FORMS.primaryButton}
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

const inputCls = DASHBOARD_FORMS.control;

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
    <div className={`${DASHBOARD_DETAIL.infoRow} ${className}`}>
      <span className={DASHBOARD_DETAIL.infoRowIcon}>{icon}</span>
      <div>
        <p className={DASHBOARD_DETAIL.infoRowLabel}>{label}</p>
        <p className={DASHBOARD_DETAIL.infoRowValue}>{value}</p>
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
      <label className={DASHBOARD_FORMS.label}>{label}</label>
      {children}
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}
