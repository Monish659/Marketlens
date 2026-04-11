import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AnalysisSession {
  _id: string;
  projectId: string;
  userId: string;
  sessionName: string;
  prompt: string;
  analysisState: {
    niche: string;
    nicheExtracted: boolean;
    selectedUsers: any[];
    opinions: any[];
    metrics: {
      score: number;
      totalResponses: number;
      fullAttention: number;
      partialAttention: number;
      ignored: number;
      viralCoefficient: number;
      avgSentiment: number;
    };
    globeDots: any[];
    reactions: any[];
    insights: any;
    nicheInfo: any;
    nichePersonaIds?: number[];
    audienceConstraints?: {
      budget?: string;
      riskTolerance?: string;
      preferredRegion?: string;
    };
  };
  uiState: {
    viewMode: 'niche' | 'global';
    selectedPersonaId?: number;
    expandedNodes?: string[];
    activeTab?: string;
    simulationType?: string;
    currentSociety?: string;
    processedPersonas?: number;
    currentProcessingStep?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

interface SessionStore {
  // Current session state
  currentSession: AnalysisSession | null;
  
  // Session list for sidebar
  sessions: AnalysisSession[];
  
  // Loading states
  isLoadingSessions: boolean;
  isLoadingSession: boolean;
  isSaving: boolean;
  
  // Auto-save state
  autoSaveEnabled: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  createSession: (projectId: string, prompt: string, sessionName?: string) => Promise<AnalysisSession>;
  loadSession: (sessionId: string) => Promise<AnalysisSession>;
  updateSession: (updates: Partial<AnalysisSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  listSessions: (projectId: string) => Promise<void>;
  
  // State management
  setCurrentSession: (session: AnalysisSession | null) => void;
  updateCurrentSessionState: (analysisState?: any, uiState?: any) => void;
  
  // Auto-save functionality
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  autoSaveSession: () => Promise<void>;
  markUnsavedChanges: () => void;
  clearUnsavedChanges: () => void;
}

const useSessionStore = create<SessionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      isLoadingSessions: false,
      isLoadingSession: false,
      isSaving: false,
      autoSaveEnabled: true,
      lastSavedAt: null,
      hasUnsavedChanges: false,

      // Create new session
      createSession: async (projectId: string, prompt: string, sessionName?: string) => {
        try {
          const tokens = localStorage.getItem('auth_tokens');
          if (!tokens) throw new Error('Authentication required');
          
          const parsedTokens = JSON.parse(tokens);
          const accessToken = parsedTokens.access_token;
          
          const userData = localStorage.getItem('user_data');
          const parsedUser = userData ? JSON.parse(userData) : null;
          const resolvedEmail = parsedUser?.email || parsedTokens.email || parsedTokens.user?.email;
          
          // Generate session name if not provided
          const finalSessionName = sessionName || prompt.substring(0, 50) || `Session ${new Date().toLocaleString()}`;
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };

          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }

          if (resolvedEmail) {
            headers['x-user-email'] = resolvedEmail;
          } else if (parsedTokens.sub || parsedTokens.user_id) {
            headers['x-user-id'] = parsedTokens.sub || parsedTokens.user_id;
          }
          
          console.log('📝 [CREATE-SESSION] Creating session:', { projectId, prompt: prompt.substring(0, 50), sessionName: finalSessionName });
          
          const response = await fetch('/api/sessions', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              projectId,
              prompt,
              sessionName: finalSessionName
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create session');
          }
          
          const data = await response.json();
          const newSession = data.session;
          
          set(state => ({
            currentSession: newSession,
            sessions: [newSession, ...state.sessions],
            hasUnsavedChanges: false,
            lastSavedAt: new Date()
          }));
          
          return newSession;
        } catch (error) {
          console.error('Error creating session:', error);
          throw error;
        }
      },

      // Load specific session
      loadSession: async (sessionId: string) => {
        set({ isLoadingSession: true });
        
        try {
          const tokens = localStorage.getItem('auth_tokens');
          if (!tokens) throw new Error('Authentication required');
          
          const parsedTokens = JSON.parse(tokens);
          const userData = localStorage.getItem('user_data');
          const parsedUser = userData ? JSON.parse(userData) : null;
          const resolvedEmail = parsedUser?.email || parsedTokens.email || parsedTokens.user?.email;
          const resolvedUserId = parsedTokens.sub || parsedTokens.user_id;
          const headers: Record<string, string> = {};
          
          if (parsedTokens.access_token) {
            headers['Authorization'] = `Bearer ${parsedTokens.access_token}`;
          }
          if (resolvedEmail) {
            headers['x-user-email'] = resolvedEmail;
          } else if (resolvedUserId) {
            headers['x-user-id'] = resolvedUserId;
          }
          
          const response = await fetch(`/api/sessions/${sessionId}`, {
            headers
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load session');
          }
          
          const data = await response.json();
          const session = data.session;
          
          set({
            currentSession: session,
            hasUnsavedChanges: false,
            lastSavedAt: new Date(),
            isLoadingSession: false
          });
          
          return session;
        } catch (error) {
          console.error('Error loading session:', error);
          set({ isLoadingSession: false });
          throw error;
        }
      },

      // Update session
      updateSession: async (updates: Partial<AnalysisSession>) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        set({ isSaving: true });
        
        try {
          const tokens = localStorage.getItem('auth_tokens');
          if (!tokens) throw new Error('Authentication required');
          
          const parsedTokens = JSON.parse(tokens);
          const userData = localStorage.getItem('user_data');
          const parsedUser = userData ? JSON.parse(userData) : null;
          const resolvedEmail = parsedUser?.email || parsedTokens.email || parsedTokens.user?.email;
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parsedTokens.access_token}`
          };
          
          if (resolvedEmail) {
            headers['x-user-email'] = resolvedEmail;
          } else if (parsedTokens.sub || parsedTokens.user_id) {
            headers['x-user-id'] = parsedTokens.sub || parsedTokens.user_id;
          }
          
          const response = await fetch(`/api/sessions/${currentSession._id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update session');
          }
          
          const data = await response.json();
          const updatedSession = data.session;
          
          set(state => ({
            currentSession: updatedSession,
            sessions: state.sessions.map(s => 
              s._id === updatedSession._id ? updatedSession : s
            ),
            hasUnsavedChanges: false,
            lastSavedAt: new Date(),
            isSaving: false
          }));
          
        } catch (error) {
          console.error('Error updating session:', error);
          set({ isSaving: false });
          throw error;
        }
      },

      // Delete session
      deleteSession: async (sessionId: string) => {
        try {
          const tokens = localStorage.getItem('auth_tokens');
          if (!tokens) throw new Error('Authentication required');
          
          const parsedTokens = JSON.parse(tokens);
          const userData = localStorage.getItem('user_data');
          const parsedUser = userData ? JSON.parse(userData) : null;
          const resolvedEmail = parsedUser?.email || parsedTokens.email || parsedTokens.user?.email;
          const resolvedUserId = parsedTokens.sub || parsedTokens.user_id;
          const headers: Record<string, string> = {};
          
          if (parsedTokens.access_token) {
            headers['Authorization'] = `Bearer ${parsedTokens.access_token}`;
          }
          if (resolvedEmail) {
            headers['x-user-email'] = resolvedEmail;
          } else if (resolvedUserId) {
            headers['x-user-id'] = resolvedUserId;
          }
          
          const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE',
            headers
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete session');
          }
          
          set(state => ({
            sessions: state.sessions.filter(s => s._id !== sessionId),
            currentSession: state.currentSession?._id === sessionId ? null : state.currentSession
          }));
          
        } catch (error) {
          console.error('Error deleting session:', error);
          throw error;
        }
      },

      // List sessions for project
      listSessions: async (projectId: string) => {
        set({ isLoadingSessions: true });
        
        try {
          const tokens = localStorage.getItem('auth_tokens');
          if (!tokens) throw new Error('Authentication required');
          
          const parsedTokens = JSON.parse(tokens);
          
          const userData = localStorage.getItem('user_data');
          const parsedUser = userData ? JSON.parse(userData) : null;
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (parsedTokens.access_token) {
            headers['Authorization'] = `Bearer ${parsedTokens.access_token}`;
            if (parsedUser?.email) {
              headers['x-user-email'] = parsedUser.email;
            }
          } else {
            headers['x-user-id'] = parsedTokens.sub || parsedTokens.user_id || 'dev_user_' + Date.now();
          }
          
          const response = await fetch(`/api/sessions?projectId=${projectId}`, { headers });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to list sessions');
          }
          
          const data = await response.json();
          
          set({
            sessions: data.sessions,
            isLoadingSessions: false
          });
          
        } catch (error) {
          console.error('Error listing sessions:', error);
          set({ isLoadingSessions: false });
          throw error;
        }
      },

      // Set current session
      setCurrentSession: (session: AnalysisSession | null) => {
        set({
          currentSession: session,
          hasUnsavedChanges: false,
          lastSavedAt: session ? new Date() : null
        });
      },

      // Update current session state (for real-time updates)
      updateCurrentSessionState: (analysisState?: any, uiState?: any) => {
        set(state => {
          if (!state.currentSession) return state;
          
          const updatedSession = {
            ...state.currentSession,
            ...(analysisState && { analysisState: { ...state.currentSession.analysisState, ...analysisState } }),
            ...(uiState && { uiState: { ...state.currentSession.uiState, ...uiState } })
          };
          
          return {
            currentSession: updatedSession,
            hasUnsavedChanges: true
          };
        });
      },

      // Auto-save controls
      enableAutoSave: () => set({ autoSaveEnabled: true }),
      disableAutoSave: () => set({ autoSaveEnabled: false }),

      // Auto-save session
      autoSaveSession: async () => {
        const { currentSession, hasUnsavedChanges, autoSaveEnabled, isSaving } = get();
        
        if (!currentSession || !hasUnsavedChanges || !autoSaveEnabled || isSaving) {
          return;
        }
        
        try {
          await get().updateSession({
            analysisState: currentSession.analysisState,
            uiState: currentSession.uiState
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      },

      // Mark unsaved changes
      markUnsavedChanges: () => set({ hasUnsavedChanges: true }),

      // Clear unsaved changes
      clearUnsavedChanges: () => set({ hasUnsavedChanges: false })
    }),
    {
      name: 'session-store'
    }
  )
);

export default useSessionStore;
