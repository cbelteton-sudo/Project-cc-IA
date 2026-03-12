import { api } from '../lib/api';

export const CommentReferenceType = {
  PROJECT: 'PROJECT',
  ACTIVITY: 'ACTIVITY',
  MATERIAL: 'MATERIAL',
  ISSUE: 'ISSUE',
} as const;

export type CommentReferenceType = keyof typeof CommentReferenceType;

export interface Comment {
  id: string;
  text: string;
  projectId?: string;
  activityId?: string;
  materialId?: string;
  issueId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const commentsService = {
  create: async (data: {
    text: string;
    referenceType: CommentReferenceType;
    referenceId: string;
    projectId?: string;
    mentionedUserIds?: string[];
  }): Promise<Comment> => {
    const response = await api.post('/comments', data);
    return response.data;
  },

  findAll: async (referenceType: CommentReferenceType, referenceId: string): Promise<Comment[]> => {
    const response = await api.get('/comments', {
      params: { referenceType, referenceId },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },
};
