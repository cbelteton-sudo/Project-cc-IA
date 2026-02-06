import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 0. Clean Phase 9 Data (Reverse order of dependencies)
    await prisma.activityClosureRecord.deleteMany();
    await prisma.activityWeeklyProgress.deleteMany();
    await prisma.activityDependency.deleteMany();
    await prisma.projectActivity.deleteMany();
    await prisma.projectMilestone.deleteMany();
    await prisma.contractor.deleteMany();

    // Clean Projects if needed to avoid dupes (optional, but safer for demo)
    await prisma.project.deleteMany({ where: { code: 'T-MAWI' } });

    console.log('🧹 Cleaned existing Phase 9 data');

    // 1. Create Tenant (Upsert)
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'demo' },
        update: {},
        create: {
            name: 'Constructora Demo',
            slug: 'demo',
        },
    });
    console.log('✅ Tenant ready: Constructora Demo');

    // 2. Create Admin User (Upsert)
    const password = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: { password }, // Update password just in case
        create: {
            email: 'admin@demo.com',
            password,
            name: 'Admin User',
            role: 'ADMIN',
            tenantId: tenant.id,
        },
    });
    console.log('✅ User ready: admin@demo.com');

    // 3. Create Contractors
    const contractorsData = [
        { name: 'CONSTRUCTORA ALFA', type: 'CONTRACTOR' },
        { name: 'ELECTROMECÁNICA BETA', type: 'CONTRACTOR' },
        { name: 'ACABADOS GAMMA', type: 'CONTRACTOR' },
        { name: 'PROVEEDOR DELTA', type: 'SUPPLIER' },
    ];

    const contractors: any[] = [];
    for (const c of contractorsData) {
        const contractor = await prisma.contractor.create({
            data: { ...c, tenantId: tenant.id },
        });
        contractors.push(contractor);
    }
    console.log('✅ Created Contractors');

    // 4. Create Project "TORRE MAWI DEMO"
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30); // 30 days ago
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 120); // 120 days future

    const project = await prisma.project.create({
        data: {
            name: 'TORRE MAWI DEMO',
            code: 'T-MAWI',
            status: 'ACTIVE',
            currency: 'GTQ',
            tenantId: tenant.id,
            startDate,
            endDate,
            globalBudget: 2500000,
        },
    });
    console.log('🏗️ Created Project: TORRE MAWI DEMO');

    // 5. Helper to create activities
    const createActivity = async (name: string, parentId: string | null, startOffset: number, duration: number, contractorIdx?: number) => {
        const s = new Date(startDate);
        s.setDate(s.getDate() + startOffset);
        const e = new Date(s);
        e.setDate(e.getDate() + duration);

        // Generate Code
        const prefix = 'MAWI';
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();

        return prisma.projectActivity.create({
            data: {
                tenantId: tenant.id,
                projectId: project.id,
                parentId,
                name,
                code: `${prefix}-${random}`,
                startDate: s,
                endDate: e,
                status: 'NOT_STARTED',
                contractorId: contractorIdx !== undefined ? contractors[contractorIdx].id : undefined,
            },
        });
    };

    // 6. Create Activities Tree
    // A) Preliminares (Padre)
    const actA = await createActivity('Preliminares', null, 0, 20, 0); // ALFA
    const actA1 = await createActivity('Limpieza', actA.id, 0, 5);
    const actA2 = await createActivity('Trazo y Nivelación', actA.id, 5, 5);
    const actA3 = await createActivity('Instalaciones Provisionales', actA.id, 2, 10);

    // B) Estructura (Padre)
    const actB = await createActivity('Estructura', null, 20, 60, 0); // ALFA
    const actB1 = await createActivity('Cimentación', actB.id, 20, 15);
    const actB2 = await createActivity('Columnas PB', actB.id, 35, 10);
    const actB3 = await createActivity('Losa Nivel 1', actB.id, 45, 15);

    // C) Instalaciones (Padre)
    const actC = await createActivity('Instalaciones', null, 40, 50, 1); // BETA
    const actC1 = await createActivity('Ductería Eléctrica', actC.id, 40, 20);
    const actC2 = await createActivity('Tubería Hidráulica', actC.id, 45, 20);

    // D) Acabados (Padre)
    const actD = await createActivity('Acabados', null, 80, 40, 2); // GAMMA
    const actD1 = await createActivity('Repello y Cernido', actD.id, 80, 15);
    const actD2 = await createActivity('Piso Cerámico', actD.id, 95, 15);
    const actD3 = await createActivity('Pintura', actD.id, 110, 10);

    // 7. Dependencies (Structure depends on Preliminaries)
    await prisma.activityDependency.create({
        data: {
            tenantId: tenant.id,
            projectId: project.id,
            activityId: actB1.id, // Cimentación
            dependsOnId: actA2.id // Trazo
        }
    });

    // 8. Progress (Mock)
    // A2 (Trazo) - 100% DONE
    await prisma.activityWeeklyProgress.create({
        data: {
            tenantId: tenant.id,
            projectId: project.id,
            activityId: actA2.id,
            weekStartDate: new Date(startDate),
            percent: 100
        }
    });
    await prisma.projectActivity.update({ where: { id: actA2.id }, data: { status: 'DONE', percent: 100 } });

    // 9. Activity Closure Test Data
    const actE = await createActivity('Validación de Fase', null, 120, 10, 3);

    // E1: Ready to Close (100% Done)
    const actE1 = await createActivity('Inspección de Seguridad', actE.id, 120, 2);
    await prisma.activityWeeklyProgress.create({
        data: {
            tenantId: tenant.id,
            projectId: project.id,
            activityId: actE1.id,
            weekStartDate: new Date(startDate),
            percent: 100,
            notes: 'Ready for closure'
        }
    });
    await prisma.projectActivity.update({ where: { id: actE1.id }, data: { status: 'DONE', percent: 100 } });

    // E2: Pending Dependency (Depends on E1 - which is Done, so actually this is ready too if we want. Let's make it 50% so it CANNOT be closed yet)
    const actE2 = await createActivity('Revisión de Calidad', actE.id, 122, 5);
    await prisma.activityDependency.create({
        data: { tenantId: tenant.id, projectId: project.id, activityId: actE2.id, dependsOnId: actE1.id }
    });
    // Set 50%
    await prisma.activityWeeklyProgress.create({
        data: {
            tenantId: tenant.id,
            projectId: project.id,
            activityId: actE2.id,
            weekStartDate: new Date(startDate),
            percent: 50
        }
    });
    await prisma.projectActivity.update({ where: { id: actE2.id }, data: { status: 'IN_PROGRESS', percent: 50 } });

    // ... Phase 9 logic above ...
    // Note: I will append Phase 10 logic at the end or interleave. 
    // Since I am replacing the whole block or finding a good insertion point.
    // The previous view of seed.ts ended at line 204.
    // I will replace from "console.log('✅ Seed complete!');" to insert before it.

    // --- Phase 10: Users & Contractors ---
    console.log('👷 Seeding Phase 10: Contractors & Users...');

    // 10. Update Contractors with Profile Data
    // ALFA (Contractor 1)
    await prisma.contractor.update({
        where: { id: contractors[0].id },
        data: {
            legalName: 'Constructora Alfa S.A.',
            taxId: 'NIT-99887766',
            address: 'Km 14.5 Carr. a El Salvador',
            specialties: JSON.stringify(['Obra Gris', 'Estructuras']),
            contactPersonName: 'Ing. Carlos Alfa',
            email: 'contacto@alfa.com'
        }
    });

    // GAMMA (Contractor 2 - Acabados)
    await prisma.contractor.update({
        where: { id: contractors[2].id },
        data: {
            legalName: 'Acabados Gamma Ltda.',
            specialties: JSON.stringify(['Tabla Yeso', 'Pintura', 'Piso']),
            contactPersonName: 'Arq. Gabriela Gamma'
        }
    });

    // 11. Create Assignment (ALFA -> MAWI Project)
    // Avoid dupes using upsert logic or deleteMany first? 
    // Schema has unique constraint [tenantId, contractorId, projectId].
    // Upsert is safer.
    await prisma.contractorProjectAssignment.upsert({
        where: {
            tenantId_contractorId_projectId: {
                tenantId: tenant.id,
                contractorId: contractors[0].id,
                projectId: project.id
            }
        },
        update: {},
        create: {
            tenantId: tenant.id,
            contractorId: contractors[0].id,
            projectId: project.id,
            roleInProject: 'Contratista General'
        }
    });

    // 12. Create Users
    const roles = ['DIRECTOR', 'SUPERVISOR', 'OPERADOR'];
    for (const role of roles) {
        const email = `${role.toLowerCase()}@demo.com`;
        await prisma.user.upsert({
            where: { email },
            update: { role },
            create: {
                email,
                name: `${role} User`,
                password, // same 'password123' hash from above
                role,
                tenantId: tenant.id
            }
        });
    }

    // Contractor User (ALFA)
    const contractorEmail = 'contratista1@demo.com';
    await prisma.user.upsert({
        where: { email: contractorEmail },
        update: { contractorId: contractors[0].id },
        create: {
            email: contractorEmail,
            name: 'Juan Perez (Alfa)',
            password,
            role: 'CONTRATISTA',
            tenantId: tenant.id,
            contractorId: contractors[0].id
        }
    });

    console.log('✅ Phase 10 Seed Complete');

    // 13. Seed Materials
    console.log('📦 Seeding Materials...');
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
        }
    }
    console.log('✅ Materials Seeded');
    console.log('✅ Seed complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
