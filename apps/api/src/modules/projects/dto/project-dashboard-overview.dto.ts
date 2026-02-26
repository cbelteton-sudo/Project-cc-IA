export class ProjectDashboardOverview {
  health: {
    timeElapsedPercent: number;
    tasksCompletionPercent: number;
    workloadOverdueTasks: number;
    progressPercent: number;
    costBudgetPercent: number;
  };
  tasks: {
    name: string;
    value: number;
    color: string;
  }[];
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
    actual: number;
    budget: number;
  }[];
  workload: {
    name: string;
    completed: number;
    remaining: number;
    overdue: number;
  }[];
}
