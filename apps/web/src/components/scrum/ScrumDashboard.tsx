import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrumMetricsTab } from './ScrumMetricsTab';
import { BacklogView } from './BacklogView';
import { SprintBoard } from './SprintBoard';
import { SprintPlanning } from './SprintPlanning';
import { LayoutDashboard, ListTodo, KanbanSquare, CalendarClock, LayoutGrid } from 'lucide-react';
import { EisenhowerMatrix } from '../eisenhower/EisenhowerMatrix';

export function ScrumDashboard({ projectId }: { projectId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set('tab', value);
      return prev;
    });
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Tabs can go here or below title */}
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col overflow-hidden w-full"
      >
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px] bg-white border border-gray-200 flex-shrink-0">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-field-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="backlog"
            className="data-[state=active]:bg-field-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Backlog
          </TabsTrigger>
          <TabsTrigger
            value="board"
            className="data-[state=active]:bg-field-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <KanbanSquare className="w-4 h-4 mr-2" />
            Tablero
          </TabsTrigger>
          <TabsTrigger
            value="planning"
            className="data-[state=active]:bg-field-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <CalendarClock className="w-4 h-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger
            value="eisenhower"
            className="data-[state=active]:bg-field-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Matriz
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden mt-6">
          <TabsContent value="dashboard" className="m-0 h-full focus-visible:outline-none">
            <ScrumMetricsTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="backlog" className="m-0 h-full focus-visible:outline-none">
            <BacklogView projectId={projectId} />
          </TabsContent>

          <TabsContent value="board" className="m-0 h-full focus-visible:outline-none">
            <SprintBoard projectId={projectId} />
          </TabsContent>

          <TabsContent value="planning" className="m-0 h-full focus-visible:outline-none">
            <SprintPlanning
              projectId={projectId}
              onSprintStarted={() => handleTabChange('board')}
            />
          </TabsContent>

          <TabsContent value="eisenhower" className="m-0 h-full focus-visible:outline-none">
            <EisenhowerMatrix />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
