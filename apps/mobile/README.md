# MS Oto Servis — Mobil Uygulama

React Native (Expo) ile geliştirilmiş iOS ve Android uygulaması.

## Kurulum

```bash
# Bağımlılıkları kur
pnpm install

# Ortam değişkenlerini ayarla
cp .env.example .env

# Geliştirme sunucusunu başlat
pnpm start
```

## Ekranlar

### Müşteri Portalı (`/(musteri)`)
- `panel` — Ana panel (araçlar, hatırlatmalar, hızlı işlemler)
- `takip` — Servis takip (aktif iş emirleri, ilerleme)
- `gecmis` — Servis geçmişi
- `randevu` — Randevu alma
- `profil` — Profil ve çıkış

### Firma/Usta Portalı (`/(firma)`)
- `panel` — Firma ana paneli (KPI, onay kuyruğu, stok uyarıları)
- `kuyruk` — Servis kuyruğu
- `araclar` — Servisteki araçlar
- `personel` — Usta/personel listesi
- `analiz` — Analitik

## Build

```bash
# Development build
eas build --profile development --platform android

# Production build
eas build --profile production --platform all

# Store'a gönder
eas submit --profile production
```

## Gereksinimler

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS: Xcode 15+ (Mac gerekli)
- Android: Android Studio
