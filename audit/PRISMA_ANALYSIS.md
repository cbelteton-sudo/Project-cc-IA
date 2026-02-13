# Prisma Schema Analysis

## Model Overview

**Total Models Detected**: 47

## Top 5 Scrum-Related Models

1.  **BacklogItem**
    - **Purpose**: Represents a unit of work (Epic, Story, Task, Bug) in the backlog.
    - **Key Relations**: Linked to `Project`, `User` (Assignee), `Sprint` (via SprintItem), and `ProjectActivity` (WBS link).

2.  **Sprint**
    - **Purpose**: Defines a time-boxed iteration of work.
    - **Features**: Start/End dates, Goal, Status tracking.

3.  **SprintItem**
    - **Purpose**: Junction table linking `BacklogItem` to `Sprint`.
    - **Key Fields**: `boardStatus` (TODO, IN_PROGRESS, etc.), `orderIndex` for board positioning.

4.  **DailyUpdate**
    - **Purpose**: Tracks daily progress/stand-up information from users.
    - **Key Relations**: Can be linked to `Sprint`, `BacklogItem`, or `ProjectActivity`. Includes photos and blocker information.

5.  **Impediment**
    - **Purpose**: Tracks blockers or issues slowing down the team.
    - **Key Fields**: Severity, Status, Owner, and links to proper Sprint/Backlog items.
