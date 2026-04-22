-- AlterTable: StockMovement'e serviceItemId ekle ve serviceOrderId için FK kısıtlaması ekle
ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "serviceItemId" TEXT;

-- serviceOrderId zaten var, FK kısıtlaması ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'StockMovement_serviceOrderId_fkey'
      AND table_name = 'StockMovement'
  ) THEN
    ALTER TABLE "StockMovement"
      ADD CONSTRAINT "StockMovement_serviceOrderId_fkey"
      FOREIGN KEY ("serviceOrderId")
      REFERENCES "ServiceOrder"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
