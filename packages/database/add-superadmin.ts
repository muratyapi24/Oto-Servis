import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Super Admin kullanıcısı oluşturuluyor...");
  
  // Önce var mı kontrol et (Tekrar çalıştırmalarda hata vermesin)
  const existing = await prisma.user.findUnique({
    where: { email: 'superadmin@msotoservis.com' }
  });

  if (existing) {
    console.log("Super admin zaten mevcut:", existing.email);
    return;
  }

  const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@msotoservis.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      hasTwoFactor: true,
      isActive: true,
    },
  });

  console.log('✅ Super Admin eklendi:');
  console.log(`- E-Posta: ${admin.email}`);
  console.log(`- Şifre: SuperAdmin123!`);
  console.log(`- 2FA: Aktif`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
