"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateVehicleSchema, UpdateVehicleInput } from "@/lib/validations/vehicles";
import { updateVehicle, updateVehicleImage } from "@/lib/actions/vehicle.actions";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_DETAIL,
  DASHBOARD_FORMS,
  DASHBOARD_MODAL,
  dashboardStatusBadgeClass,
  type DashboardStatusTone,
} from "@/lib/dashboard-ui-standards";
import {
  Car,
  Wrench,
  User,
  Building2,
  Phone,
  FileText,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  X,
  AlertCircle,
  Gauge,
  Palette,
  Hash,
  Fuel,
  Settings2,
  Camera,
  Upload,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import MaintenancePlansTab from "@/components/dashboard/vehicles/MaintenancePlansTab";

type VehicleWithRelations = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  chassisNo: string | null;
  engineNo: string | null;
  color: string | null;
  engineType: string | null;
  transmission: string | null;
  fuelType: string | null;
  mileage: number;
  driverName: string | null;
  driverPhone: string | null;
  insuranceCompany: string | null;
  policyNumber: string | null;
  registrationDate: string | null;
  notes: string | null;
  imageUrl: string | null;
  customer: {
    id: string;
    type: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string;
  };
  serviceOrders: {
    id: string;
    orderNumber: number;
    status: string;
    receptionDate: string;
    complaintDescription: string;
    totalAmount: number;
  }[];
  _count: { serviceOrders: number };
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

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, tone: "neutral" satisfies DashboardStatusTone, icon: null };
  return (
    <span className={dashboardStatusBadgeClass(s.tone, "px-2.5 py-1 text-xs")}>
      {s.icon}
      {s.label}
    </span>
  );
}

