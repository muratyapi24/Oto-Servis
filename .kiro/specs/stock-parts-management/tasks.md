# Uygulama Görevleri

## Görev Listesi

- [x] 1. Veritabanı Şema Güncellemeleri
  - [x] 1.1 Yeni enum'ları ekle: `PurchaseOrderStatus`, `StockCountStatus`, `StockTransferStatus`
  - [x] 1.2 `PurchaseOrder` ve `PurchaseOrderItem` modellerini schema.prisma'ya ekle
  - [x] 1.3 `StockCount` ve `StockCountItem` modellerini schema.prisma'ya ekle
  - [x] 1.4 `StockTransfer` ve `StockTransferItem` modellerini schema.prisma'ya ekle
  - [x] 1.5 `StockMovement` modeline `purchaseOrderId`, `stockCountId`, `stockTransferId`, `locationId` alanlarını ekle
  - [x] 1.6 `Supplier` modeline `purchaseOrders` ilişkisini ekle
  - [x] 1.7 `Part` modeline `purchaseOrderItems`, `stockCountItems`, `stockTransferItems` ilişkilerini ekle
  - [x] 1.8 `Tenant` modeline yeni modellerin ilişkilerini ekle
  - [x] 1.9 `Location` modeline `StockCount`, `StockTransfer` ilişkilerini ekle
  - [x] 1.10 Prisma migration oluştur ve uygula

- [x] 2. Zod Validasyon Şemaları
  - [x] 2.1 `lib/validations/purchase-order.ts` oluştur — `createPurchaseOrderSchema`, `receiveItemsSchema`
  - [x] 2.2 `lib/validations/stock-count.ts` oluştur — `createStockCountSchema`, `updateStockCountItemSchema`
  - [x] 2.3 `lib/validations/stock-transfer.ts` oluştur — `createStockTransferSchema`

- [x] 3. Server Actions — Satın Alma Siparişi (PO)
  - [x] 3.1 `lib/actions/purchase-order.actions.ts` oluştur
  - [x] 3.2 `createPurchaseOrder` — PO oluştur, otomatik `poNumber` üret (PO-YYYY-NNNN), Prisma transaction
  - [x] 3.3 `sendPurchaseOrder` — DRAFT → SENT, Resend ile tedarikçiye e-posta gönder
  - [x] 3.4 `receivePurchaseOrder` — kısmi/tam teslim alım, `Part.currentStock` artır, `StockMovement` oluştur, `Supplier.balance` güncelle
  - [x] 3.5 `cancelPurchaseOrder` — CANCELLED durumuna geç, stok hareketi oluşturma
  - [x] 3.6 `getPurchaseOrders` — filtreli liste (status, supplierId, tarih aralığı)
  - [x] 3.7 `getPurchaseOrderById` — detay + kalemler + stok hareketleri

- [x] 4. Server Actions — Stok Sayım Modülü
  - [x] 4.1 `lib/actions/stock-count.actions.ts` oluştur
  - [x] 4.2 `createStockCount` — lokasyon/kategori filtreli Part listesinden `StockCountItem` kayıtları oluştur, `systemQuantity` snapshot al, aynı lokasyonda açık sayım varsa reddet
  - [x] 4.3 `updateStockCountItem` — fiili miktar güncelle, `difference` hesapla
  - [x] 4.4 `approveStockCount` — DRAFT → COMPLETED, fark olan her parça için `ADJUST` StockMovement oluştur, `Part.currentStock` güncelle (Prisma transaction)
  - [x] 4.5 `getStockCounts` — filtreli liste (status, locationId, tarih)
  - [x] 4.6 `getStockCountDetail` — sayım detayı + fark raporu

- [x] 5. Server Actions — Lokasyon Transferi
  - [x] 5.1 `lib/actions/stock-transfer.actions.ts` oluştur
  - [x] 5.2 `createStockTransfer` — kaynak stok yeterliliği kontrolü, `StockTransfer` + `StockTransferItem` oluştur, hedef lokasyon yöneticisine bildirim gönder
  - [x] 5.3 `approveStockTransfer` — PENDING → APPROVED → COMPLETED, kaynak `Part.currentStock` azalt, hedef `Part.currentStock` artır, çift `StockMovement` oluştur (Prisma transaction)
  - [x] 5.4 `rejectStockTransfer` — PENDING → REJECTED, talep sahibine bildirim gönder
  - [x] 5.5 `getStockTransfers` — filtreli liste (status, fromLocationId, toLocationId, tarih)

