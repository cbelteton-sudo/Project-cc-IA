import {
  Home,
  FolderKanban,
  Banknote,
  Settings,
  Users,
  Briefcase,
  BarChart2,
  AlertTriangle,
  LayoutDashboard,
  Calendar,
  Activity,
  HardHat,
  FileText,
  Boxes,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { User } from '../context/AuthContext';
import type { Project } from '../hooks/useProjects';

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon | React.ElementType;
  exact?: boolean;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

/**
 * Get navigation items based on the user's role and current context (Org vs Project).
 * @param user The authenticated user object
 * @param projectId The current project ID (if any)
 * @returns Array of NavSections
 */
export const getNavItems = (
  user: User | null,
  projectId?: string,
  currentProject?: Project | null,
): NavSection[] => {
  if (!user) return [];

  const isProjectContext = !!projectId;
  const role = user.role; // Main Org Role

  // Find project-specific role if in project context
  const projectMembership = isProjectContext
    ? user.projectMembers?.find((m) => m.projectId === projectId)
    : null;

  const projectRole = projectMembership?.role;

  const sections: NavSection[] = [];

  const isOperator = projectRole === 'FIELD_OPERATOR';

  // --- ORG CONTEXT ---
  // 1. Dashboard & Projects (Common) - Hide when in a specific project
  if (!isProjectContext) {
    const mainItems: NavItem[] = [
      { label: 'Inicio', to: '/', icon: Home, exact: true },
      { label: 'Proyectos', to: '/projects', icon: FolderKanban },
    ];
    sections.push({ items: mainItems });
  }

  // 2. Org Management (Admin/Director only)
  if (
    !isProjectContext &&
    ['ADMIN', 'ADMINISTRADOR', 'DIRECTOR', 'DIRECTOR_PMO'].includes(role)
  ) {
    sections.push({
      title: 'Organización',
      items: [
        { label: 'Usuarios', to: '/admin/users', icon: Users },
        { label: 'Constructores', to: '/admin/contractors', icon: Briefcase },
        { label: 'Materiales', to: '/admin/materials', icon: Boxes },
        { label: 'Configuración', to: '/settings', icon: Settings },
        { label: 'Reportes', to: '/reports', icon: BarChart2 },
      ],
    });
  }

  // If we are NOT in a project context, just return what we have so far
  if (!isProjectContext) {
    return sections;
  }

  // --- PROJECT CONTEXT ---
  // Determine effective permissions/view based on Project Role OR Org Role (Admin overrides)
  const isProjectAdmin =
    role === 'ADMIN' || role === 'ADMINISTRADOR' || projectRole === 'PROJECT_ADMIN';
  const isPM =
    role === 'PM' ||
    role === 'PROJECT_MANAGER' ||
    projectRole === 'PROJECT_MANAGER' ||
    projectRole === 'PM' ||
    projectRole === 'SUPERVISOR';
  const isExecutive = role === 'DIRECTOR' || projectRole === 'EXECUTIVE_VIEWER';
  // isOperator is already defined above

  // 1. Overview & Schedule (Everyone excluding Operator usually, but Operator might see basic info)
  const commonItems: NavItem[] = [];

  if (!isOperator) {
    commonItems.push({
      label: 'Resumen Proyecto',
      to: `/projects/${projectId}/overview`,
      icon: LayoutDashboard,
    });
    commonItems.push({
      label: 'Plan de Trabajo',
      to: `/projects/${projectId}/plan`,
      icon: Calendar,
    });

    if (currentProject?.enableScrum === true) {
      commonItems.push({
        label: 'Semanas de Obra (Agile)',
        to: `/projects/${projectId}/scrum`,
        icon: FolderKanban,
      });
    }
  }

  sections.push({ title: 'Contexto de Proyecto', items: commonItems });

  // 2. Execution / Field (Everyone)
  const fieldItems: NavItem[] = [];

  if (currentProject?.enableFieldManagement === true) {
    if (isOperator) {
      fieldItems.push({
        label: 'Dashboard de Campo',
        to: `/projects/${projectId}/field-operator`,
        icon: LayoutDashboard,
      });
    } else if (isProjectAdmin || isPM || isExecutive) {
      fieldItems.push({
        label: 'Dashboard de Campo',
        to: `/projects/${projectId}/field-dashboard`,
        icon: LayoutDashboard,
      });
    }
    fieldItems.push({ label: 'Actividad', to: `/projects/${projectId}/activity`, icon: Activity });
    fieldItems.push({
      label: 'Punch List',
      to: `/projects/${projectId}/punch`,
      icon: AlertTriangle,
    });
  }

  if (fieldItems.length > 0) {
    sections.push({ title: 'Gestión de Campo', items: fieldItems });
  }

  // 3. Management / Financials (Admins, PMs, Executives)
  if (isProjectAdmin || isPM || isExecutive) {
    const mgmtItems: NavItem[] = [];

    if (currentProject?.enableBudget === true) {
      mgmtItems.push({ label: 'Presupuesto', to: `/projects/${projectId}/budget`, icon: Banknote });
    }

    if (currentProject?.enableMaterials === true) {
      mgmtItems.push({ label: 'Materiales', to: `/projects/${projectId}/materials`, icon: Boxes });
      mgmtItems.push({
        label: 'Control Financiero',
        to: `/projects/${projectId}/financials`,
        icon: TrendingUp,
      });
    }

    mgmtItems.push({ label: 'Reportes', to: `/projects/${projectId}/reports`, icon: FileText });

    if (mgmtItems.length > 0) {
      sections.push({ title: 'Presupuesto', items: mgmtItems });
    }
  }

  // 4. Team & Settings (Admins, PMs)
  if (isProjectAdmin || isPM) {
    const adminItems: NavItem[] = [
      { label: 'Equipo', to: `/projects/${projectId}/team`, icon: Users },
      { label: 'Contratistas', to: `/projects/${projectId}/contractors`, icon: HardHat },
      { label: 'Configuración', to: `/projects/${projectId}/settings`, icon: Settings },
    ];
    sections.push({ title: 'Administración', items: adminItems });
  }

  return sections;
};
