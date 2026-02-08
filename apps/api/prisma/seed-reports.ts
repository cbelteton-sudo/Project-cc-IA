
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Get all projects
    const projects = await prisma.project.findMany();

    if (projects.length === 0) {
        console.log("No projects found.");
        return;
    }

    console.log(`Found ${projects.length} projects.`);

    // 2. Enable reports for all of them (or a specific one if previously hardcoded)
    // For dev convenience, let's enable for all active projects
    const result = await prisma.project.updateMany({
        data: {
            enableReports: true,
        },
    });

    console.log(`Updated ${result.count} projects to enableReports = true.`);

    // 3. List them
    const updated = await prisma.project.findMany({ select: { id: true, name: true, enableReports: true } });
    console.table(updated);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
