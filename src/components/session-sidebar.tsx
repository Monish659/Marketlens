"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import useSessionStore from '@/stores/sessionStore';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle
} from 'lucide-react';

interface SessionSidebarProps {
  projectId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSessionSelect?: (sessionId: string) => void;
}

export function SessionSidebar({ 
  projectId, 
  isCollapsed = false, 
  onToggleCollapse,
  onSessionSelect 
}: SessionSidebarProps) {
  const {
    sessions,
    currentSession,
    isLoadingSessions,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    listSessions,
    loadSession,
    deleteSession,
    createSession
  } = useSessionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    if (projectId) {
      listSessions(projectId);
    }
  }, [projectId, listSessions]);

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session =>
    session.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSessionClick = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      onSessionSelect?.(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleNewSession = async () => {
    try {
      const newSession = await createSession(
        projectId, 
        'New analysis session...',
        `New Session - ${new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`
      );
      onSessionSelect?.(newSession._id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSessionPreview = (session: any) => {
    const prompt = session.prompt;
    return prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;
  };

  const getSessionMetrics = (session: any) => {
    const metrics = session.analysisState?.metrics;
    if (!metrics || metrics.totalResponses === 0) return null;
    
    return {
      score: Math.round(metrics.score),
      responses: metrics.totalResponses,
      engagement: Math.round(metrics.viralCoefficient * 100)
    };
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewSession}
          className="mb-2"
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 flex flex-col items-center space-y-2 overflow-y-auto">
          {sessions.slice(0, 5).map((session) => (
            <Button
              key={session._id}
              variant={currentSession?._id === session._id ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSessionClick(session._id)}
              className="w-10 h-10 p-0"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          ))}
        </div>
        
        {hasUnsavedChanges && (
          <div className="mt-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Analysis Sessions</h2>
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <div className="flex items-center text-amber-600 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved
              </div>
            )}
            {isSaving && (
              <div className="flex items-center text-blue-600 text-xs">
                <Save className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* New Session Button */}
        <Button
          onClick={handleNewSession}
          className="w-full mb-3"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingSessions ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No sessions match your search' : 'No sessions yet'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredSessions.map((session) => {
              const metrics = getSessionMetrics(session);
              const isActive = currentSession?._id === session._id;
              
              return (
                <motion.div
                  key={session._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative group"
                >
                  <Card
                    className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
                      isActive 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleSessionClick(session._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {session.sessionName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {getSessionPreview(session)}
                        </p>
                        
                        {/* Metrics */}
                        {metrics && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              Score: {metrics.score}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {metrics.responses} responses
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(session.lastAccessedAt)}
                          </div>
                          
                          {session.uiState?.simulationType && (
                            <Badge variant="outline" className="text-xs">
                              {session.uiState.simulationType}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(session._id);
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Status */}
      {lastSavedAt && (
        <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
          Last saved: {new Date(lastSavedAt).toLocaleTimeString()}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Delete Session</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this analysis session? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteSession(showDeleteConfirm)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
