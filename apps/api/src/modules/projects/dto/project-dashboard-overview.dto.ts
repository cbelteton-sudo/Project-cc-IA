export class ProjectDashboardOverview {
  health: {
    timeElapsedPercent: number;
    progressPercent: number;
    costBudgetPercent: number;
  };
  progress: {
    name: string;
    percentage: number;
    color: string;
  }[];
  activeSprint?: {
    id: string;
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    completedTasks: number;
    totalTasks: number;
    blockedTasks: number;
  } | null;
  costs: {
    name: string;
    planned: number;
    actual: number | null;
    budget: number;
  }[];
  milestones: {
    name: string;
    date: string;
    status: string;
  }[];
  constructorProgress: {
    name: string;
    progress: number;
    color: string;
  }[];
  blockers: {
    totalBlocked: number;
    categories: {
      reason: string;
      count: number;
      color: string;
    }[];
  };
}
