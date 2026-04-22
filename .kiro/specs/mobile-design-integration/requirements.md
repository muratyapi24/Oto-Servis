# Requirements Document — Mobile Design Integration

## Giriş

Bu özellik, `stitch_otoservis_pro_mobil/` klasöründeki Stitch HTML/Tailwind tasarım şablonlarını mevcut Expo React Native mobil uygulamasına (`apps/mobile/`) entegre etmeyi kapsar. MS Oto Servis platformunun mobil kanalı; firma (admin/usta) ve müşteri olmak üzere iki ayrı kullanıcı deneyimi sunar. Mevcut ekranlar temel/placeholder seviyesindedir; bu entegrasyon ile Stitch tasarım sistemi renk tokenları, tipografi ve bileşen standartları uygulanacak, eksik ekranlar oluşturulacak, yeni API endpoint'leri eklenecek ve veritabanı şeması genişletilecektir.

---

## Glossary

| Terim | Açıklama |
|-------|----------|
| `Mobile_App` | `apps/mobile/` dizinindeki Expo React Native uygulaması |
| `Firma_App` | `apps/mobile/app/(firma)/` altındaki admin/usta ekranları |
| `Musteri_App` | `apps/mobile/app/(musteri)/` altındaki müşteri ekranları |
| `Design_System` | Stitch tasarım tokenları (renkler, tipografi, border-radius) ile tanımlanan görsel standart |
| `Color_Token` | `primary: #00236f`, `primary-container: #1e3a8a`, `secondary: #006c49`, `secondary-container: #6cf8bb`, `surface: #f7f9fb`, `on-surface: #191c1e`, `error: #ba1a1a` |
| `No-Line Rule` | Bölüm sınırları için 1px border kullanılmaz; arka plan renk geçişleri kullanılır |
| `Glass Header` | `bg-white/80 backdrop-blur-md` ile oluşturulan yarı saydam header |
| `Navy Shadow` | `0 20px 25px -5px rgba(0, 35, 111, 0.05)` navy-tinted gölge |
| `Offline_Store` | `apps/mobile/lib/offline-store.ts` — AsyncStorage tabanlı önbellek |
| `Biometric_Auth` | `apps/mobile/lib/biometric.ts` — expo-local-authentication tabanlı biyometrik doğrulama |
| `Push_Service` | `apps/mobile/lib/notifications.ts` — Expo Notifications tabanlı push bildirim servisi |
| `API_Client` | `apps/mobile/lib/api.ts` — web uygulamasının `/api/mobile/*` endpoint'lerini tüketen HTTP istemcisi |
| `Wizard` | Çok adımlı form akışı (step-by-step) |
| `Checklist` | Usta tarafından doldurulan iş adımları listesi |
| `Onboarding` | Yeni müşterinin ilk giriş deneyimi |
| `Loyalty_Program` | Müşteri sadakat puanı ve tier sistemi (Bronze/Silver/Gold/Platinum) |
| `Barcode_Scanner` | Kamera ile barkod/QR okuma bileşeni (`apps/mobile/components/ServiceCamera.tsx`) |
| `DB_Migration` | Prisma schema değişikliği ve migration dosyası |
| `Tenant` | Çok kiracılı mimaride bir oto servis firması |
| `KPI Card` | Key Performance Indicator — temel metrik kartı |
| `Bento Grid` | Asimetrik, farklı boyutlarda kartlardan oluşan grid düzeni |

---

## Kullanıcı Rolleri ve Erişim

### Requirement 1

**User Story:** As a platform user, I want role-based access to the mobile app, so that I see only the screens and data relevant to my role.

#### Acceptance Criteria

1. WHEN a `TENANT_ADMIN` logs in THEN the system SHALL route them to `(firma)/panel` with full dashboard access
2. WHEN a `MECHANIC` logs in THEN the system SHALL route them to `(firma)/kuyruk` with their assigned work list
3. WHEN a `CUSTOMER` logs in THEN the system SHALL route them to `(musteri)/panel` with their vehicle and service data
4. WHEN an unauthenticated user opens the app THEN the system SHALL redirect them to `(auth)/login`
5. WHEN a user's session expires THEN the system SHALL redirect them to `(auth)/login` and clear local storage

