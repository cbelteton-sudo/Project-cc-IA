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
  time: {
    name: string;
    planned: number;
    actual: number;
  }[];
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
