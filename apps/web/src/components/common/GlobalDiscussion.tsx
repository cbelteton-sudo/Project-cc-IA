import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Trash2, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { commentsService, CommentReferenceType } from '../../services/comments';
import { usersService } from '../../services/users';
import { projectsService } from '../../services/projects';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface GlobalDiscussionProps {
  referenceType: CommentReferenceType;
  referenceId: string;
  projectId?: string;
}

export const GlobalDiscussion: React.FC<GlobalDiscussionProps> = ({
  referenceType,
  referenceId,
  projectId,
}) => {
  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ['users', projectId],
    queryFn: () => (projectId ? projectsService.getMembers(projectId) : usersService.findAll()),
  });
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', referenceType, referenceId],
    queryFn: () => commentsService.findAll(referenceType, referenceId),
    enabled: !!referenceId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: commentsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', referenceType, referenceId] });
      setText('');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message = error.response?.data?.message || 'Error al enviar el comentario';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: commentsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', referenceType, referenceId] });
      toast.success('Comentario eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar el comentario');
    },
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    // Check if the cursor is right after a mention word
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setMentionIndex(-1); // reset selection
    } else {
      setMentionQuery(null);
    }
  };

  const filteredUsers =
    mentionQuery !== null
      ? users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(mentionQuery)).slice(0, 5)
      : [];

  const insertMention = (name: string) => {
    if (inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart || 0;
      const textBeforeCursor = text.slice(0, cursorPosition);
      const textAfterCursor = text.slice(cursorPosition);

      const words = textBeforeCursor.split(/\s+/);
      words.pop(); // remove the '@query'

      const newTextBeforeCursor =
        (words.length > 0 ? words.join(' ') + ' ' : '') + `@${name.replace(/\s+/g, '')} `;

      setText(newTextBeforeCursor + textAfterCursor);
      setMentionQuery(null);
      setMentionIndex(-1);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = newTextBeforeCursor.length;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedUser = filteredUsers[mentionIndex >= 0 ? mentionIndex : 0];
        insertMention(selectedUser.name || selectedUser.email);
      } else if (e.key === 'Escape') {
        setMentionQuery(null);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    // Find all @mentions in the current text
    const mentionRegex = /@([\w.-]+)/g;
    const mentions = [...text.matchAll(mentionRegex)].map((m) => m[1].toLowerCase());

    // Reconstruct which users are currently mentioned
    const mentionedUserIds = users
      .filter((u) => {
        const collapsedName = (u.name || '').replace(/\s+/g, '').toLowerCase();
        return mentions.includes(collapsedName);
      })
      .map((u) => u.id);

    createMutation.mutate({
      text: text.trim(),
      referenceType,
      referenceId,
      projectId,
      mentionedUserIds,
    });
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Cargando comentarios...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Discusión</h3>
        <p className="text-sm text-gray-500">Menciona a alguien usando @nombre</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <UserCircle2 className="w-8 h-8 text-gray-400" />
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-gray-900 text-sm">
                      {/* TODO: Fetch user details if not hydrated */} Usuario
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  {(user?.userId === comment.createdBy || user?.role === 'platform_admin') && (
                    <button
                      onClick={() => deleteMutation.mutate(comment.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar comentario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 relative">
        {mentionQuery !== null && filteredUsers.length > 0 && (
          <div className="absolute bottom-full mb-1 left-4 w-64 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-10 text-sm">
            <ul className="max-h-48 overflow-y-auto m-0 p-0 list-none">
              {filteredUsers.map((u, i) => (
                <li
                  key={u.id}
                  className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-0 ${i === mentionIndex || (mentionIndex === -1 && i === 0) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => insertMention(u.name || u.email)}
                >
                  <div className="font-medium truncate">{u.name || 'Usuario sin nombre'}</div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comentario..."
            className="flex-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={createMutation.isPending}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || createMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};
