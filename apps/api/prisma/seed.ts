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
    await prisma.projectActivity.update({ where: { id: actA2.id }, data: { status: 'DONE' } });

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
