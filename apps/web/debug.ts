import { prisma } from "@repo/database";

async function run() {
  try {
    const inv = await prisma.invoice.findFirst({
      where: { type: "PURCHASE" },
      orderBy: { createdAt: "desc" }
    });
    console.log("Latest Purchase Invoice:", inv);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
