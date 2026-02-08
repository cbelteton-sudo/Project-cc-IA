import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Seeding Test Project...');

    // 1. Get Tenant & Residente User
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant found. Run main seed first.');

    const residente = await prisma.user.findFirst({ where: { role: 'RESIDENTE' } });
    const userId = residente?.id || 'UNKNOWN';

    // 2. Create Test Project
    const project = await prisma.project.create({
        data: {
            name: 'PROYECTO DE PRUEBAS',
            code: 'TEST-001',
            status: 'ACTIVE',
            currency: 'GTQ',
            tenantId: tenant.id,
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 60)),
            globalBudget: 100000,
        },
    });

    console.log(`🏗️ Project created: ${project.name}`);

    // 3. Create Activities
    const today = new Date();

    // Activity 1: Active Today
    const act1 = await prisma.projectActivity.create({
        data: {
            tenantId: tenant.id,
            projectId: project.id,
            name: 'Actividad en Curso Hoy',
            code: 'TEST-A1',
            startDate: new Date(today.getTime() - 2 * 86400000), // 2 days ago
            endDate: new Date(today.getTime() + 5 * 86400000), // 5 days future
            status: 'IN_PROGRESS',
        }
    });

    // Activity 2: Starting Tomorrow
    const act2 = await prisma.projectActivity.create({
        data: {
            tenantId: tenant.id,
            projectId: project.id,
            name: 'Actividad Próxima',
            code: 'TEST-A2',
            startDate: new Date(today.getTime() + 1 * 86400000), // Tomorrow
            endDate: new Date(today.getTime() + 10 * 86400000),
            status: 'NOT_STARTED',
        }
    });

    // Activity 3: Finished
    const act3 = await prisma.projectActivity.create({
        data: {
            tenantId: tenant.id,
            projectId: project.id,
            name: 'Actividad Finalizada',
            code: 'TEST-A3',
            startDate: new Date(today.getTime() - 10 * 86400000),
            endDate: new Date(today.getTime() - 1 * 86400000),
            status: 'DONE',
            percent: 100
        }
    });

    console.log('✅ 3 Test Activities created');

    // 4. Create a Daily Report for Today (to simulate history)
    const report = await prisma.fieldDailyReport.create({
        data: {
            projectId: project.id,
            date: today,
            status: 'DRAFT',
            createdBy: userId
        }
    });

    // 5. Create an Entry
    await prisma.fieldDailyEntry.create({
        data: {
            dailyReportId: report.id,
            scheduleActivityId: act1.id,
            activityName: act1.name,
            status: 'IN_PROGRESS',
            progressChip: 50,
            note: 'Avance inicial en pruebas.',
            createdBy: userId
        }
    });

    console.log('✅ Initial Daily Report created');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
