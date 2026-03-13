import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos para "Complejo Logístico del Sur"...');

  // Find Tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('No se encontró ningún Tenant en la base de datos.');
  }

  // Find Project
  let project = await prisma.project.findFirst({
    where: {
      name: {
        contains: 'Complejo Log',
        mode: 'insensitive'
      }
    }
  });

  if (!project) {
    console.log('No se encontró el proyecto. Creándolo...');
    project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        name: 'Complejo Logístico del Sur',
        code: 'CLS-001',
        description: 'Instalación de internet, infraestructura, wifi y sistema CCTV.',
        status: 'ACTIVE',
      }
    });
  } else {
    console.log(`Proyecto encontrado: ${project.name} (${project.id})`);
  }

  // Define dates (1.5 months = ~45 days)
  const today = new Date();
  const EndOfProject = new Date(today);
  EndOfProject.setDate(today.getDate() + 45);

  // Update project dates just in case
  await prisma.project.update({
    where: { id: project.id },
    data: {
      startDate: today,
      endDate: EndOfProject,
    }
  });

  // Helper to add days
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Clean up existing activities for this project to avoid duplicates during test
  await prisma.projectActivity.deleteMany({
    where: { projectId: project.id }
  });

  // Phases and Activities
  const phases = [
    {
      name: 'Fase 1: Infraestructura y Canalización',
      startDay: 0,
      endDay: 15,
      percent: 100,
      activities: [
        { name: 'Trazo y replanteo de rutas', startDay: 0, endDay: 3, percent: 100 },
        { name: 'Instalación de tubería / canaletas', startDay: 3, endDay: 10, percent: 100 },
        { name: 'Tendido de cableado UTP Cat 6 (Red)', startDay: 8, endDay: 14, percent: 100 },
        { name: 'Tendido de cableado para CCTV', startDay: 8, endDay: 15, percent: 100 },
      ]
    },
    {
      name: 'Fase 2: Instalación de Equipos Activos',
      startDay: 16,
      endDay: 30,
      percent: 40,
      activities: [
        { name: 'Montaje de Racks de Comunicaciones', startDay: 16, endDay: 18, percent: 100 },
        { name: 'Instalación de Switches y Routers', startDay: 19, endDay: 22, percent: 80 },
        { name: 'Montaje de Puntos de Acceso WiFi (AP)', startDay: 21, endDay: 28, percent: 20 },
        { name: 'Montaje mecánico de cámaras CCTV', startDay: 25, endDay: 30, percent: 0 },
      ]
    },
    {
      name: 'Fase 3: Configuración y Pruebas (Comisionamiento)',
      startDay: 31,
      endDay: 45,
      percent: 0,
      activities: [
        { name: 'Certificación de nodos de red', startDay: 31, endDay: 35, percent: 0 },
        { name: 'Configuración de VLANs y Red WiFi', startDay: 34, endDay: 38, percent: 0 },
        { name: 'Configuración de NVR y visualización', startDay: 38, endDay: 42, percent: 0 },
        { name: 'Pruebas de estrés y entrega final', startDay: 43, endDay: 45, percent: 0 },
      ]
    }
  ];

  let orderIndex = 0;

  for (const phase of phases) {
    // Create Phase
    const parentActivity = await prisma.projectActivity.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        name: phase.name,
        startDate: addDays(today, phase.startDay),
        endDate: addDays(today, phase.endDay),
        percent: phase.percent,
        status: phase.percent === 100 ? 'COMPLETED' : (phase.percent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
        orderIndex: orderIndex++
      }
    });

    console.log(`Creada Fase: ${parentActivity.name}`);

    // Create Sub-activities
    for (const sub of phase.activities) {
      await prisma.projectActivity.create({
        data: {
          tenantId: tenant.id,
          projectId: project.id,
          parentId: parentActivity.id,
          name: sub.name,
          startDate: addDays(today, sub.startDay),
          endDate: addDays(today, sub.endDay),
          percent: sub.percent,
          status: sub.percent === 100 ? 'COMPLETED' : (sub.percent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
          orderIndex: orderIndex++
        }
      });
    }
  }

  // --- MATERIAL SEEDING ---
  console.log('Seeding materials for Wi-Fi and CCTV Installation...');
  
  // Clean up previous materials specifically for this project if needed
  await prisma.projectMaterial.deleteMany({
    where: { projectId: project.id }
  });

  const materialsData = [
    { name: 'Cable UTP Cat 6 (Bobina 305m)', unit: 'BOB', plannedQty: 12, plannedPrice: 1500, stock: 8, consumed: 4 },
    { name: 'Tubería EMT 3/4"', unit: 'Tubo', plannedQty: 100, plannedPrice: 85, stock: 40, consumed: 60 },
    { name: 'Rack de Comunicaciones 42U', unit: 'UN', plannedQty: 3, plannedPrice: 8500, stock: 3, consumed: 0 },
    { name: 'Switch PoE 24 Puertos Cisco', unit: 'UN', plannedQty: 6, plannedPrice: 12500, stock: 2, consumed: 4 },
    { name: 'Router VPN Firewall', unit: 'UN', plannedQty: 2, plannedPrice: 9000, stock: 1, consumed: 1 },
    { name: 'Punto de Acceso WiFi 6 (AP)', unit: 'UN', plannedQty: 45, plannedPrice: 3200, stock: 25, consumed: 10 },
    { name: 'Cámara CCTV IP Domo 4K', unit: 'UN', plannedQty: 32, plannedPrice: 2800, stock: 32, consumed: 0 },
    { name: 'NVR de 64 Canales', unit: 'UN', plannedQty: 1, plannedPrice: 15000, stock: 1, consumed: 0 },
    { name: 'Conectores RJ45 Cat 6 (Caja 100)', unit: 'CAJ', plannedQty: 5, plannedPrice: 350, stock: 3, consumed: 2 },
  ];

  for (const mData of materialsData) {
    // 1. Check if Material exists globally or create it
    let material = await prisma.material.findFirst({
      where: { name: mData.name, tenantId: tenant.id }
    });

    if (!material) {
      material = await prisma.material.create({
        data: {
          tenantId: tenant.id,
          name: mData.name,
          unit: mData.unit,
          costParam: mData.plannedPrice,
          description: `Material para instalación de red y CCTV.`
        }
      });
    }

    // 2. Link to Project via ProjectMaterial
    await prisma.projectMaterial.create({
      data: {
        projectId: project.id,
        materialId: material.id,
        plannedQty: mData.plannedQty,
        plannedPrice: mData.plannedPrice,
        stockAvailable: mData.stock,
        stockConsumed: mData.consumed,
      }
    });

    console.log(`Material asignado: ${mData.name}`);
  }

  console.log('¡Datos cargados exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
