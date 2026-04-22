const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  console.log("=== MS Oto Servis Login Testleri ===");

  // 1. Firma Admin Login
  try {
    console.log("\\n1. Firma Admin Login Testi Başladı...");
    await page.goto(`${baseUrl}/firma-giris`);
    await page.fill('input[placeholder*="E-posta"]', 'admin@bstoto.com');
    await page.fill('input[placeholder*="Şifre"]', '123456');
    await Promise.all([
      page.waitForNavigation({ url: '**/dashboard**', timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    console.log("✅ Firma Admin Girişi Başarılı!");
    passed++;

    // Logout
    await page.goto(`${baseUrl}/api/auth/signout?callbackUrl=/firma-giris`);
    await page.waitForURL('**/firma-giris**');
  } catch (e) {
    console.error("❌ Firma Admin Girişi Başarısız: " + e.message);
    failed++;
  }

  // 2. Usta Login
  try {
    console.log("\\n2. Usta Login Testi Başladı...");
    await page.goto(`${baseUrl}/firma-giris`);
    await page.fill('input[placeholder*="E-posta"]', 'usta1@firmaa.com');
    await page.fill('input[placeholder*="Şifre"]', '123456');
    await Promise.all([
      page.waitForNavigation({ url: '**/m/firma/panel**', timeout: 10000 }).catch(() => null),
      page.click('button[type="submit"]')
    ]);

    // Check if URL contains dashboard or m/firma
    if (page.url().includes('/dashboard') || page.url().includes('/m/firma')) {
      console.log("✅ Usta Girişi Başarılı! URL: " + page.url());
      passed++;
    } else {
      console.error("❌ Usta Girişi Başarısız. Kaldığı URL: " + page.url());
      failed++;
    }

    // Logout
    await page.goto(`${baseUrl}/api/auth/signout?callbackUrl=/firma-giris`);
    await page.waitForURL('**/firma-giris**');
  } catch (e) {
    console.error("❌ Usta Girişi Başarısız: " + e.message);
    failed++;
  }

  // 3. Müşteri Login
  try {
    console.log("\\n3. Müşteri Login Testi Başladı...");
    await page.goto(`${baseUrl}/musteri-giris`);

    // Verify it doesn't redirect
    if (page.url().includes('firma-giris')) {
      throw new Error('Musteri giris redirecting to firma-giris!');
    }

    await page.waitForSelector('#login-plate');
    await page.fill('#login-plate', '34 A 10');
    await page.fill('input[type="tel"]', '05009998871');

    await Promise.all([
      page.waitForNavigation({ url: '**/m/musteri/panel**', timeout: 10000 }).catch(() => null),
      page.click('button[type="submit"]')
    ]);

    if (page.url().includes('/m/musteri/panel')) {
      console.log("✅ Müşteri Girişi Başarılı! URL: " + page.url());
      passed++;
    } else {
      const errorText = await page.locator('.text-error').textContent().catch(() => 'Bilinmeyen Hata');
      console.error(`❌ Müşteri Girişi Başarısız. URL: ${page.url()} Hata: ${errorText}`);
      failed++;
    }

  } catch (e) {
    console.error("❌ Müşteri Girişi Başarısız: " + e.message);
    failed++;
  }

  console.log(`\\nTest Sonuçları: ${passed} Başarılı, ${failed} Başarısız`);
  await browser.close();

  if (failed > 0) process.exit(1);
})();
