import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getSystemSettings } from "@/lib/actions/superadmin.actions";

type ToggleSetting = { enabled?: boolean };
type SystemSettingsView = {
  autoScaling?: ToggleSetting;
  multiAZ?: ToggleSetting;
  shadowDBSync?: ToggleSetting;
  smtpGateway?: {
    host?: string;
    port?: string | number;
    protocol?: string;
  };
  twoFactorAuth?: {
    requiredForSuperAdmin?: boolean;
  };
  sessionTimeout?: {
    minutes?: string | number;
  };
};

export default async function SettingsPage(props: { searchParams?: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "general";

  const { settings, error } = await getSystemSettings();

  if (error) {
    return <div className="p-8 text-error font-mono">{error}</div>;
  }

  const s = (settings || {}) as SystemSettingsView;

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">settings</span>
            <h2 className="text-sm font-bold tracking-tight uppercase">Sistem Yapılandırma Merkezi</h2>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-highest text-on-surface rounded border border-outline/10 text-[10px] font-bold uppercase tracking-wider">
            SÜREÇ-IDX: 0x2A4
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase hover:bg-primary/90 transition-colors shadow-sm">
            Değişiklikleri Kaydet
          </button>
          <div className="h-4 w-px bg-outline/20"></div>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded transition-colors">
            <span className="material-symbols-outlined text-xl">help</span>
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        <Link href="?tab=general" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'general' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Genel Ayarlar</Link>
        <Link href="?tab=auth" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'auth' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Kimlik Doğrulama</Link>
        <Link href="?tab=database" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'database' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Veritabanı Kümesi</Link>
        <Link href="?tab=api" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'api' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>API Webhook'ları</Link>
        <Link href="?tab=localization" className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${tab === 'localization' ? 'font-bold border-b-2 border-primary text-primary bg-primary/5' : 'font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low'}`}>Yerelleştirme</Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {tab === "general" && (
          <div className="grid grid-cols-12 gap-4">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-7 space-y-4">
              <div className="config-card">
                <div className="config-header">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                    Çekirdek Motor Yapılandırması
                  </h4>
                  <span className="font-mono text-[10px] text-outline">ENGINE_V4.2</span>
                </div>
                <div className="config-section grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Sistem Tanımlayıcı (SID)</label>
                      <input className="form-input" readOnly type="text" value="BST-PROD-CLUSTER-001" />
                    </div>
                    <div>
                      <label className="form-label">Temel URL Ortamı</label>
                      <input className="form-input" placeholder="https://api.system.local" type="text" defaultValue="https://core-prod.bstservis.com" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Sunucu Ping Aralığı (Heartbeat)</label>
                      <div className="flex items-center gap-2">
                        <input className="form-input flex-1" type="number" defaultValue="30" />
                        <span className="text-[10px] font-bold text-outline">ms</span>
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Veri Saklama Politikası</label>
                      <select className="form-input w-full cursor-pointer">
                        <option>Standart (365 Gün)</option>
                        <option>Uyumluluk (7 Yıl)</option>
                        <option>Sıkı (90 Gün)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="config-card">
                <div className="config-header">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-secondary rounded-full"></span>
                    Varsayılan Firma Tedarik Ayarları
                  </h4>
                </div>
                <div className="config-section">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2 p-3 border border-outline/10 rounded bg-surface-container-low">
                      <span className="form-label mb-0">Otomatik Ölçeklendirme</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono">{s.autoScaling?.enabled ? 'AKTİF' : 'PASİF'}</span>
                        <button className={`toggle-switch ${s.autoScaling?.enabled ? 'bg-primary' : 'bg-outline/20'}`}>
                          <span className={`${s.autoScaling?.enabled ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}></span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-3 border border-outline/10 rounded bg-surface-container-low">
                      <span className="form-label mb-0">Çoklu-Bölge Kurulumu</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono">{s.multiAZ?.enabled ? 'AKTİF' : 'PASİF'}</span>
                        <button className={`toggle-switch ${s.multiAZ?.enabled ? 'bg-primary' : 'bg-outline/20'}`}>
                          <span className={`${s.multiAZ?.enabled ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}></span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-3 border border-outline/10 rounded bg-surface-container-low">
                      <span className="form-label mb-0">Yedek DB Senkronu</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono">{s.shadowDBSync?.enabled ? 'AKTİF' : 'PASİF'}</span>
                        <button className={`toggle-switch ${s.shadowDBSync?.enabled ? 'bg-primary' : 'bg-outline/20'}`}>
                          <span className={`${s.shadowDBSync?.enabled ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-5 space-y-4 flex flex-col">
              <div className="config-card">
                <div className="config-header">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-on-tertiary-fixed-variant">
                    <span className="material-symbols-outlined text-sm">notifications_active</span>
                    Bildirim Aktarıcısı
                  </h4>
                </div>
                <div className="config-section space-y-4">
                  <div>
                    <label className="form-label">SMTP Ağ Geçidi</label>
                    <input className="form-input" placeholder="smtp.sirket.com" type="text" defaultValue={s.smtpGateway?.host || "relay.bstservis.com"} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Port</label>
                      <input className="form-input" type="number" defaultValue={s.smtpGateway?.port || "587"} />
                    </div>
                    <div>
                      <label className="form-label">Protokol</label>
                      <select className="form-input cursor-pointer" defaultValue={s.smtpGateway?.protocol || "STARTTLS"}>
                        <option>STARTTLS</option>
                        <option>SSL/TLS</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-3 bg-tertiary-fixed/20 border border-tertiary-container/20 rounded mt-2">
                    <p className="text-[10px] text-on-tertiary-fixed-variant font-bold mb-1.5 flex items-center justify-between">
                      Durum: Servis Aktif
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span>
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-tertiary-container/10 rounded-full overflow-hidden">
                        <div className="h-full bg-tertiary-fixed-dim w-full"></div>
                      </div>
                      <span className="font-mono text-[9px] font-bold text-on-tertiary-fixed-variant">100%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-error/5 border border-error/20 rounded p-4 flex-grow mt-auto shadow-sm">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-error mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">dangerous</span>
                  Tehlikeli Alan
                </h4>
                <p className="text-[10px] text-outline mb-4 leading-tight">Bu işlemler geri alınamaz. Alt düzey sistem durumlarını değiştirirken son derece dikkatli olun.</p>
                <div className="space-y-2">
                  <button className="w-full py-1.5 border border-error text-error text-[10px] font-bold rounded uppercase hover:bg-error hover:text-white transition-all">Kümeyi Yeniden Başlat</button>
                  <button className="w-full py-1.5 bg-error text-white text-[10px] font-bold rounded uppercase hover:opacity-90 transition-all shadow-sm">Log Arşivini Temizle</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "auth" && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 space-y-4">
              <div className="config-card">
                <div className="config-header">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">security</span>
                    Güvenlik Protokolü
                  </h4>
                </div>
                <div className="config-section space-y-3">
                  <div className="flex items-center justify-between py-1 border-b border-outline/10 pb-3">
                    <div>
                      <p className="text-[11px] font-bold">İki Aşamalı Doğrulama (2FA)</p>
                      <p className="text-[9px] text-outline mt-0.5">Tüm süper yöneticiler için zorunlu kıl</p>
                    </div>
                    <button className={`toggle-switch ${s.twoFactorAuth?.requiredForSuperAdmin ? 'bg-primary' : 'bg-outline/20'}`}>
                      <span className={`${s.twoFactorAuth?.requiredForSuperAdmin ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}></span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-1 border-b border-outline/10 pb-3">
                    <div>
                      <p className="text-[11px] font-bold">Otomatik Oturum Kapatma</p>
                      <p className="text-[9px] text-outline mt-0.5">Pasif kullanıcıları {s.sessionTimeout?.minutes || 15} dakikada bir çıkar</p>
                    </div>
                    <button className="toggle-switch bg-primary">
                      <span className="translate-x-5 inline-block h-3 w-3 transform rounded-full bg-white transition-transform"></span>
                    </button>
                  </div>
                  
                  <div className="pt-1">
                    <label className="form-label">Parola Karmaşıklığı</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-primary-container text-white text-[9px] font-bold rounded cursor-pointer hover:opacity-90">Büyük Harf</span>
                      <span className="px-2 py-0.5 bg-primary-container text-white text-[9px] font-bold rounded cursor-pointer hover:opacity-90">Rakamlar</span>
                      <span className="px-2 py-0.5 bg-primary-container text-white text-[9px] font-bold rounded cursor-pointer hover:opacity-90">Semboller</span>
                      <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[9px] font-bold rounded cursor-pointer hover:bg-outline/20 opacity-50">Uzunluk 12+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "database" && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 space-y-4">
              <div className="config-card">
                <div className="config-header">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Ağ İzin Listesi (CIDR Blokları)</h4>
                  <button className="text-primary text-[10px] font-bold uppercase hover:underline">+ Kayıt Ekle</button>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low border-b border-outline/20">
                      <tr>
                        <th className="px-4 py-2 text-[9px] font-bold text-outline uppercase tracking-tighter w-1/3">CIDR Aralığı</th>
                        <th className="px-4 py-2 text-[9px] font-bold text-outline uppercase tracking-tighter flex-1">Etiket</th>
                        <th className="px-4 py-2 text-[9px] font-bold text-outline uppercase tracking-tighter text-right w-16">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10 font-mono text-[11px] bg-white">
                      <tr className="hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-2 font-medium">192.168.1.0/24</td>
                        <td className="px-4 py-2 text-outline">Şirket VPN</td>
                        <td className="px-4 py-2 text-right">
                          <button className="material-symbols-outlined text-sm text-error hover:text-error/80 transition-colors">delete</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-2 font-medium">10.0.0.0/8</td>
                        <td className="px-4 py-2 text-outline">Dahili Sunucu Kümesi</td>
                        <td className="px-4 py-2 text-right">
                          <button className="material-symbols-outlined text-sm text-error hover:text-error/80 transition-colors">delete</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "api" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest border border-outline/20 rounded">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
              <span className="material-symbols-outlined text-4xl text-outline/40">webhook</span>
            </div>
            <h3 className="text-lg font-bold font-mono tracking-tight text-on-surface mb-2">API Webhook'ları Yakında</h3>
            <p className="text-outline text-xs max-w-sm">
              Bu alan yapım aşamasındadır. Üçüncü parti sistemlerle (Muhasebe, CRM, SMS Servisleri) entegrasyon için webhook tetikleyicilerini buradan yapılandırabileceksiniz.
            </p>
          </div>
        )}

        {tab === "localization" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest border border-outline/20 rounded">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
              <span className="material-symbols-outlined text-4xl text-outline/40">language</span>
            </div>
            <h3 className="text-lg font-bold font-mono tracking-tight text-on-surface mb-2">Yerelleştirme (Localization) Ayarları Yakında</h3>
            <p className="text-outline text-xs max-w-sm">
              Bu alan yapım aşamasındadır. Platformun para birimi, dil varsayılanları ve tarih formatı ayarlarını bu alandan özelleştirebileceksiniz.
            </p>
          </div>
        )}

      </div>

      <SuperAdminFooter />
    </>
  );
}
