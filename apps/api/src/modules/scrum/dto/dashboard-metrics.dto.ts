export class RecentSprintDto {
  name: string;
  planned: number;
  completed: number;
}

export class DashboardMetricsDto {
  activeSprintProgress: number;
  velocity: number;
  totalBacklogItems: number;
  itemsCompletedThisMonth: number;
  openImpediments: number;
  sprintHealth: number;
  recentSprints: RecentSprintDto[];
}
