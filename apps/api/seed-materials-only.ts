import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Seeding Materials Only...');

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
    if (!tenant) {
        console.error('❌ Tenant "demo" not found! Cannot seed materials.');
        return;
    }

    const commonMaterials = [
        { name: 'Cemento Gris Portland', unit: 'Bto 50kg', cost: 180, category: 'Obra Gris' },
        { name: 'Arena de Río', unit: 'm3', cost: 450, category: 'Obra Gris' },
        { name: 'Grava Triturada 3/4"', unit: 'm3', cost: 550, category: 'Obra Gris' },
        { name: 'Varilla Corrugada 3/8"', unit: 'Pza', cost: 150, category: 'Acero' },
        { name: 'Varilla Corrugada 1/2"', unit: 'Pza', cost: 260, category: 'Acero' },
        { name: 'Block de Concreto 15x20x40', unit: 'Pza', cost: 12, category: 'Muros' },
        { name: 'Tubo PVC Sanitario 4"', unit: 'Tramo 6m', cost: 350, category: 'Hidrosanitaria' },
        { name: 'Cable THW Calibre 12', unit: 'Caja 100m', cost: 1200, category: 'Eléctrica' },
        { name: 'Pintura Vinílica Blanca', unit: 'Cubeta 19L', cost: 1800, category: 'Acabados' }
    ];

    let addedCount = 0;
    for (const mat of commonMaterials) {
        const exists = await prisma.material.findFirst({
            where: { tenantId: tenant.id, name: mat.name }
        });

        if (!exists) {
            await prisma.material.create({
                data: {
                    tenantId: tenant.id,
                    name: mat.name,
                    unit: mat.unit,
                    costParam: mat.cost,
                    description: `Material categoria ${mat.category}`
                }
            });
            console.log(`   + Added: ${mat.name}`);
            addedCount++;
        } else {
            console.log(`   . Exists: ${mat.name}`);
        }
    }

    console.log(`✅ Materials Seeded. Added ${addedCount} new materials.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
