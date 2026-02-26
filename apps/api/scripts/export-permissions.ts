import * as fs from 'fs';
import * as path from 'path';
import {
  Permission,
  ROLE_PERMISSIONS,
} from '../src/common/constants/permissions';
import { ProjectRole } from '../src/common/constants/roles';

// Diccionario de descripciones para cada permiso
const descripcionesPermisos: Record<string, string> = {
  // Proyecto
  [Permission.PROJECT_VIEW]:
    'Ver configuración del proyecto (listados, métricas base)',
  [Permission.PROJECT_EDIT]:
    'Editar configuración y presupuesto global del proyecto',
  [Permission.PROJECT_DELETE]: 'Eliminar el proyecto',

  // Tareas / Actividades
  [Permission.TASK_VIEW]: 'Ver actividades del plan de trabajo y dashboard',
  [Permission.TASK_CREATE]: 'Crear nuevas actividades y/o hitos',
  [Permission.TASK_UPDATE]: 'Editar detalles de las actividades y hitos',
  [Permission.TASK_DELETE]: 'Eliminar actividades o hitos',
  [Permission.TASK_MARK_DONE]: 'Marcar actividades como terminadas (Completar)',
  [Permission.TASK_APPROVE]: 'Aprobar actividades terminadas (Cerrar)',
  [Permission.TASK_REOPEN]: 'Reabrir actividades finalizadas',

  // RFI
  [Permission.RFI_VIEW]: 'Ver RFIs (Solicitudes de Información)',
  [Permission.RFI_CREATE]: 'Crear RFIs',
  [Permission.RFI_UPDATE]: 'Actualizar detalles de RFIs',

  // Usuarios / Miembros
  [Permission.MEMBER_VIEW]: 'Ver listado de miembros del equipo y contratistas',
  [Permission.MEMBER_INVITE]: 'Invitar nuevos usuarios al proyecto',
  [Permission.MEMBER_UPDATE]:
    'Actualizar accesos y roles de miembros del proyecto',
  [Permission.OPERATOR_CREATE]:
    'Crear cuentas para Operadores de Campo limitados',

  // Presupuesto
  [Permission.BUDGET_VIEW]:
    'Ver el presupuesto y finanzas detalladas del proyecto',
};

// Extraemos todos los permisos
const allPermissions = Object.values(Permission);

// Extraemos todos los roles
const allRoles = Object.values(ProjectRole);

// Preparamos el contenido del CSV
let csvContent = `Permisos ; Descripción ;`;
csvContent += allRoles.join(';') + '\n';

allPermissions.forEach((permission) => {
  let row = `${permission};`;

  // Agregamos la descripción
  const descripcion =
    descripcionesPermisos[permission as string] || 'Descripción no disponible';
  row += `${descripcion};`;

  allRoles.forEach((role) => {
    // Si el rol tiene todos los permisos en Object.values() o si lo tiene explicitamente
    let hasPermission = false;

    // El mapa ROLE_PERMISSIONS no tiene typing en JS puro en iteraciones pero podemos acceder a sus arreglos
    const rolePerms = ROLE_PERMISSIONS[role as ProjectRole] || [];

    if (rolePerms.includes(permission as Permission)) {
      hasPermission = true;
    }

    row += hasPermission ? 'X;' : ';';
  });
  csvContent += row + '\n';
});

// UTF-8 BOM para que Excel en Windows lo lea bien con caracteres si es necesario
const bom = '\ufeff';

const outputPath = path.join(
  process.cwd(),
  'Matriz_Permisos_TorreMawi_ConDescripciones.csv',
);
fs.writeFileSync(outputPath, bom + csvContent);

console.log(`\n✅ Archivo Excel (CSV) generado con éxito en:\n${outputPath}\n`);
