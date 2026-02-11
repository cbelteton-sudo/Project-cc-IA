
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Financial Integration (Smart Find) ---');

    // 1. Find the project with the most recent Ledger Activity or Timesheets
    const projects = await prisma.project.findMany({
        include: {
            budgets: { include: { budgetLines: true } },
            costLedger: { take: 1, orderBy: { date: 'desc' } },
            timesheets: { take: 1, orderBy: { createdAt: 'desc' } }
        }
    });

    console.log(`\nScanning ${projects.length} projects for activity...`);

    // Sort by most recent activity (ledger or timesheet)
    const activeProject = projects.sort((a, b) => {
        const dateA = a.costLedger[0]?.date || a.timesheets[0]?.createdAt || new Date(0);
        const dateB = b.costLedger[0]?.date || b.timesheets[0]?.createdAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
    })[0];

    if (!activeProject) {
        console.log('No active projects found.');
        return;
    }

    const projectId = activeProject.id;
    const budget = activeProject.budgets[0];

    console.log(`\n🎯 Target Project: ${activeProject.name} (${projectId})`);
    console.log(`   - Budget: ${budget ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   - Budget Lines: ${budget?.budgetLines.length || 0}`);

    if (!budget) {
        console.log('   Stats: Cannot debug without a budget.');
        return;
    }

    // 2. Inspect Cost Ledger for Labor
    const laborEntries = await prisma.costLedger.findMany({
        where: {
            projectId,
            entryType: 'LABOR_ACTUAL'
        },
        orderBy: { date: 'desc' },
        take: 10
    });

    console.log(`\n📊 Labor Ledger Entries (Last 10): ${laborEntries.length} found`);

    if (laborEntries.length === 0) {
        console.log('   ❌ No Labor entries found in the Ledger. The Timesheet Service is NOT writing to the DB.');
        // Check if timesheets exist at least
        const timesheets = await prisma.timesheet.findMany({ where: { projectId }, include: { entries: true } });
        const totalHours = timesheets.reduce((sum, t) => sum + t.entries.reduce((s, e) => s + Number(e.hours), 0), 0);
        console.log(`   ⚠️ However, found ${timesheets.length} timesheets with ${totalHours} total hours.`);
        return;
    }

    // 3. Match Analysis
    console.log('\n🔍 Match Analysis (Ledger <-> Budget):');

    let matchCount = 0;
    let mismatchCount = 0;

    for (const entry of laborEntries) {
        const exactMatch = budget.budgetLines.find(l =>
            l.wbsActivityId === entry.wbsActivityId &&
            l.costType === entry.costType
        );

        const activityOnlyMatch = budget.budgetLines.find(l => l.wbsActivityId === entry.wbsActivityId);

        if (exactMatch) {
            console.log(`  ✅ [${entry.date.toISOString().split('T')[0]}] Entry ${entry.id.substring(0, 8)} => Matches Line "${exactMatch.code}" (CostType: ${entry.costType})`);
            matchCount++;
        } else {
            console.log(`  ❌ [${entry.date.toISOString().split('T')[0]}] Entry ${entry.id.substring(0, 8)} => NO JOIN POSSIBLE`);
            console.log(`     Entry Values: Activity=${entry.wbsActivityId}, CostType='${entry.costType}'`);
            if (activityOnlyMatch) {
                console.log(`     💡 Reason: Mismatched CostType. Budget expects '${activityOnlyMatch.costType}' but Ledger has '${entry.costType}'`);
            } else {
                console.log(`     💡 Reason: Activity ID ${entry.wbsActivityId} not found in Budget Lines.`);
            }
            mismatchCount++;
        }
    }

    console.log(`\nSummary: ${matchCount} valid matches, ${mismatchCount} mismatches.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
