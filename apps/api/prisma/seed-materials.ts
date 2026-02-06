import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const commonMaterials = [
    // === CIMENTACIÓN Y ESTRUCTURA (Obra Gris) ===
    { name: 'Cemento Gris Portland', unit: 'Bto 50kg', cost: 180, category: 'Obra Gris' },
    { name: 'Arena de Río', unit: 'm3', cost: 450, category: 'Obra Gris' },
    { name: 'Grava Triturada 3/4"', unit: 'm3', cost: 550, category: 'Obra Gris' },
    { name: 'Varilla Corrugada 3/8"', unit: 'Pza', cost: 150, category: 'Acero' },
    { name: 'Varilla Corrugada 1/2"', unit: 'Pza', cost: 260, category: 'Acero' },
    { name: 'Alambre Recocido No. 16', unit: 'Kg', cost: 35, category: 'Acero' },
    { name: 'Alambrón 1/4"', unit: 'Kg', cost: 32, category: 'Acero' },
    { name: 'Malla Electrosoldada 6-6/10-10', unit: 'm2', cost: 45, category: 'Acero' },
    { name: 'Block de Concreto 15x20x40', unit: 'Pza', cost: 12, category: 'Muros' },
    { name: 'Tabique Rojo Recocido', unit: 'Millar', cost: 3500, category: 'Muros' },
    { name: 'Cal Hidratada', unit: 'Bto 25kg', cost: 80, category: 'Obra Gris' },
    { name: 'Yeso Construcción', unit: 'Bto 40kg', cost: 120, category: 'Acabados' },
    { name: 'Agua (Pipa 10,000L)', unit: 'Viaje', cost: 1200, category: 'Servicios' },
    
    // === INSTALACIONES HIDROSANITARIAS ===
    { name: 'Tubo PVC Sanitario 4"', unit: 'Tramo 6m', cost: 350, category: 'Hidrosanitaria' },
    { name: 'Tubo PVC Hidráulico 1/2"', unit: 'Tramo 6m', cost: 90, category: 'Hidrosanitaria' },
    { name: 'Codo PVC 90° 4"', unit: 'Pza', cost: 25, category: 'Hidrosanitaria' },
    { name: 'Tubo Cobre Tipo M 1/2"', unit: 'Tramo', cost: 450, category: 'Hidrosanitaria' },
    { name: 'Soldadura 50/50', unit: 'Rollo', cost: 350, category: 'Hidrosanitaria' },
    { name: 'Pasta para Soldar', unit: 'Lata', cost: 60, category: 'Hidrosanitaria' },

    // === INSTALACIONES ELÉCTRICAS ===
    { name: 'Cable THW Calibre 12', unit: 'Caja 100m', cost: 1200, category: 'Eléctrica' },
    { name: 'Cable THW Calibre 10', unit: 'Caja 100m', cost: 1800, category: 'Eléctrica' },
    { name: 'Tubo Conduit Pared Delgada 1/2"', unit: 'Tramo 3m', cost: 85, category: 'Eléctrica' },
    { name: 'Chalupa Galvanizada', unit: 'Pza', cost: 12, category: 'Eléctrica' },
    { name: 'Caja Cuadrada 4x4', unit: 'Pza', cost: 18, category: 'Eléctrica' },
    { name: 'Centro de Carga 2 Polos', unit: 'Pza', cost: 450, category: 'Eléctrica' },

    // === ACABADOS ===
    { name: 'Piso Cerámico 60x60 Beige', unit: 'm2', cost: 280, category: 'Acabados' },
    { name: 'Pegazulejo', unit: 'Bto 20kg', cost: 110, category: 'Acabados' },
    { name: 'Boquilla Sin Arena', unit: 'Caja 5kg', cost: 85, category: 'Acabados' },
    { name: 'Pintura Vinílica Blanca (Cubeta)', unit: 'Cubeta 19L', cost: 1800, category: 'Acabados' },
    { name: 'Impermeabilizante Acrílico 5 años', unit: 'Cubeta 19L', cost: 2200, category: 'Acabados' },

    // === CARPINTERÍA Y HERRERÍA ===
    { name: 'Puerta Tambor Interior', unit: 'Pza', cost: 1200, category: 'Carpintería' },
    { name: 'Chapa de Manija Recámara', unit: 'Pza', cost: 450, category: 'Carpintería' },
];

async function main() {
    console.log('🌱 Start seeding materials...');

    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
        console.log('⚠️ No tenants found. Create a tenant first.');
        return;
    }

    for (const tenant of tenants) {
        console.log(`Processing Tenant: ${tenant.name} (${tenant.slug})`);
        
        for (const mat of commonMaterials) {
            // Upsert based on name + tenantId to avoid duplicates
            // Since there is no unique constraint on [tenantId, name] in the schema shown (only ID),
            // we'll check first or just create if not exists using findFirst.
            
            const existing = await prisma.material.findFirst({
                where: {
                    tenantId: tenant.id,
                    name: mat.name
                }
            });

            if (!existing) {
                await prisma.material.create({
                    data: {
                        tenantId: tenant.id,
                        name: mat.name,
                        unit: mat.unit,
                        costParam: mat.cost,
                        description: `Material categoria ${mat.category}`
                    }
                });
                console.log(`   + Created: ${mat.name}`);
            } else {
                console.log(`   = Exists: ${mat.name}`);
            }
        }
    }

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