---

## Tasarım Sistemi Gereksinimleri

### Requirement 2

**User Story:** As a developer, I want a centralized design token system, so that all screens use consistent colors, typography, and spacing.

#### Acceptance Criteria

1. WHEN any screen renders THEN the system SHALL use the Obsidian color palette tokens (`primary: #00236f`, `secondary: #006c49`, `surface: #f7f9fb`, `on-surface: #191c1e`, `error: #ba1a1a`)
2. WHEN any header renders THEN the system SHALL apply glass effect (`bg-white/80 backdrop-blur-md`) with navy-tinted shadow
3. WHEN any card renders THEN the system SHALL use XL/2XL border radius (12–24dp) and no 1px divider borders
4. WHEN any touch target renders THEN the system SHALL have minimum 48dp height/width for glove-friendly interaction
5. WHEN any text renders THEN the system SHALL use Inter font family and `on-surface (#191c1e)` color (never pure black)
6. WHEN any primary CTA button renders THEN the system SHALL apply `linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)`
7. WHEN any floating element renders THEN the system SHALL use navy-tinted shadow `0 20px 25px -5px rgba(0, 35, 111, 0.05)`
8. WHEN section boundaries are needed THEN the system SHALL use background color transitions instead of border lines

---

## Firma Platformu — Yeniden Tasarlanacak Ekranlar

### Requirement 3

**User Story:** As a `TENANT_ADMIN`, I want a redesigned dashboard with KPI bento grid, so that I can see the workshop's live status at a glance.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/panel` THEN the system SHALL display a glass header with the firm name and date
2. WHEN the panel loads THEN the system SHALL show 4 KPI cards: Günlük Ciro, Servisteki Araç, Bugün Tamamlanan, Kritik Uyarı
3. WHEN the panel loads THEN the system SHALL show a weekly performance bar chart
4. WHEN the panel loads THEN the system SHALL show a live workshop bay status grid (lift occupancy)
5. WHEN the panel loads THEN the system SHALL show a critical alerts section (stock warnings, pending approvals, overdue payments)
6. WHEN a period filter (Bugün/Bu Hafta/Bu Ay) is selected THEN the system SHALL update KPI values accordingly
7. WHEN the admin pulls to refresh THEN the system SHALL refetch all panel data

### Requirement 4

**User Story:** As a `MECHANIC`, I want a redesigned work queue screen, so that I can see my assigned jobs with priority indicators.

#### Acceptance Criteria

1. WHEN the mechanic opens `(firma)/kuyruk` THEN the system SHALL display a daily summary strip (Bekleyen/Devam Eden/Tamamlanan counts)
2. WHEN the queue loads THEN the system SHALL show a segmented control to filter by status (Bekleyen/Devam Edenler)
3. WHEN a job card renders THEN the system SHALL show a colored left border indicating priority (red=high, blue=normal)
4. WHEN a job card renders THEN the system SHALL show plate number, vehicle model, complaint, and assigned mechanic
5. WHEN a high-priority job card renders THEN the system SHALL show an "ACİL" badge
6. WHEN the mechanic taps "İşe Başla" THEN the system SHALL navigate to `(firma)/servis-detay/[id]`
7. WHEN the mechanic taps "Detay" THEN the system SHALL navigate to `(firma)/servis-detay/[id]`

### Requirement 5

