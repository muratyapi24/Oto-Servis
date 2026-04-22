"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateVehicleSchema, UpdateVehicleInput } from "@/lib/validations/vehicles";
import { updateVehicle, updateVehicleImage } from "@/lib/actions/vehicle.actions";
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

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: "bg-gray-100 text-gray-700", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.className}`}>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-mono">{vehicle.plate}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {vehicle.brand} {vehicle.model}
              {vehicle.year ? ` · ${vehicle.year}` : ""}
            </p>
          </div>
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

      {/* ── Üst Grid: Teknik Bilgiler + Özet ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teknik Bilgi Kartı */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
            <Car className="w-4 h-4" /> Teknik Bilgiler
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2 pt-2">
                <Shield className="w-4 h-4" /> Sigorta Bilgileri
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2 pt-2">
                <FileText className="w-4 h-4" /> Notlar
              </h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{vehicle.notes}</p>
            </>
          )}
        </div>

        {/* Sağ Kolon: Araç Fotoğrafı + Servis Özeti + Müşteri */}
        <div className="space-y-4">
          {/* Araç Fotoğrafı */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
                <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-2">
                  <Car className="w-10 h-10 text-gray-300" />
                  <span className="text-xs text-gray-400 font-medium">
                    {vehicle.brand.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              {imageError && (
                <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
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
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Servis Özeti
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Toplam Servis</span>
                <span className="text-lg font-bold text-gray-800">{vehicle._count.serviceOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Toplam Tutar</span>
                <span className="text-base font-bold font-mono text-gray-800">
                  ₺{totalServiceAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Müşteri Bilgisi */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Araç Sahibi
            </h3>
            <Link
              href={`/dashboard/customers/${vehicle.customer.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                {vehicle.customer.type === "CORPORATE" ? (
                  <Building2 className="w-4 h-4 text-blue-700" />
                ) : (
                  <User className="w-4 h-4 text-blue-700" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                  {customerName}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {vehicle.customer.phone}
                </p>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors ml-auto shrink-0">
                Detay →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Servis Geçmişi ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
          <Wrench className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Servis Geçmişi</h3>
          <span className="ml-auto text-xs font-bold text-gray-400">{vehicle.serviceOrders.length} kayıt</span>
        </div>
        {vehicle.serviceOrders.length === 0 ? (
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
                  <th className="px-5 py-3 text-left">Şikayet</th>
                  <th className="px-5 py-3 text-left">Tarih</th>
                  <th className="px-5 py-3 text-left">Durum</th>
                  <th className="px-5 py-3 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicle.serviceOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/services/${order.id}`}
                        className="font-bold text-blue-700 hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                      {order.complaintDescription || "—"}
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

      {/* ── Bakım Planları ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <MaintenancePlansTab vehicleId={vehicle.id} />
      </div>

      {/* ── Düzenleme Modalı ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Araç Bilgilerini Düzenle</h2>
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
