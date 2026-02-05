
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging DB Content...');

    const tenants = await prisma.tenant.findMany();
    console.log(`\n🏢 Tenants (${tenants.length}):`);
    tenants.forEach(t => console.log(` - [${t.id}] ${t.name} (slug: ${t.slug})`));

    const users = await prisma.user.findMany();
    console.log(`\n👤 Users (${users.length}):`);
    users.forEach(u => console.log(` - [${u.id}] ${u.email} (Tenant: ${u.tenantId})`));

    const projects = await prisma.project.findMany();
    console.log(`\n🏗️ Projects (${projects.length}):`);
    projects.forEach(p => console.log(` - [${p.id}] ${p.name} (Code: ${p.code}, Tenant: ${p.tenantId})`));

    const activities = await prisma.projectActivity.findMany();
    console.log(`\n📋 Activities (${activities.length}):`);
    activities.forEach(a => console.log(` - [${a.id}] ${a.name} (Project: ${a.projectId}, Tenant: ${a.tenantId})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
