import { useParams } from 'react-router-dom';
import { ScrumDashboard } from '../components/scrum/ScrumDashboard';

export const ScrumPage = () => {
  const { id, projectId: oldProjectId } = useParams();
  const projectId = id || oldProjectId;

  if (!projectId) return <div>Project ID missing</div>;

  return (
    <div className="h-full w-full">
      <ScrumDashboard projectId={projectId} />
    </div>
  );
};