**User Story:** As a `TENANT_ADMIN`, I want a redesigned financial summary screen, so that I can monitor daily income, expenses, and pending receivables.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/finans` THEN the system SHALL display a gradient income/expense hero card with daily net
2. WHEN the finans screen loads THEN the system SHALL show a weekly income/expense bar chart
3. WHEN the finans screen loads THEN the system SHALL show a pending receivables list with due dates and status badges
4. WHEN a receivable is overdue THEN the system SHALL highlight it with `error (#ba1a1a)` color and "Gecikmiş" badge
5. WHEN the admin taps "Hızlı Tahsilat Al" THEN the system SHALL navigate to `(firma)/tahsilat-ekle`

### Requirement 6

**User Story:** As a `TENANT_ADMIN`, I want a redesigned team management screen, so that I can see mechanic availability and performance.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/personel` THEN the system SHALL display a summary row (Aktif Usta, Açık İş, Ort. Yük)
2. WHEN the personel screen loads THEN the system SHALL show mechanic cards with avatar, name, specialties, and active job count
3. WHEN a mechanic card renders THEN the system SHALL show a status indicator (active/inactive)
4. WHEN the admin taps a mechanic card THEN the system SHALL navigate to `(firma)/personel/[id]`
5. WHEN a mechanic has an `avatarUrl` THEN the system SHALL display their photo; otherwise show initials avatar

### Requirement 7

**User Story:** As a `TENANT_ADMIN`, I want a redesigned stock screen, so that I can see critical stock alerts and recent movements.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/stok` THEN the system SHALL display critical stock items with red left-border cards
2. WHEN the stok screen loads THEN the system SHALL show recent stock movements with IN/OUT color coding
3. WHEN a part is below minimum stock level THEN the system SHALL show a warning badge with current/minimum counts
4. WHEN the admin taps a part THEN the system SHALL navigate to `(firma)/parca/[id]`
5. WHEN the admin taps "Barkod Tara" THEN the system SHALL navigate to `(firma)/barkod`

---

## Firma Platformu — Yeni Oluşturulacak Ekranlar

### Requirement 8

**User Story:** As a `MECHANIC`, I want an active job detail screen with inspection checklist, so that I can document my work step by step.

#### Acceptance Criteria

1. WHEN the mechanic opens `(firma)/servis-detay/[id]` THEN the system SHALL display vehicle info, complaint, and assigned mechanic
2. WHEN the detail screen loads THEN the system SHALL show an inspection checklist with checkable items
3. WHEN the mechanic checks an item THEN the system SHALL update the completion percentage in real time
4. WHEN the mechanic taps "İşi Kapat" THEN the system SHALL navigate to `(firma)/is-kapat/[id]`
5. WHEN the mechanic taps "Parça Talep Et" THEN the system SHALL navigate to `(firma)/parca-talep`

### Requirement 9

**User Story:** As a `MECHANIC`, I want a job closing and quality control screen, so that I can finalize work with quality notes.

#### Acceptance Criteria

1. WHEN the mechanic opens `(firma)/is-kapat/[id]` THEN the system SHALL display a quality control checklist
2. WHEN the mechanic fills quality notes THEN the system SHALL save `qualityCheckNotes` and `qualityCheckedAt` to the service order
3. WHEN the mechanic submits the form THEN the system SHALL update the service order status to `COMPLETED`
4. WHEN the job is closed THEN the system SHALL send a push notification to the customer

### Requirement 10

**User Story:** As a `TENANT_ADMIN`, I want an approval center screen, so that I can review and approve pending price quotes.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/onay` THEN the system SHALL list all service orders with `WAITING_APPROVAL` status
2. WHEN an approval card renders THEN the system SHALL show vehicle plate, total amount, and urgency indicator
3. WHEN the admin taps "Onayla" THEN the system SHALL update the service order status and notify the customer
4. WHEN the admin taps "Reddet" THEN the system SHALL prompt for a rejection reason before updating status

### Requirement 11

**User Story:** As a `MECHANIC`, I want a barcode scanner screen, so that I can quickly look up parts by scanning their barcode.

#### Acceptance Criteria

1. WHEN the mechanic opens `(firma)/barkod` THEN the system SHALL request camera permission
2. WHEN a barcode is scanned THEN the system SHALL search for the part by barcode and display results
3. WHEN a part is found THEN the system SHALL navigate to `(firma)/parca/[id]`
4. WHEN no part is found THEN the system SHALL show an error message with a manual search option

### Requirement 12

**User Story:** As a `TENANT_ADMIN`, I want warehouse and stock management screens, so that I can manage inventory across multiple depots.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/depolar` THEN the system SHALL list all warehouses with item counts
2. WHEN the admin opens `(firma)/depo/[id]` THEN the system SHALL show stock items for that warehouse
3. WHEN the admin opens `(firma)/parca-talep` THEN the system SHALL show a form to request parts from a warehouse
4. WHEN the admin opens `(firma)/stok-guncelle/[id]` THEN the system SHALL show a form to update stock quantity
5. WHEN the admin opens `(firma)/stok-hareketler` THEN the system SHALL show a paginated list of all stock movements

### Requirement 13

**User Story:** As a `TENANT_ADMIN`, I want personnel detail and performance screens, so that I can review individual mechanic metrics.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/personel/[id]` THEN the system SHALL show mechanic profile, specialties, and contact info
2. WHEN the admin opens `(firma)/personel-performans` THEN the system SHALL show performance metrics (completed jobs, avg time, rating)
3. WHEN the admin opens `(firma)/vardiya` THEN the system SHALL show a weekly shift calendar for all mechanics

### Requirement 14

**User Story:** As a `TENANT_ADMIN`, I want financial reporting screens, so that I can download and review monthly reports.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/gelir-raporu` THEN the system SHALL show monthly income breakdown by category
2. WHEN the admin opens `(firma)/servis-raporu` THEN the system SHALL show service operation metrics
3. WHEN the admin opens `(firma)/raporlar` THEN the system SHALL list downloadable reports with PDF export option
4. WHEN the admin taps "İndir" THEN the system SHALL generate and share a PDF report

### Requirement 15

**User Story:** As a `TENANT_ADMIN`, I want collection and invoice management screens, so that I can track payments and invoices.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/tahsilat-ekle` THEN the system SHALL show a form to record a new payment collection
2. WHEN the admin opens `(firma)/tahsilatlar` THEN the system SHALL show a paginated list of all collections
3. WHEN the admin opens `(firma)/tahsilat/[id]` THEN the system SHALL show collection detail with receipt
4. WHEN the admin opens `(firma)/fatura/[id]` THEN the system SHALL show detailed invoice with line items
5. WHEN the admin opens `(firma)/fatura-guncelle/[id]` THEN the system SHALL show an editable invoice form

### Requirement 16

**User Story:** As a `TENANT_ADMIN`, I want notification center, settings, and support screens, so that I can manage app preferences and get help.

#### Acceptance Criteria

1. WHEN the admin opens `(firma)/bildirimler` THEN the system SHALL show a list of all notifications with read/unread status
2. WHEN the admin opens `(firma)/ayarlar` THEN the system SHALL show app settings (language, notifications, biometrics)
3. WHEN the admin opens `(firma)/destek` THEN the system SHALL show FAQ and contact support options
4. WHEN the admin opens `(firma)/mesajlar` THEN the system SHALL show in-app messaging with mechanics/customers
5. WHEN the admin opens `(firma)/hizmetler` THEN the system SHALL show service catalog with prices

---

## Müşteri Platformu — Yeniden Tasarlanacak Ekranlar

### Requirement 17

**User Story:** As a `CUSTOMER`, I want a redesigned home screen with active service hero card, so that I can see my current service status at a glance.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/panel` THEN the system SHALL display a glass header with greeting and notification bell
2. WHEN the customer has an active service THEN the system SHALL show a hero card with plate, service type, progress bar, and estimated delivery
3. WHEN the customer has no active service THEN the system SHALL show a "Randevu Al" CTA card
4. WHEN the panel loads THEN the system SHALL show a 2x2 quick action grid (Randevu Al, Araç Ekle, Fatura Öde, Canlı Destek)
5. WHEN the panel loads THEN the system SHALL show recent transactions list
6. WHEN the customer pulls to refresh THEN the system SHALL refetch panel data

### Requirement 18

**User Story:** As a `CUSTOMER`, I want a redesigned live service tracking screen, so that I can follow my vehicle's service progress in real time.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/takip` THEN the system SHALL display active service orders with timeline progress
2. WHEN a service order renders THEN the system SHALL show status badge, completion percentage, and assigned mechanic
3. WHEN a service order has `WAITING_APPROVAL` status THEN the system SHALL show an approval banner with action buttons
4. WHEN the customer taps "Onayla" on an approval THEN the system SHALL call the approval API and update the UI
5. WHEN the customer taps a service order THEN the system SHALL navigate to `(musteri)/servis/[id]`

### Requirement 19

**User Story:** As a `CUSTOMER`, I want a redesigned service history screen, so that I can browse past services with search and filter.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/gecmis` THEN the system SHALL display a search bar and filter button
2. WHEN the history loads THEN the system SHALL show service cards with plate, vehicle model, service type, date, and total amount
3. WHEN the customer searches THEN the system SHALL filter results by plate or service type
4. WHEN the customer taps a service card THEN the system SHALL navigate to `(musteri)/servis/[id]`
5. WHEN a service is completed THEN the system SHALL show a "Tamamlandı" badge with `secondary-container` background

### Requirement 20

**User Story:** As a `CUSTOMER`, I want a redesigned 3-step appointment booking flow, so that I can easily schedule a service.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/randevu` THEN the system SHALL show a step indicator (1/3, 2/3, 3/3)
2. WHEN on step 1 THEN the system SHALL show vehicle selection from the customer's garage
3. WHEN on step 2 THEN the system SHALL show service type selection and date/time picker
4. WHEN on step 3 THEN the system SHALL show appointment summary with confirm button
5. WHEN the customer confirms THEN the system SHALL create the appointment and show a success screen
6. WHEN the customer taps "Geri" THEN the system SHALL go to the previous step without losing data

### Requirement 21

**User Story:** As a `CUSTOMER`, I want a redesigned profile screen with loyalty program, so that I can track my points and redeem rewards.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/profil` THEN the system SHALL display a hero card with membership tier badge and total points
2. WHEN the profile loads THEN the system SHALL show a progress bar toward the next tier
3. WHEN the profile loads THEN the system SHALL show a "Puan Nasıl Kazanılır?" guide section
4. WHEN the profile loads THEN the system SHALL show a rewards marketplace with redeemable items
5. WHEN the customer taps "Al" on a reward THEN the system SHALL check point balance and process redemption
6. WHEN the profile loads THEN the system SHALL show a QR code for in-store point earning

---

## Müşteri Platformu — Yeni Oluşturulacak Ekranlar

### Requirement 22

**User Story:** As a `CUSTOMER`, I want a service detail screen, so that I can see all information about a specific service order.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/servis/[id]` THEN the system SHALL show vehicle info, service type, mechanic, and status timeline
2. WHEN the service has documents THEN the system SHALL show a "Belgeler" section with downloadable files
3. WHEN the service is completed THEN the system SHALL show a rating prompt (1-5 stars)
4. WHEN the customer submits a rating THEN the system SHALL save a `ServiceRating` record

### Requirement 23

**User Story:** As a `CUSTOMER`, I want a 3-step vehicle registration flow, so that I can add new vehicles to my garage.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/arac-ekle` THEN the system SHALL show a 3-step wizard (Bilgiler, Belgeler, Onay)
2. WHEN on step 1 THEN the system SHALL show fields for plate, brand, model, year, and optional photo upload
3. WHEN on step 2 THEN the system SHALL show optional document upload (ruhsat, sigorta)
4. WHEN on step 3 THEN the system SHALL show vehicle summary with confirm button
5. WHEN the customer confirms THEN the system SHALL create the vehicle and navigate back to panel

### Requirement 24

**User Story:** As a `CUSTOMER`, I want payment screens, so that I can pay invoices directly from the mobile app.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/odeme` THEN the system SHALL show invoice details and payment method selection
2. WHEN the customer opens `(musteri)/odeme-taksit` THEN the system SHALL show installment plan options
3. WHEN the customer opens `(musteri)/makbuz/[id]` THEN the system SHALL show payment receipt with download option
4. WHEN the customer opens `(musteri)/kartlar` THEN the system SHALL show saved cards with add/remove options
5. WHEN the customer opens `(musteri)/odemeler` THEN the system SHALL show payment history

### Requirement 25

**User Story:** As a new `CUSTOMER`, I want an onboarding flow and SMS verification, so that I can set up my account on first launch.

#### Acceptance Criteria

1. WHEN a new customer opens the app for the first time THEN the system SHALL show `(musteri)/onboarding` with feature highlights
2. WHEN the customer registers THEN the system SHALL send an SMS verification code
3. WHEN the customer opens `(auth)/sms-dogrula` THEN the system SHALL show a 6-digit OTP input
4. WHEN the OTP is correct THEN the system SHALL complete registration and navigate to `(musteri)/panel`
5. WHEN the OTP is incorrect THEN the system SHALL show an error and allow retry

### Requirement 26

**User Story:** As a `CUSTOMER`, I want messaging, notification, and document screens, so that I can communicate with the workshop and access my files.

#### Acceptance Criteria

1. WHEN the customer opens `(musteri)/mesajlar` THEN the system SHALL show conversation threads with mechanics
2. WHEN the customer opens `(musteri)/bildirimler` THEN the system SHALL show all notifications with read/unread status
3. WHEN the customer opens `(musteri)/belgeler/[id]` THEN the system SHALL show service documents with download/share options

---

## Veritabanı Gereksinimleri

### Requirement 27

**User Story:** As a developer, I want the database schema extended with new fields and models, so that the mobile app can store all required data.

#### Acceptance Criteria

1. WHEN a `Vehicle` record is created THEN the system SHALL support an optional `imageUrl` field for vehicle photos
2. WHEN a `Mechanic` record is created THEN the system SHALL support `avatarUrl`, `shiftStart`, `shiftEnd`, `workDays`, and `dailyTarget` fields
3. WHEN a `ServiceOrder` is quality-checked THEN the system SHALL store `qualityCheckNotes`, `qualityCheckedAt`, and `qualityCheckedBy` fields
4. WHEN a `MaintenancePlan` is created THEN the system SHALL store `vehicleId`, `title`, `dueDate`, `dueMileage`, and `isCompleted` fields
5. WHEN a `ServiceRating` is submitted THEN the system SHALL store `serviceOrderId`, `customerId`, `rating` (1-5), and optional `comment`
6. WHEN any new model is created THEN the system SHALL include `tenantId` for multi-tenant isolation

---

## API Gereksinimleri

### Requirement 28

**User Story:** As a mobile developer, I want new API endpoints for all new screens, so that the mobile app can fetch and mutate data.

#### Acceptance Criteria

1. WHEN the mobile app calls `GET /api/mobile/firma/panel` THEN the system SHALL return KPI data, workshop bay status, and critical alerts
2. WHEN the mobile app calls `GET /api/mobile/firma/servis/[id]` THEN the system SHALL return full service order detail with checklist
3. WHEN the mobile app calls `PATCH /api/mobile/firma/servis/[id]/kapat` THEN the system SHALL update status to COMPLETED with quality notes
4. WHEN the mobile app calls `GET /api/mobile/firma/onay` THEN the system SHALL return all WAITING_APPROVAL orders
5. WHEN the mobile app calls `POST /api/mobile/firma/onay/[id]` THEN the system SHALL approve or reject the order
6. WHEN the mobile app calls `GET /api/mobile/firma/personel/[id]` THEN the system SHALL return mechanic detail with performance metrics
7. WHEN the mobile app calls `GET /api/mobile/firma/stok/hareketler` THEN the system SHALL return paginated stock movements
8. WHEN the mobile app calls `GET /api/mobile/musteri/servis/[id]` THEN the system SHALL return service detail for the authenticated customer
9. WHEN the mobile app calls `POST /api/mobile/musteri/servis/[id]/rating` THEN the system SHALL create a ServiceRating record
10. WHEN the mobile app calls `POST /api/mobile/musteri/arac` THEN the system SHALL create a new vehicle for the customer
11. WHEN the mobile app calls `GET /api/mobile/musteri/profil` THEN the system SHALL return customer profile with loyalty points and tier
12. WHEN any API endpoint is called THEN the system SHALL validate the JWT token and enforce tenant isolation
