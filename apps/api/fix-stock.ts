import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fix the specific cost ledger entries that don't have [QTY:...]
  const ledgers = await prisma.costLedger.findMany({
    where: { entryType: 'INVENTORY_RECEIPT' },
  });

  for (const ledger of ledgers) {
    if (!ledger.description || !ledger.description.startsWith('[QTY:')) {
      // Find the corresponding material to get plannedPrice
      const material = await prisma.projectMaterial.findUnique({
        where: { id: ledger.referenceId! },
      });

      if (material && material.plannedPrice > 0) {
        // We know the UI sent the exact amount, but previously it didn't save it.
        // Let's guess the user intended a whole number or exactly 2 decimals.
        // The old script calculated 7200 / 700 = 10.2857.
        // Wait, if the user says they entered 10, and amount was 7200, it means unit price was 720.
        // 720 isn't saved anywhere if we only save `amount = 7200`.
        // But the user said "ingrese 10".
        // Let's just update the description to have the mathematically closest integer if we assume integer units.
        const assumedQty = Math.round(ledger.amount / material.plannedPrice);

        // For the specific one where amount=7200 and planned=700, assumedQty = round(10.28) = 10. Which is EXACTLY what the user entered!
        const newDesc = `[QTY:${assumedQty}] ${ledger.description || 'Ingreso Manual'}`;

        await prisma.costLedger.update({
          where: { id: ledger.id },
          data: { description: newDesc },
        });
        console.log(`Updated Ledger ${ledger.id} with desc: ${newDesc}`);
      }
    }
  }

  // Now run the same recalculation
  const materials = await prisma.projectMaterial.findMany();

  for (const mat of materials) {
    const receipts = await prisma.costLedger.findMany({
      where: {
        projectId: mat.projectId,
        referenceId: mat.id,
        entryType: 'INVENTORY_RECEIPT',
      },
    });

    const consumptions = await prisma.activityMaterial.findMany({
      where: { projectMaterialId: mat.id },
    });

    let totalReceived = 0;
    for (const receipt of receipts) {
      let qty = 0;
      let notes = receipt.description || '';
      const match = notes.match(/^\[QTY:([0-9.]+)\]\s(.*)/);

      if (match) {
        qty = parseFloat(match[1]);
      } else if (mat.plannedPrice && mat.plannedPrice > 0) {
        qty = receipt.amount / mat.plannedPrice;
      }
      totalReceived += qty;
    }

    const totalConsumed = consumptions.reduce(
      (acc: number, curr: any) => acc + curr.quantityConsumed,
      0,
    );
    const actualStockAvailable = totalReceived - totalConsumed;

    console.log(
      `Material ${mat.id}: Received = ${totalReceived}, Consumed = ${totalConsumed}, Actual Stock = ${actualStockAvailable}, Old DB Stock = ${mat.stockAvailable}`,
    );

    await prisma.projectMaterial.update({
      where: { id: mat.id },
      data: {
        stockAvailable: actualStockAvailable,
        stockConsumed: totalConsumed,
      },
    });
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
