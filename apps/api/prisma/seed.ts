import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Constructora Demo',
            slug: 'demo',
        },
    });
    console.log(`✅ Created Tenant: ${tenant.name}`);

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@demo.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN',
            tenantId: tenant.id,
        },
    });
    console.log(`✅ Created User: ${admin.email}`);

    // 3. Create Projects
    const projectsData = [
        { name: 'Torre Spazio Z15', code: 'PRJ-001', budget: 5000000, currency: 'USD' },
        { name: 'Centro Comercial Vista', code: 'PRJ-002', budget: 12000000, currency: 'USD' },
        { name: 'Hospital Regional', code: 'PRJ-003', budget: 25000000, currency: 'GTQ' },
    ];

    for (const p of projectsData) {
        const project = await prisma.project.create({
            data: {
                name: p.name,
                code: p.code,
                tenantId: tenant.id,
                currency: p.currency,
                status: 'ACTIVE',
            },
        });
        console.log(`   🏗️ Created Project: ${project.name}`);

        // 3.1 Create Budget
        const budget = await prisma.budget.create({
            data: {
                projectId: project.id,
                name: 'Master Budget',
                // totalAmount is not in schema directly per recent view, but let's check. 
                // Logic might rely on lines. But schema had `Budget` with `name` only. 
                // Wait, schema has `Budget` model but no total amount field shown in snippet?
                // Checking snippet: `model Budget { id, projectId, name }`. No totalAmount.
                // So I remove totalAmount.
            },
        });

        // 3.2 Create Budget Lines
        const lines = [
            { code: '01.00', name: 'Preliminaries', amount: p.budget * 0.05 },
            { code: '02.00', name: 'Foundation', amount: p.budget * 0.15 },
            { code: '03.00', name: 'Structure', amount: p.budget * 0.40 },
            { code: '04.00', name: 'Finishes', amount: p.budget * 0.30 },
            { code: '05.00', name: 'MEP', amount: p.budget * 0.10 },
        ];

        for (const line of lines) {
            await prisma.budgetLine.create({
                data: {
                    budgetId: budget.id,
                    code: line.code,
                    name: line.name,
                    amountParam: line.amount,
                    amountCommitted: line.amount * 0.5,
                    amountExecuted: line.amount * 0.2,
                },
            });
        }

        // 3.3 Create Material Requests
        // Schema: items String (JSON)
        await prisma.materialRequest.create({
            data: {
                projectId: project.id,
                title: 'Initial Cement & Steel',
                status: 'APPROVED',
                items: JSON.stringify([
                    { description: 'Cement Bags', quantity: 500, unit: 'Bag' },
                    { description: 'Steel Rods 3/8"', quantity: 200, unit: 'Pc' }
                ]),
                // requestDate: new Date(), // Schema snippet showed createdAt/updatedAt but no requestDate. Checking schema again...
                // Schema line 109: createdAt DateTime @default(now())
                // No requestDate field in schema model MaterialRequest.
            }
        });

        // 3.4 Create Purchase Order
        // Schema: vendor String (not vendorName), items is relation PurchaseOrderItem[]
        // Logic: Create PO then items.
        const po = await prisma.purchaseOrder.create({
            data: {
                projectId: project.id,
                vendor: 'Materiales ConstruMax', // Correct field name
                total: p.budget * 0.05, // Field is 'total' not 'totalAmount'
                status: 'APPROVED',
                // items is a relation, cannot pass JSON string
            }
        });

        await prisma.purchaseOrderItem.create({
            data: {
                purchaseOrderId: po.id,
                description: 'Cement & Steel Order',
                quantity: 1,
                unitPrice: p.budget * 0.05,
                total: p.budget * 0.05
            }
        });


        // 3.5 Create Invoice
        await prisma.invoice.create({
            data: {
                projectId: project.id,
                vendor: 'Materiales ConstruMax',
                invoiceNumber: `INV-${Math.floor(Math.random() * 1000)}`,
                total: p.budget * 0.02, // Field is 'total' not 'amount'
                currency: p.currency,
                status: 'PAID',
                date: new Date(),
                fileUrl: 'http://example.com/invoice.pdf'
            }
        });

        // 3.6 Create RFI
        await prisma.rFI.create({
            data: {
                projectId: project.id,
                code: `RFI-${Math.floor(Math.random() * 100)}`,
                subject: 'Clarification on Foundation Depth',
                question: 'The drawings show 2m but soil report suggests 3m. Please advise.',
                status: 'OPEN',
                assignedTo: 'Structural Engineer',
            }
        });
    }

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
