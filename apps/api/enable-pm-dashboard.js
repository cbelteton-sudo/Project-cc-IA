
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst();
    if (project) {
        console.log(`Updating project: ${project.name} (${project.id})`);
        await prisma.project.update({
            where: { id: project.id },
            data: { enablePMDashboard: true }
        });
        console.log('Project updated successfully.');
    } else {
        console.log('No projects found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
