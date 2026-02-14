export class RecentSprintDto {
  name: string;
  planned: number;
  completed: number;
  startDate: string;
  endDate: string;
}

export class ItemsByStatusDto {
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export class DashboardMetricsDto {
  activeSprintName: string;
  activeSprintProgress: number;
  velocity: number;
  totalBacklogItems: number;
  itemsByStatus: ItemsByStatusDto;
  openImpediments: number;
  sprintHealth: 'on_track' | 'ahead' | 'behind';
  recentSprints: RecentSprintDto[];
  teamSize: number;
}