- [x] 6. Server Actions — inventory.actions.ts Genişletmeleri
  - [x] 6.1 `findPartByBarcode(barcode)` — `Part.partNumber` üzerinden arama, 500ms hedef
  - [x] 6.2 `quickStockEntry(partId, quantity, reason)` — barkod tarama sonrası hızlı IN hareketi, Inngest event tetikle
  - [x] 6.3 `returnPartFromService(data)` — servis → depo iadesi, IN hareketi, `reason: "Servis İadesi: #[id]"`
  - [x] 6.4 `returnPartToSupplier(data)` — tedarikçiye iade, OUT hareketi, `Supplier.balance` azalt, negatif stok koruması
  - [x] 6.5 `getStockValueReport(filters)` — kategori bazlı stok değer raporu
  - [x] 6.6 `getStockMovementReport(filters)` — tarih/parça/lokasyon/tip filtreli hareket geçmişi
  - [x] 6.7 `getTopUsedParts(dateRange, limit)` — en çok OUT hareketi olan ilk 20 parça
  - [x] 6.8 `getCriticalStockReport()` — `currentStock ≤ minStockLevel` olan parçalar + tedarikçi bilgisi
  - [x] 6.9 Mevcut stok değiştiren tüm action'lara Inngest `stock/movement.created` event tetikleyicisi ekle

- [x] 7. Inngest Job — Otomatik Reorder Kontrolü
  - [x] 7.1 `lib/inngest/functions/stock-reorder-check.ts` oluştur
  - [x] 7.2 `stock/movement.created` event'ini dinle
  - [x] 7.3 `Part.currentStock <= Part.minStockLevel` ve `minStockLevel > 0` kontrolü yap
  - [x] 7.4 Upstash Redis'te `reorder:alert:{tenantId}:{partId}` anahtarıyla 24 saatlik debounce uygula
  - [x] 7.5 `TENANT_ADMIN` ve `ACCOUNTANT` rollerine `Notification` kaydı oluştur
  - [x] 7.6 Tedarikçi bağlıysa taslak `PurchaseOrder` önerisi oluştur
  - [x] 7.7 Hata durumunda `AuditLog` kaydı oluştur, Inngest retry mekanizmasını kullan
  - [x] 7.8 Inngest client'a yeni fonksiyonu kaydet (`lib/inngest/client.ts`)

- [x] 8. SSE Genişletmesi — Gerçek Zamanlı Stok Güncellemeleri
  - [x] 8.1 `lib/sse.ts`'e `STOCK_UPDATED` event tipini ve `StockUpdatedPayload` interface'ini ekle
  - [x] 8.2 `app/api/sse/stock/route.ts` endpoint'ini oluştur (tenant bazlı SSE stream)
  - [x] 8.3 Stok değiştiren her Server Action'dan SSE event yayınla
  - [x] 8.4 Mobil uygulamada `lib/` altına SSE bağlantı hook'u ekle (`useStockSSE`)

- [x] 9. Web Bileşenleri — Barkod Tarama
  - [x] 9.1 `@zxing/library` paketini `apps/web`'e ekle
  - [x] 9.2 `components/dashboard/inventory/BarcodeScanner.tsx` oluştur — kamera modu + manuel fallback
  - [x] 9.3 Barkod tarama sonrası parça kartı gösterimi ve miktar onay formu
  - [x] 9.4 Mevcut inventory sayfasına "Barkod ile Stok Girişi" butonu ekle

- [x] 10. Web Bileşenleri — Satın Alma Siparişi UI
  - [x] 10.1 `app/(dashboard)/dashboard/inventory/purchase-orders/page.tsx` — PO listesi sayfası
  - [x] 10.2 `app/(dashboard)/dashboard/inventory/purchase-orders/new/page.tsx` — PO oluşturma formu
  - [x] 10.3 `app/(dashboard)/dashboard/inventory/purchase-orders/[id]/page.tsx` — PO detay + teslim alım
  - [x] 10.4 `components/dashboard/inventory/PurchaseOrderDialog.tsx` — PO form bileşeni
  - [x] 10.5 `components/dashboard/inventory/PurchaseOrderList.tsx` — PO liste bileşeni
  - [x] 10.6 PO PDF export (jsPDF + html2canvas)

