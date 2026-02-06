import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging Materials Data...');

    // 1. Check Tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
    if (!tenant) {
        console.error('❌ Tenant "demo" not found!');
        return;
    }
    console.log(`✅ Tenant "demo" found: ${tenant.id}`);

    // 2. Check User
    const user = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
    if (!user) {
        console.error('❌ User "admin@demo.com" not found!');
    } else {
        console.log(`👤 User "admin@demo.com" found. TenantID: ${user.tenantId}`);
        if (user.tenantId !== tenant.id) {
            console.error(`🚨 MISMATCH: User TenantId (${user.tenantId}) !== Tenant ID (${tenant.id})`);
        } else {
            console.log('✅ User linked to correct Tenant');
        }
    }

    // 3. Check Materials
    const materials = await prisma.material.findMany();
    console.log(`📦 Total Materials in DB: ${materials.length}`);

    const tenantMaterials = materials.filter(m => m.tenantId === tenant.id);
    console.log(`📦 Materials for Tenant "${tenant.id}": ${tenantMaterials.length}`);

    if (tenantMaterials.length === 0 && materials.length > 0) {
        console.log('⚠️ Materials exist but belong to other tenants:');
        const otherTenants = [...new Set(materials.map(m => m.tenantId))];
        otherTenants.forEach(tId => {
            const count = materials.filter(m => m.tenantId === tId).length;
            console.log(`   - Tenant ${tId}: ${count} materials`);
        });
    } else if (tenantMaterials.length > 0) {
        console.log('✅ Materials look correct for this tenant. Examples:');
        tenantMaterials.slice(0, 3).forEach(m => console.log(`   - ${m.name}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
