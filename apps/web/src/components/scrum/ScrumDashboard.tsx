import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrumMetricsTab } from './ScrumMetricsTab';
import { BacklogView } from './BacklogView';
import { SprintBoard } from './SprintBoard';
import { SprintPlanning } from './SprintPlanning';
import { SprintAssignmentsReport } from '@/pages/SprintAssignmentsReport';
import { LayoutDashboard, ListTodo, KanbanSquare, CalendarClock, FileText } from 'lucide-react';

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
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-6 print:h-auto print:min-h-0 print:overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Tabs can go here or below title */}
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col overflow-hidden w-full print:overflow-visible print:h-auto print:min-h-0"
      >
        <TabsList className="grid w-full grid-cols-5 lg:w-[800px] bg-white border border-gray-200 flex-shrink-0">
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
            Lista de pendientes
          </TabsTrigger>
          <TabsTrigger
            value="planning"
            className="data-[state=active]:bg-field-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <CalendarClock className="w-4 h-4 mr-2" />
            Planificación
          </TabsTrigger>
          <TabsTrigger
            value="board"
            className="data-[state=active]:bg-field-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <KanbanSquare className="w-4 h-4 mr-2" />
            Tablero
          </TabsTrigger>
          <TabsTrigger
            value="report"
            className="data-[state=active]:bg-field-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Reporte
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0 mt-6 print:overflow-visible print:h-auto">
          <TabsContent
            value="dashboard"
            className="m-0 h-full flex-1 flex flex-col focus-visible:outline-none overflow-hidden min-h-0"
          >
            <ScrumMetricsTab projectId={projectId} />
          </TabsContent>

          <TabsContent
            value="backlog"
            className="m-0 h-full flex-1 flex flex-col focus-visible:outline-none overflow-hidden min-h-0"
          >
            <BacklogView projectId={projectId} />
          </TabsContent>

          <TabsContent
            value="planning"
            className="m-0 h-full flex-1 flex flex-col focus-visible:outline-none overflow-hidden min-h-0"
          >
            <SprintPlanning
              projectId={projectId}
              onSprintStarted={() => handleTabChange('board')}
            />
          </TabsContent>

          <TabsContent
            value="board"
            className="m-0 h-full flex-1 flex flex-col focus-visible:outline-none overflow-hidden min-h-0"
          >
            <SprintBoard projectId={projectId} />
          </TabsContent>

          <TabsContent
            value="report"
            className="m-0 h-full flex-1 flex flex-col focus-visible:outline-none overflow-hidden min-h-0 print:overflow-visible print:h-auto"
          >
            <SprintAssignmentsReport projectId={projectId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