- [x] 11. Web Bileşenleri — Stok Sayım UI
  - [x] 11.1 `app/(dashboard)/dashboard/inventory/stock-counts/page.tsx` — sayım listesi
  - [x] 11.2 `app/(dashboard)/dashboard/inventory/stock-counts/new/page.tsx` — yeni sayım başlat
  - [x] 11.3 `app/(dashboard)/dashboard/inventory/stock-counts/[id]/page.tsx` — sayım detay + onay
  - [x] 11.4 `components/dashboard/inventory/StockCountDialog.tsx` — sayım form bileşeni
  - [x] 11.5 `components/dashboard/inventory/StockCountList.tsx` — sayım liste bileşeni
  - [x] 11.6 Sayım fark raporu PDF export

- [x] 12. Web Bileşenleri — Lokasyon Transferi UI
  - [x] 12.1 `app/(dashboard)/dashboard/inventory/transfers/page.tsx` — transfer listesi
  - [x] 12.2 `app/(dashboard)/dashboard/inventory/transfers/new/page.tsx` — yeni transfer talebi
  - [x] 12.3 `app/(dashboard)/dashboard/inventory/transfers/[id]/page.tsx` — transfer detay + onay/red
  - [x] 12.4 `components/dashboard/inventory/StockTransferDialog.tsx` — transfer form bileşeni
  - [x] 12.5 `components/dashboard/inventory/TransferList.tsx` — transfer liste bileşeni

- [x] 13. Web Bileşenleri — Parça İade UI
  - [x] 13.1 `components/dashboard/inventory/ReturnDialog.tsx` — iade form bileşeni (servis→depo ve tedarikçi→depo)
  - [x] 13.2 Servis detay sayfasına "Parça İade Et" butonu entegrasyonu
  - [x] 13.3 Stok hareket geçmişinde iade filtresi

- [x] 14. Web Bileşenleri — Gelişmiş Raporlar UI
  - [x] 14.1 `app/(dashboard)/dashboard/inventory/reports/page.tsx` — raporlar sayfası
  - [x] 14.2 Stok değer raporu bileşeni (kategori bazlı gruplandırma, toplam değer)
  - [x] 14.3 Hareket geçmişi raporu bileşeni (tarih/parça/lokasyon/tip filtresi)
  - [x] 14.4 En çok kullanılan parçalar bileşeni (bar chart)
  - [x] 14.5 Kritik stok raporu bileşeni (tedarikçi bilgisi dahil)
  - [x] 14.6 PDF export (jsPDF) ve CSV export (papaparse) entegrasyonu
  - [x] 14.7 `papaparse` paketini `apps/web`'e ekle

- [x] 15. Mobil Uygulama — Barkod Tarama Entegrasyonu
  - [x] 15.1 Mevcut `apps/mobile/app/(firma)/barkod.tsx` sayfasını stok girişi akışıyla entegre et
  - [x] 15.2 Barkod tarama → parça arama → miktar girişi → stok güncelleme akışı
  - [x] 15.3 Tarama sonucu parça kartı gösterimi (ad, mevcut stok, birim fiyat)
  - [x] 15.4 "Parça bulunamadı" durumunda yeni parça oluşturma yönlendirmesi

- [x] 16. Mobil Uygulama — SSE Senkronizasyonu
  - [x] 16.1 `apps/mobile/lib/useStockSSE.ts` hook'u oluştur
  - [x] 16.2 SSE bağlantısı ile `STOCK_UPDATED` event'lerini dinle
  - [x] 16.3 TanStack React Query `['inventory', 'parts']` key'ini invalidate et
  - [x] 16.4 Zustand store'a offline stok cache ekle (`useInventoryStore`)
  - [x] 16.5 Çevrimdışı mod göstergesi ve yeniden bağlanma mantığı
  - [x] 16.6 Conflict resolution: sunucu değerini esas al, kullanıcıya bildirim göster

- [x] 17. Property-Based Testler (fast-check)
  - [x] 17.1 `apps/web/__tests__/stock-integrity.test.ts` oluştur
  - [x] 17.2 PBT: `∀ OUT hareketi → currentStock_sonra = currentStock_önce - miktar ≥ 0`
  - [x] 17.3 PBT: `∀ Transfer → kaynak_sonra + hedef_sonra = kaynak_önce + hedef_önce`
  - [x] 17.4 PBT: `∀ Sayım onayı → currentStock = actualQuantity`
  - [x] 17.5 PBT: `∀ StockMovement dizisi → currentStock = Σ(IN) - Σ(OUT) + Σ(ADJUST)`
  - [x] 17.6 Unit test: negatif stok koruması (OUT > currentStock → hata)
  - [x] 17.7 Unit test: 24 saatlik reorder debounce mantığı
  - [x] 17.8 Unit test: PO durum geçişleri (geçersiz geçişler reddedilmeli)
