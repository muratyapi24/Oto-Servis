import { Prisma } from "@repo/database";

export async function getNextInvoiceNumber(
  tenantId: string,
  tx: Omit<
    Prisma.TransactionClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >
): Promise<string> {
  const year = new Date().getFullYear();

  const seqRows = await tx.$queryRaw<Array<{ id: string; lastSeq: number }>>`
    SELECT id, "lastSeq" FROM "InvoiceSequence"
    WHERE "tenantId" = ${tenantId} AND "year" = ${year}
    FOR UPDATE
  `;

  let newSeq: number;

  if (seqRows.length === 0) {
    newSeq = 1;
    await tx.$executeRaw`
      INSERT INTO "InvoiceSequence" (id, "tenantId", "year", "lastSeq")
      VALUES (gen_random_uuid(), ${tenantId}, ${year}, 1)
    `;
  } else {
    newSeq = (seqRows[0]?.lastSeq ?? 0) + 1;
    await tx.$executeRaw`
      UPDATE "InvoiceSequence"
      SET "lastSeq" = ${newSeq}
      WHERE "tenantId" = ${tenantId} AND "year" = ${year}
    `;
  }

  return `FAT-${year}-${String(newSeq).padStart(4, "0")}`;
}
