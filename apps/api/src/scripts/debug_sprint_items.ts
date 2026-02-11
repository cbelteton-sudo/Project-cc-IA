
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Sprint Items ---');

    // 1. Find the active sprint
    const activeSprint = await prisma.sprint.findFirst({
        where: { status: 'ACTIVE' },
        include: {
            items: {
                include: {
                    backlogItem: true
                }
            }
        }
    });

    if (!activeSprint) {
        console.log('No ACTIVE sprint found.');
    } else {
        console.log(`Active Sprint: ${activeSprint.name} (${activeSprint.id})`);
        console.log(`Item Count: ${activeSprint.items.length}`);

        if (activeSprint.items.length === 0) {
            console.log('WARNING: Active sprint has 0 items.');

            // Check if there are any SprintItems at all for this sprint ID (maybe relation issue?)
            const rawCount = await prisma.sprintItem.count({
                where: { sprintId: activeSprint.id }
            });
            console.log(`Raw SprintItem count for valid sprintId: ${rawCount}`);
        } else {
            activeSprint.items.forEach(item => {
                console.log(`- Item: ${item.backlogItem.title} | Status: ${item.boardStatus} | BacklogStatus: ${item.backlogItem.status}`);
            });
        }
    }

    // 2. Check for "PLANNED" sprints just in case
    const plannedSprint = await prisma.sprint.findFirst({
        where: { status: 'PLANNED' },
        include: { _count: { select: { items: true } } }
    });

    if (plannedSprint) {
        console.log(`Planned Sprint: ${plannedSprint.name} | Items: ${plannedSprint._count.items}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
