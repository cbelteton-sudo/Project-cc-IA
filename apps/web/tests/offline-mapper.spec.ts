import { describe, it, expect } from 'vitest';
import { mapOfflinePayloadToV1 } from '../src/services/field-records';

describe('OfflineManager Payload Mapper (Canonical V1)', () => {
  it('maps legacy QueueItem payload correctly to Canonical FieldRecord format', () => {
    const legacyPayload = {
      activityId: 'ACT-001',
      activityName: 'Excavación Profunda',
      status: 'In Progress',
      note: 'Found some rocks',
      date: '2023-10-15T00:00:00Z',
    };

    const projectId = 'PROJ-123';

    const mapped = mapOfflinePayloadToV1(legacyPayload, projectId);

    expect(mapped).toEqual({
      type: 'DAILY_ENTRY',
      projectId: 'PROJ-123',
      status: 'In Progress',
      content: {
        scheduleActivityId: 'ACT-001',
        activityName: 'Excavación Profunda',
        note: 'Found some rocks',
        dateString: '2023-10-15T00:00:00Z',
      },
    });
  });

  it('handles missing optional fields successfully', () => {
    const legacyPayload = {
      activityId: 'ACT-002',
      activityName: 'Fundición',
      status: 'Completed',
      date: '2023-10-16T00:00:00Z',
    };

    const projectId = 'PROJ-123';
    const mapped = mapOfflinePayloadToV1(legacyPayload, projectId);

    expect(mapped.type).toBe('DAILY_ENTRY');
    expect(mapped.content.note).toBeUndefined();
    expect(mapped.content.activityName).toBe('Fundición');
  });
});
