
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Syncing Budget Lines ---');

    // 1. Find active project
    const projects = await prisma.project.findMany({
        include: {
            budgets: { include: { budgetLines: true } },
            costLedger: { take: 1, orderBy: { date: 'desc' } }
        }
    });

    const activeProject = projects.sort((a, b) => {
        const dateA = a.costLedger[0]?.date || new Date(0);
        const dateB = b.costLedger[0]?.date || new Date(0);
        return dateB.getTime() - dateA.getTime();
    })[0];

    if (!activeProject || activeProject.budgets.length === 0) {
        console.log('No active project with budget found.');
        return;
    }

    const budget = activeProject.budgets[0];
    console.log(`Syncing Budget for Project: ${activeProject.name}`);

    // 2. Get all WBS Activities using the correct model 'projectActivity'
    const activities = await prisma.projectActivity.findMany({
        where: { projectId: activeProject.id }
    });

    console.log(`Found ${activities.length} WBS Activities.`);

    // 3. Find missing lines
    let addedCount = 0;
    for (const activity of activities) {
        // Check if a budget line exists for this activity
        const exists = budget.budgetLines.find(l => l.wbsActivityId === activity.id);
        if (!exists) {
            console.log(`Adding missing line for activity: ${activity.code} - ${activity.name}`);
            await prisma.budgetLine.create({
                data: {
                    budgetId: budget.id,
                    wbsActivityId: activity.id,
                    code: activity.code,
                    name: activity.name,
                    costType: 'LABOR', // Default to LABOR to catch labor costs
                    budgetBase: 0
                }
            });
            addedCount++;
        }
    }

    console.log(`\nSync Complete. Added ${addedCount} new budget lines.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