export default function VehicleDetailClient({ vehicle }: { vehicle: VehicleWithRelations }) {
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(vehicle.imageUrl);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customerName =
    vehicle.customer.type === "CORPORATE"
      ? vehicle.customer.companyName ?? "—"
      : `${vehicle.customer.firstName ?? ""} ${vehicle.customer.lastName ?? ""}`.trim() || "—";

  const totalServiceAmount = vehicle.serviceOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const form = useForm<UpdateVehicleInput>({
    resolver: zodResolver(updateVehicleSchema),
    defaultValues: {
      id: vehicle.id,
      customerId: vehicle.customer.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year ?? undefined,
      chassisNo: vehicle.chassisNo ?? "",
      engineNo: vehicle.engineNo ?? "",
      color: vehicle.color ?? "",
      engineType: vehicle.engineType ?? "",
      transmission: vehicle.transmission ?? "",
      fuelType: vehicle.fuelType ?? "",
      mileage: vehicle.mileage,
      driverName: vehicle.driverName ?? "",
      driverPhone: vehicle.driverPhone ?? "",
      insuranceCompany: vehicle.insuranceCompany ?? "",
      policyNumber: vehicle.policyNumber ?? "",
      notes: vehicle.notes ?? "",
    },
  });

  async function onSubmit(data: UpdateVehicleInput) {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const res = await updateVehicle(data);
      if (res?.error) {
        setSubmitError(res.error);
      } else {
        setSubmitSuccess("Araç bilgileri güncellendi.");
        setEditOpen(false);
      }
    } catch {
      setSubmitError("Beklenmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setImageError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        setImageError(err.error || "Yükleme başarısız.");
        return;
      }

      const { url } = await uploadRes.json();
      const updateRes = await updateVehicleImage(vehicle.id, url);
      if (updateRes.error) {
        setImageError(updateRes.error);
      } else {
        setImageUrl(url);
      }
    } catch {
      setImageError("Fotoğraf yüklenirken bir hata oluştu.");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Başlık Satırı ── */}
      <div className={DASHBOARD_DETAIL.profileHeader}>
        <div className={DASHBOARD_DETAIL.profileIdentity}>
          <div className={DASHBOARD_DETAIL.profileAvatar}>
            <Car className={DASHBOARD_DETAIL.profileIcon} />
          </div>
          <div>
            <h2 className={`${DASHBOARD_DETAIL.profileTitle} font-mono`}>{vehicle.plate}</h2>
            <p className={DASHBOARD_DETAIL.infoMeta}>
              {vehicle.brand} {vehicle.model}
              {vehicle.year ? ` · ${vehicle.year}` : ""}
            </p>
          </div>
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

      {/* ── Üst Grid: Teknik Bilgiler + Özet ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teknik Bilgi Kartı */}
        <div className={`${DASHBOARD_DETAIL.infoCard} lg:col-span-2 space-y-4`}>
          <h3 className={DASHBOARD_DETAIL.sectionTitleRow}>
            <Car className="w-4 h-4" /> Teknik Bilgiler
          </h3>
          <div className={DASHBOARD_DETAIL.infoRowsGrid}>
            <InfoRow icon={<Hash className="w-4 h-4" />} label="Plaka" value={vehicle.plate} />
            <InfoRow icon={<Car className="w-4 h-4" />} label="Marka / Model" value={`${vehicle.brand} ${vehicle.model}`} />
            {vehicle.year && (
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Yıl" value={String(vehicle.year)} />
            )}
            {vehicle.color && (
              <InfoRow icon={<Palette className="w-4 h-4" />} label="Renk" value={vehicle.color} />
            )}
            {vehicle.fuelType && (
              <InfoRow icon={<Fuel className="w-4 h-4" />} label="Yakıt Tipi" value={vehicle.fuelType} />
            )}
            {vehicle.transmission && (
              <InfoRow icon={<Settings2 className="w-4 h-4" />} label="Vites" value={vehicle.transmission} />
            )}
            {vehicle.engineType && (
              <InfoRow icon={<Settings2 className="w-4 h-4" />} label="Motor Tipi" value={vehicle.engineType} />
            )}
            <InfoRow
              icon={<Gauge className="w-4 h-4" />}
              label="Kilometre"
              value={`${vehicle.mileage.toLocaleString("tr-TR")} km`}
            />
            {vehicle.chassisNo && (
              <InfoRow icon={<Hash className="w-4 h-4" />} label="Şasi No" value={vehicle.chassisNo} />
            )}
            {vehicle.engineNo && (
              <InfoRow icon={<Hash className="w-4 h-4" />} label="Motor No" value={vehicle.engineNo} />
            )}
          </div>

          {(vehicle.insuranceCompany || vehicle.policyNumber) && (
            <>
              <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} pt-2`}>
                <Shield className="w-4 h-4" /> Sigorta Bilgileri
              </h3>
              <div className={DASHBOARD_DETAIL.infoRowsGrid}>
                {vehicle.insuranceCompany && (
                  <InfoRow icon={<Shield className="w-4 h-4" />} label="Sigorta Şirketi" value={vehicle.insuranceCompany} />
                )}
                {vehicle.policyNumber && (
                  <InfoRow icon={<FileText className="w-4 h-4" />} label="Poliçe No" value={vehicle.policyNumber} />
                )}
              </div>
            </>
          )}

          {vehicle.notes && (
            <>
              <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} pt-2`}>
                <FileText className="w-4 h-4" /> Notlar
              </h3>
              <p className={`${DASHBOARD_DETAIL.notePanel} ${DASHBOARD_DETAIL.noteText}`}>{vehicle.notes}</p>
            </>
          )}
        </div>

        {/* Sağ Kolon: Araç Fotoğrafı + Servis Özeti + Müşteri */}
        <div className="space-y-4">
          {/* Araç Fotoğrafı */}
          <div className={DASHBOARD_DETAIL.tableShell}>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-surface-container-low flex flex-col items-center justify-center gap-2">
                  <Car className="w-10 h-10 text-on-surface-variant/40" />
                  <span className="text-xs text-on-surface-variant font-medium">
                    {vehicle.brand.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              {imageError && (
                <p className="text-xs text-error mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {imageError}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className={`${DASHBOARD_ACTIONS.secondaryButton} w-full justify-center px-3 py-2 text-xs disabled:opacity-60`}
              >
                {imageUploading ? (
                  <>
                    <Upload className="w-3.5 h-3.5 animate-bounce" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    {imageUrl ? "Fotoğrafı Değiştir" : "Fotoğraf Yükle"}
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Servis Özeti */}
          <div className={DASHBOARD_DETAIL.infoCard}>
            <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} mb-4`}>
              <Wrench className="w-4 h-4" /> Servis Özeti
            </h3>
            <div className={DASHBOARD_DETAIL.financeMetricGroup}>
              <div className={DASHBOARD_DETAIL.financeMetricRow}>
                <span className={DASHBOARD_DETAIL.financeMetricLabel}>Toplam Servis</span>
                <span className={DASHBOARD_DETAIL.financeMetricValue}>{vehicle._count.serviceOrders}</span>
              </div>
              <div className={DASHBOARD_DETAIL.financeMetricRow}>
                <span className={DASHBOARD_DETAIL.financeMetricLabel}>Toplam Tutar</span>
                <span className={`${DASHBOARD_DETAIL.financeMetricValue} font-mono`}>
                  ₺{totalServiceAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Müşteri Bilgisi */}
          <div className={DASHBOARD_DETAIL.infoCard}>
            <h3 className={`${DASHBOARD_DETAIL.sectionTitleRow} mb-4`}>
              <User className="w-4 h-4" /> Araç Sahibi
            </h3>
            <Link
              href={`/dashboard/customers/${vehicle.customer.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {vehicle.customer.type === "CORPORATE" ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                  {customerName}
                </p>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {vehicle.customer.phone}
                </p>
              </div>
              <span className="text-xs text-on-surface-variant/70 group-hover:text-primary transition-colors ml-auto shrink-0">
                Detay →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Servis Geçmişi ── */}
      <div className={DASHBOARD_DETAIL.tableShell}>
        <div className={DASHBOARD_DETAIL.tableToolbarRow}>
          <Wrench className={DASHBOARD_DETAIL.tableTitleIcon} />
          <h3 className={DASHBOARD_DETAIL.tableTitle}>Servis Geçmişi</h3>
          <span className={DASHBOARD_DETAIL.tableCount}>{vehicle.serviceOrders.length} kayıt</span>
        </div>
        {vehicle.serviceOrders.length === 0 ? (
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
                  <th className={DASHBOARD_DETAIL.tableHeaderCell}>Şikayet</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCell}>Tarih</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCell}>Durum</th>
                  <th className={DASHBOARD_DETAIL.tableHeaderCellRight}>Tutar</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_DETAIL.tableBody}>
                {vehicle.serviceOrders.map((order) => (
                  <tr key={order.id} className={DASHBOARD_DETAIL.tableRow}>
                    <td className={DASHBOARD_DETAIL.tableCell}>
                      <Link
                        href={`/dashboard/services/${order.id}`}
                        className={DASHBOARD_DETAIL.relatedLink}
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className={`${DASHBOARD_DETAIL.tableCell} ${DASHBOARD_DETAIL.tableCellMuted} max-w-xs truncate`}>
                      {order.complaintDescription || "—"}
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

      {/* ── Bakım Planları ── */}
      <div className={DASHBOARD_DETAIL.infoCard}>
        <MaintenancePlansTab vehicleId={vehicle.id} />
      </div>

      {/* ── Düzenleme Modalı ── */}
      {editOpen && (
        <div className={`${DASHBOARD_MODAL.backdrop} backdrop-blur-sm`}>
          <div className={DASHBOARD_MODAL.dialogWide}>
            <div className={`${DASHBOARD_MODAL.header} sticky top-0 bg-surface-container-lowest z-10`}>
              <h2 className={DASHBOARD_ACTIONS.pageTitle}>Araç Bilgilerini Düzenle</h2>
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
                <input type="hidden" {...form.register("customerId")} />

                {/* Temel Bilgiler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Plaka *" error={form.formState.errors.plate?.message}>
                    <input {...form.register("plate")} className={inputCls} placeholder="34ABC123" />
                  </FormField>
                  <FormField label="Marka *" error={form.formState.errors.brand?.message}>
                    <input {...form.register("brand")} className={inputCls} placeholder="Toyota" />
                  </FormField>
                  <FormField label="Model *" error={form.formState.errors.model?.message}>
                    <input {...form.register("model")} className={inputCls} placeholder="Corolla" />
                  </FormField>
                  <FormField label="Yıl" error={form.formState.errors.year?.message}>
                    <input
                      type="number"
                      {...form.register("year", { valueAsNumber: true })}
                      className={inputCls}
                      placeholder="2020"
                    />
                  </FormField>
                  <FormField label="Renk">
                    <input {...form.register("color")} className={inputCls} placeholder="Beyaz" />
                  </FormField>
                  <FormField label="Yakıt Tipi">
                    <input {...form.register("fuelType")} className={inputCls} placeholder="Benzin / Dizel / LPG" />
                  </FormField>
                  <FormField label="Vites">
                    <input {...form.register("transmission")} className={inputCls} placeholder="Manuel / Otomatik" />
                  </FormField>
                  <FormField label="Motor Tipi">
                    <input {...form.register("engineType")} className={inputCls} placeholder="1.6 DOHC" />
                  </FormField>
                  <FormField label="Kilometre">
                    <input
                      type="number"
                      {...form.register("mileage", { valueAsNumber: true })}
                      className={inputCls}
                      placeholder="0"
                    />
                  </FormField>
                </div>

                {/* Şasi / Motor No */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Şasi No">
                    <input {...form.register("chassisNo")} className={inputCls} />
                  </FormField>
                  <FormField label="Motor No">
                    <input {...form.register("engineNo")} className={inputCls} />
                  </FormField>
                </div>

                {/* Sigorta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Sigorta Şirketi">
                    <input {...form.register("insuranceCompany")} className={inputCls} />
                  </FormField>
                  <FormField label="Poliçe No">
                    <input {...form.register("policyNumber")} className={inputCls} />
                  </FormField>
                </div>

                {/* Sürücü */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Sürücü Adı">
                    <input {...form.register("driverName")} className={inputCls} />
                  </FormField>
                  <FormField label="Sürücü Telefonu">
                    <input {...form.register("driverPhone")} className={inputCls} />
                  </FormField>
                </div>

                {/* Notlar */}
                <FormField label="Notlar">
                  <textarea {...form.register("notes")} rows={3} className={inputCls} placeholder="Araç hakkında notlar..." />
                </FormField>

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
