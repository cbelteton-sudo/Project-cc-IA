import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface QuickCaptureState {
  isOpen: boolean;
  projectId?: string;
  preselectedActivityId?: string;
}

interface QuickCaptureContextType {
  isOpen: boolean;
  openCapture: (projectId?: string, activityId?: string) => void;
  closeCapture: () => void;
  state: QuickCaptureState;
}

const QuickCaptureContext = createContext<QuickCaptureContextType | undefined>(undefined);

export const QuickCaptureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<QuickCaptureState>({ isOpen: false });

  const openCapture = (projectId?: string, activityId?: string) => {
    setState({ isOpen: true, projectId, preselectedActivityId: activityId });
  };

  const closeCapture = () => {
    setState({ isOpen: false, projectId: undefined, preselectedActivityId: undefined });
  };

  return (
    <QuickCaptureContext.Provider
      value={{ isOpen: state.isOpen, openCapture, closeCapture, state }}
    >
      {children}
    </QuickCaptureContext.Provider>
  );
};

export const useQuickCapture = () => {
  const context = useContext(QuickCaptureContext);
  if (!context) {
    throw new Error('useQuickCapture must be used within a QuickCaptureProvider');
  }
  return context;
};
