
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Timesheet Create Debug ---');

    // 1. Get a project
    const project = await prisma.project.findFirst();
    if (!project) {
        console.error('No project found to attach timesheet to.');
        return;
    }
    console.log('Using Project:', project.id, project.name);

    // 2. Try to create a timesheet
    try {
        const result = await prisma.timesheet.create({
            data: {
                projectId: project.id,
                weekStartDate: new Date().toISOString(), // Trying ISO String
                workerName: 'Debug Worker',
                status: 'DRAFT'
            }
        });
        console.log('Success! Created timesheet:', result.id);
    } catch (e) {
        console.error('FAILED to create timesheet (String Date):', e);

        // Retry with Date object if string failed
        try {
            console.log('Retrying with Date Object...');
            const result2 = await prisma.timesheet.create({
                data: {
                    projectId: project.id,
                    weekStartDate: new Date(),
                    workerName: 'Debug Worker 2',
                    status: 'DRAFT'
                }
            });
            console.log('Success with Date Object!', result2.id);
        } catch (e2) {
            console.error('FAILED to create timesheet (Date Object):', e2);
        }
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
