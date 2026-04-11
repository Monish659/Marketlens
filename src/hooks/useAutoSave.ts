import { useEffect, useRef } from 'react';
import useSessionStore from '@/stores/sessionStore';

interface UseAutoSaveOptions {
  enabled?: boolean;
  delay?: number; // milliseconds
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const { enabled = true, delay = 2000 } = options;
  
  const {
    currentSession,
    hasUnsavedChanges,
    autoSaveSession,
    autoSaveEnabled
  } = useSessionStore();
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  useEffect(() => {
    if (!enabled || !autoSaveEnabled || !currentSession || !hasUnsavedChanges) {
      return;
    }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Schedule auto-save
    timeoutRef.current = setTimeout(() => {
      autoSaveSession().catch(error => {
        console.error('Auto-save failed:', error);
      });
    }, delay);
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, autoSaveEnabled, currentSession, hasUnsavedChanges, delay, autoSaveSession]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
