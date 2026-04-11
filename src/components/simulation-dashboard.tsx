"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThreeJSGlobeWithDots } from "@/components/threejs-globe-with-dots";
import useSessionStore from '@/stores/sessionStore';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Vapi from '@vapi-ai/web';
import { 
  ChevronDown, 
  Plus, 
  Share2, 
  MessageSquare, 
  Info,
  X,
  FileText,
  Edit3,
  Globe,
  Megaphone,
  Linkedin,
  Instagram,
  Twitter,
  Video,
  Mail,
  Package,
  HelpCircle,
  Phone,
  Menu,
  Save,
  AlertCircle,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Check
} from 'lucide-react';

interface Persona {
  interests: any;
  personaId: number;
  name: string;
  email?: string; // Auth0 user email
  title: string;
  location: {
    city: string;
    country: string;
    coordinates: {
      type: string;
      coordinates: [number, number]; // [lon, lat]
    };
  };
  demographics: {
    generation: string;
    gender: string;
    ageRange: string;
  };
  professional: {
    seniority: string;
    primaryIndustry: string;
    companySize: string;
  };
  psychographics: {
    techAdoption: number;
    influenceScore: number;
  };
  // Optional user_metadata for Auth0 user objects that wrap persona data
  user_metadata?: Persona;
}

interface Reaction {
  personaId: number;
  attention: 'full' | 'partial' | 'ignore';
  reason: string;
  comment?: string;
  sentiment: number;
  persona?: Persona;
}

interface SimulationMetrics {
  score: number;
  fullAttention: number;
  partialAttention: number;
  ignored: number;
  totalResponses: number;
  viralCoefficient: number;
  avgSentiment: number;
}

type SimulationType = 'project-idea' | 'linkedin' | 'instagram' | 'twitter' | 'tiktok' | 'article' | 'website' | 'ad' | 'email' | 'email-subject' | 'product';

export function SimulationDashboard({ user, projectId }: { user: any; projectId?: string }) {
  // Session management
  const {
    currentSession,
    sessions,
    isLoadingSessions,
    isSaving,
    hasUnsavedChanges,
    createSession,
    loadSession,
    updateSession,
    deleteSession,
    listSessions,
    updateCurrentSessionState,
    markUnsavedChanges
  } = useSessionStore();

  // Delete session handler
  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent session selection when clicking delete
    
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        await deleteSession(sessionId);
        
        // If we deleted the current session, redirect to project without session
        if (currentSession?._id === sessionId) {
          const newUrl = `/dashboard?project=${projectId}`;
          router.replace(newUrl);
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
        alert('Failed to delete session. Please try again.');
      }
    }
  };

  // URL and routing
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [postContent, setPostContent] = useState('');
  const [currentPost, setCurrentPost] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    score: 0,
    totalResponses: 0,
    fullAttention: 0,
    partialAttention: 0,
    ignored: 0,
    viralCoefficient: 0,
    avgSentiment: 0
  });
  const [previousMetrics, setPreviousMetrics] = useState({
    score: 0,
    totalResponses: 0,
    fullAttention: 0,
    partialAttention: 0,
    ignored: 0,
    viralCoefficient: 0,
    avgSentiment: 0
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<SimulationType | null>('project-idea'); // Default to 'project-idea' for idea pitching
  const [insights, setInsights] = useState<any>(null);
  const [credits, setCredits] = useState(50);
  
  // Refs for polling management
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState('Original');
  const [globeDots, setGlobeDots] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [notifications, setNotifications] = useState<Array<{id: string, persona: string, message: string, type: 'full' | 'partial' | 'ignore', timestamp: number}>>([]);
  const [notifiedPersonaIds, setNotifiedPersonaIds] = useState<Set<number>>(new Set());
  const [processedPersonas, setProcessedPersonas] = useState(0);
  const [currentProcessingStep, setCurrentProcessingStep] = useState('');
  const [viewMode, setViewMode] = useState<'niche' | 'global'>('global');
  const [isLoadingGlobalUsers, setIsLoadingGlobalUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Persona[]>([]);
  const [hasEnteredPrompt, setHasEnteredPrompt] = useState(false);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [allUsers, setAllUsers] = useState<Persona[]>([]);
  const [nichePersonaIds, setNichePersonaIds] = useState<number[]>([]);
  
  // Right sidebar resizing
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(384); // w-96 = 24rem = 384px (original size)
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);
  const rightResizeRef = useRef<{ startX: number; startWidth: number }>({ startX: 0, startWidth: 384 });

  const handleRightResizeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsResizingRight(true);
    rightResizeRef.current = {
      startX: event.clientX,
      startWidth: rightSidebarWidth,
    };
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRight) return;
      const deltaX = event.clientX - rightResizeRef.current.startX;
      let nextWidth = rightResizeRef.current.startWidth + deltaX;
      nextWidth = Math.max(320, Math.min(800, nextWidth));
      setRightSidebarWidth(nextWidth);
    };
    const handleMouseUp = () => {
      if (isResizingRight) setIsResizingRight(false);
    };
    if (isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingRight]);
  const [isSelectingNiche, setIsSelectingNiche] = useState(false);
  const [nicheInfo, setNicheInfo] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<Array<{persona: Persona, reaction: any}>>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [justRefined, setJustRefined] = useState(false);
  const [hasRunFocusGroup, setHasRunFocusGroup] = useState(false);
  const [hasCompletedFirstAnalysis, setHasCompletedFirstAnalysis] = useState(false);
  const [isGlobalDeployment, setIsGlobalDeployment] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState('');
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [isGeneratingImprovedPrompt, setIsGeneratingImprovedPrompt] = useState(false);
  
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const isGeneratingFeedbackRef = useRef<boolean>(false); // Add this ref
  const isGeneratingImprovedPromptRef = useRef<boolean>(false); // Add this ref for improved prompt

  // Load session from URL on mount and fetch initial data
  useEffect(() => {
    if (projectId) {
      listSessions(projectId);
      
      if (sessionId && !isSelectingNiche && !isRunningAnalysis) {
        loadSession(sessionId).then((session) => {
          restoreSessionState(session);
        }).catch((error) => {
          console.error('Failed to load session from URL:', error);
          router.replace(`/dashboard?project=${projectId}`);
        });
      }
      
      fetchProject();
    }
    
    // Load personas from local JSON file (primary method)
    loadLocalPersonas();
  }, [projectId, sessionId]);

  // Restore session state
  const restoreSessionState = (session: any) => {
    if (!session) return;

    const { analysisState, uiState } = session;
    
    // Restore analysis state
    if (analysisState) {
      setPostContent(session.prompt || '');
      setCurrentPost(session.prompt || '');
      // Only restore selectedUsers if we don't already have current users
      if (selectedUsers.length === 0) {
        setSelectedUsers(analysisState.selectedUsers || []);
      }
      
      setReactions(analysisState.reactions || []);
      setMetrics(analysisState.metrics || {
        score: 0,
        totalResponses: 0,
        fullAttention: 0,
        partialAttention: 0,
        ignored: 0,
        viralCoefficient: 0,
        avgSentiment: 0
      });
      setGlobeDots(analysisState.globeDots || []);
      setInsights(analysisState.insights);
      setNicheInfo(analysisState.nicheInfo);
      
      // Set hasEnteredPrompt based on current selectedUsers state, not restored state
      const currentSelectedUsers = selectedUsers.length > 0 ? selectedUsers : (analysisState.selectedUsers || []);
      setHasEnteredPrompt(currentSelectedUsers.length > 0);
      
      // Restore niche persona IDs for globe highlighting - only if we don't have current ones
      if (nichePersonaIds.length === 0) {
        if (analysisState.nichePersonaIds) {
          setNichePersonaIds(analysisState.nichePersonaIds);
        } else if (currentSelectedUsers.length > 0) {
          // Derive from current selected users
          const nicheIds = currentSelectedUsers.map((u: any) => {
            const persona = u.user_metadata || u;
            return persona.personaId;
          });
          setNichePersonaIds(nicheIds);
        }
      }
    }

    // Restore UI state
    if (uiState) {
      setViewMode(uiState.viewMode || 'global');
      setSelectedType((uiState.simulationType as SimulationType) || 'project-idea');
      setProcessedPersonas(uiState.processedPersonas || 0);
      setCurrentProcessingStep(uiState.currentProcessingStep || '');
      if (uiState.selectedPersonaId) {
        const persona = analysisState?.selectedUsers?.find((u: any) => 
          (u.user_metadata || u).personaId === uiState.selectedPersonaId
        );
        setSelectedPersona(persona || null);
      }
    }
  };

  // Auto-save functionality with debouncing
  const scheduleAutoSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(async () => {
      if (currentSession && hasUnsavedChanges) {
        try {
          await updateSession({
            analysisState: {
              niche: nicheInfo?.nicheDescription || '',
              nicheExtracted: selectedUsers.length > 0,
              selectedUsers,
              opinions: reactions,
              metrics,
              globeDots,
              reactions,
              insights,
              nicheInfo,
              nichePersonaIds
            },
            uiState: {
              viewMode,
              simulationType: selectedType || 'project-idea',
              processedPersonas,
              currentProcessingStep
            }
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 2000); // 2 second debounce
  };

  // Track state changes for auto-save
  useEffect(() => {
    if (currentSession) {
      const analysisState = {
        niche: nicheInfo?.nicheDescription || '',
        nicheExtracted: selectedUsers.length > 0,
        selectedUsers,
        opinions: [],
        metrics,
        globeDots,
        reactions,
        insights,
        nicheInfo,
        nichePersonaIds
      };

      const uiState = {
        viewMode,
        selectedPersonaId: selectedPersona ? (selectedPersona.user_metadata || selectedPersona).personaId : undefined,
        simulationType: selectedType,
        processedPersonas,
        currentProcessingStep
      };

      updateCurrentSessionState(analysisState, uiState);
      markUnsavedChanges();
      scheduleAutoSave();
    }
  }, [
    selectedUsers, reactions, metrics, globeDots, insights, nicheInfo,
    viewMode, selectedPersona, selectedType, 
    processedPersonas, currentProcessingStep, hasEnteredPrompt
  ]);

  // Create new session when starting analysis
  const createNewSession = async (prompt: string) => {
    if (!projectId) return null;
    
    try {
      const session = await createSession(projectId, prompt);
      
      // Update URL to include session ID
      const newUrl = `/dashboard?project=${projectId}&session=${session._id}`;
      router.replace(newUrl);
      
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      alert(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Create new test/session
  const handleCreateNewTest = async () => {
    if (!projectId) return;
    
    // Use empty prompt for new session
    const defaultPrompt = '';
    
    try {
      const session = await createSession(projectId, defaultPrompt);
      
      // Clear current analysis state for fresh start
      setSelectedUsers([]);
      setReactions([]);
      setMetrics({
        score: 0,
        totalResponses: 0,
        fullAttention: 0,
        partialAttention: 0,
        ignored: 0,
        viralCoefficient: 0,
        avgSentiment: 0
      });
      setGlobeDots([]);
      setPostContent('');
      setCurrentPost('');
      
      // Set default simulation type to project-idea
      setSelectedType('project-idea');
      
      // Update URL to new session
      const newUrl = `/dashboard?project=${projectId}&session=${session._id}`;
      router.replace(newUrl);
      
      // Don't show type selector - go directly to project idea analysis
      // setShowTypeSelector(true); // Removed this line
      
    } catch (error) {
      console.error('Failed to create new session:', error);
      alert(`Failed to create new session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle session selection from sidebar
  const handleSessionSelect = (sessionId: string) => {
    const newUrl = `/dashboard?project=${projectId}&session=${sessionId}`;
    router.push(newUrl);
  };

  const fetchProject = async () => {
    try {
      const tokens = localStorage.getItem('auth_tokens');
      if (!tokens) return;

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
      
      const response = await fetch(`/api/projects/${projectId}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      }
      // If project doesn't exist, just continue without it
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  // Convert all Auth0 users to globe dots (initially greyed out) - only run on initial load
  useEffect(() => {
    // Only set initial dots if we don't have any dots yet and we're not in niche selection mode
    if (allUsers.length > 0 && globeDots.length === 0 && nichePersonaIds.length === 0) {
      console.log('🔍 [DEBUG] Initial globe dots setup for', allUsers.length, 'users');
      
      // Show all loaded users (up to 700) as grey dots initially
      const dots = allUsers.map(persona => {
        // Only show @fake.com users
        const email = persona.email || '';
        if (!email.endsWith('@fake.com')) {
          return null;
        }
        
        // Handle both Auth0 user structure (with user_metadata) and direct persona structure
        const personaData = persona.user_metadata || persona;
        
        if (!personaData.personaId || !personaData.location?.coordinates) {
          console.warn('⚠️ [DEBUG] Invalid persona data:', persona);
          return null;
        }
        
        // Handle both possible coordinate structures
        let lat: number, lon: number;
        
        if (Array.isArray(personaData.location.coordinates.coordinates)) {
          // GeoJSON format: { type: string; coordinates: [longitude, latitude] }
          lon = personaData.location.coordinates.coordinates[0];
          lat = personaData.location.coordinates.coordinates[1];
        } else {
          // Object format: { latitude: number; longitude: number }
          lat = (personaData.location.coordinates as any).latitude;
          lon = (personaData.location.coordinates as any).longitude;
        }
        
        return {
          id: personaData.personaId,
          lat: lat,
          lon: lon,
          color: '#666666', // Grey for all users initially
          size: 4,
          persona: persona
        };
      }).filter(Boolean); // Remove null entries
      
      setGlobeDots(dots);
      console.log(`🌍 [GLOBE] Displaying ${dots.length} @fake.com users as grey dots on globe`);
    }
  }, [allUsers.length, nichePersonaIds.length]); // Only depend on lengths to avoid unnecessary re-runs

  // Update dots colors based on reactions only (not selection, as that's handled by updateGlobeDotsForNiche)
  useEffect(() => {
    if (reactions.length > 0 && globeDots.length > 0) {
      const updatedDots = globeDots.map(dot => {
        // Only process @fake.com users
        const email = dot.persona?.email || '';
        if (!email.endsWith('@fake.com')) return null;
        
        const dotPersonaData = dot.persona?.user_metadata || dot.persona;
        
        if (!dotPersonaData?.personaId) return dot;
        
        // Check if this user has a reaction (colored)
        const reaction = reactions.find(r => r.personaId === dotPersonaData.personaId);
        
        if (reaction) {
          // Color based on reaction - override any previous color
          const color = reaction.attention === 'full' ? '#00ff00' :
                  reaction.attention === 'partial' ? '#ffff00' : '#ff0000';
        return {
          ...dot,
          color,
            size: 8 // Make reaction dots larger
          };
        }
        
        // For global deployment, keep white color if no reaction yet
        if (isGlobalDeployment && !reaction) {
          return {
            ...dot,
            color: '#ffffff',
            size: 6
          };
        }
        
        // Keep existing color and size if no reaction
        return dot;
      }).filter(Boolean); // Remove null entries for non-@fake.com users
      setGlobeDots(updatedDots);
    }
  }, [reactions, isGlobalDeployment]); // Depend on reactions and global deployment state

  // Special handling for global deployment mode - show all dots as white initially
  useEffect(() => {
    if (isGlobalDeployment && allUsers.length > 0 && reactions.length === 0) {
      console.log('🌍 [GLOBAL] Setting up white dots for global deployment');
      const whiteDots = allUsers
        .filter(user => user.email?.endsWith('@fake.com'))
        .map(user => {
          const persona = user.user_metadata || user;
          const coords = persona.location?.coordinates;
          
          if (!coords) return null;
          
          let lat, lng;
          if ('coordinates' in coords && Array.isArray(coords.coordinates)) {
            lng = coords.coordinates[0];
            lat = coords.coordinates[1];
          } else if ('latitude' in coords && 'longitude' in coords) {
            lat = coords.latitude;
            lng = coords.longitude;
          } else {
            return null;
          }

          return {
            id: persona.personaId,
            lat: lat,
            lon: lng,
            color: '#ffffff', // White for global deployment
            size: 6,
            persona: user
          };
        })
        .filter(Boolean);
      
      console.log(`🌍 [GLOBAL] Created ${whiteDots.length} white dots`);
      setGlobeDots(whiteDots);
    }
  }, [isGlobalDeployment, allUsers.length]); // Only when entering/exiting global mode

  // Load all real Auth0 users initially (greyed out)
  const loadRealAuth0Users = async () => {
    console.log('👥 [AUTH0-USERS] Loading real Auth0 users...');
    setIsLoadingGlobalUsers(true);
    
    try {
      const response = await fetch('/api/fetch-auth0-users?limit=700&real_users=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users && data.users.length > 0) {
          // Filter to only show users with @fake.com emails
          const fakeUsers = data.users.filter((user: any) => {
            const email = user.email || '';
            return email.endsWith('@fake.com');
          });
          
          console.log('✅ [AUTH0-USERS] Loaded', data.users.length, 'total users, filtered to', fakeUsers.length, '@fake.com users');
          console.log('🌍 [AUTH0-USERS] Only @fake.com users will display on globe');
          
          setAllUsers(fakeUsers);
          setPersonas(fakeUsers);
        } else {
          console.log('⚠️ [AUTH0-USERS] No real users found in Auth0 database');
        }
      } else {
        console.error('❌ [AUTH0-USERS] Failed to fetch users:', response.status);
      }
      
    } catch (error) {
      console.error('💥 [AUTH0-USERS] Error loading users:', error);
    } finally {
      setIsLoadingGlobalUsers(false);
    }
  };

  // Load personas from local JSON file (much faster than Auth0)
  const loadLocalPersonas = async () => {
    console.log('📁 [LOCAL-PERSONAS] Loading personas from local JSON file...');
    
    try {
      const response = await fetch('/api/personas-local');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users && data.users.length > 0) {
          console.log('✅ [LOCAL-PERSONAS] Loaded', data.users.length, 'personas from local file');
          
          setAllUsers(data.users);
          setPersonas(data.users);
        } else {
          console.log('⚠️ [LOCAL-PERSONAS] No personas found in local file');
        }
      } else {
        console.error('❌ [LOCAL-PERSONAS] Failed to fetch personas:', response.status);
      }
    } catch (error) {
      console.error('💥 [LOCAL-PERSONAS] Error loading personas:', error);
    }
  };

  // Find 100 most relevant users from loaded Auth0 users using Cohere
  const findRelatedAuth0Users = async (prompt: string) => {
    console.log('🔍 [NICHE-SEARCH] Finding Auth0 users related to prompt:', prompt);
    
    try {
      // Extract niche from prompt
      const nicheResponse = await fetch('/api/extract-niche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: prompt })
      });
      
      const nicheData = await nicheResponse.json();
      if (!nicheData.success) {
        throw new Error('Failed to extract niche');
      }
      
      console.log('✅ [NICHE-SEARCH] Detected niche:', nicheData.niche);
      
      // Use Cohere to intelligently select the 5 most relevant users
      console.log('🤖 [NICHE-SEARCH] Using Cohere to select most relevant users from', allUsers.length, 'total users');
      
      const selectionResponse = await fetch('/api/select-niche-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche: nicheData.niche,
          users: allUsers,
          prompt: prompt,
          limit: 25  // Add this parameter to limit to 5 users
        })
      });
      
      const selectionData = await selectionResponse.json();
      if (!selectionData.success) {
        throw new Error('Failed to select niche users with Cohere');
      }
      
      console.log('✅ [NICHE-SEARCH] Cohere selected', selectionData.selectedUsers.length, 'users');
      console.log('📊 [NICHE-SEARCH] Average relevance score:', selectionData.averageRelevanceScore?.toFixed(3));
      
      setSelectedUsers(selectionData.selectedUsers);
      return selectionData.selectedUsers;
      
    } catch (error) {
      console.error('💥 [NICHE-SEARCH] Error:', error);
      // Fallback: select first 5 @fake.com users with highest diversity
      const fallbackUsers = allUsers
        .filter(user => {
          const email = user.email || '';
          return email.endsWith('@fake.com');
        })
        .sort(() => Math.random() - 0.5) // Randomize for diversity
        .slice(0, 5);  // Change from 100 to 5
      console.log('🔄 [NICHE-SEARCH] Using fallback: 5 random @fake.com users for diversity');
      setSelectedUsers(fallbackUsers);
      return fallbackUsers;
    }
  };

  // Update globe dots to highlight niche personas
  const updateGlobeDotsForNiche = (nicheIds: number[]) => {
    console.log('🌍 [UPDATE-GLOBE] Updating globe dots for niche:', { 
      nicheIdsCount: nicheIds.length, 
      allUsersCount: allUsers.length,
      firstNicheId: nicheIds[0]
    });
    
    if (allUsers.length === 0) {
      console.warn('⚠️ [UPDATE-GLOBE] No users loaded yet, cannot update globe dots');
      return;
    }
    
    const dots = allUsers.map(persona => {
      // Only show @fake.com users
      const email = persona.email || '';
      if (!email.endsWith('@fake.com')) {
        return null;
      }
      
      const personaData = persona.user_metadata || persona;
      
      if (!personaData.personaId || !personaData.location?.coordinates) {
        return null;
      }
      
      let lat: number, lon: number;
      const coords = personaData.location.coordinates;
      
      if ('coordinates' in coords && Array.isArray(coords.coordinates)) {
        // GeoJSON format: { type: string; coordinates: [longitude, latitude] }
        lon = coords.coordinates[0];
        lat = coords.coordinates[1];
      } else if (Array.isArray(coords)) {
        // Direct array format: [longitude, latitude]
        lon = coords[0];
        lat = coords[1];
      } else if ('latitude' in coords && 'longitude' in coords) {
        // Object format: { latitude: number; longitude: number }
        lat = coords.latitude as number;
        lon = coords.longitude as number;
      } else {
        return null;
      }
      
      const isInNiche = nicheIds.includes(personaData.personaId);
      
      return {
        id: personaData.personaId,
        lat: lat,
        lon: lon,
        color: isInNiche ? '#ffffff' : '#444444', // White for niche, grey for others
        size: isInNiche ? 8 : 4, // Larger for niche personas
        persona: persona // Use full persona object, not just personaData
      };
    }).filter(dot => dot !== null);
    
    console.log(`🌍 [UPDATE-GLOBE] Setting ${dots.length} @fake.com globe dots (${nicheIds.length} in niche)`);
    setGlobeDots(dots);
  };

  // Find niche users and show them as white dots
  const findNicheUsers = async () => {
    if (!postContent.trim()) {
      alert('Please enter content to analyze');
      return;
    }
    
    // Create new session if we don't have one
    if (!currentSession) {
      const session = await createNewSession(postContent);
      if (!session) return;
    }
    
    setHasEnteredPrompt(true);
    setCurrentPost(postContent);
    setIsSelectingNiche(true);
    setHasRunFocusGroup(true); // Track that focus group has been run
    setCurrentProcessingStep('Identifying target niche...');
    
    try {
      console.log('🔍 [NICHE-SEARCH] Finding niche personas for:', postContent);
      
      const tokens = localStorage.getItem('auth_tokens');
      if (!tokens) {
        throw new Error('Please log in to run simulations');
      }

      const parsedTokens = JSON.parse(tokens);
      // First extract the niche
      const nicheResponse = await fetch('/api/extract-niche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: postContent })
      });
      
      const nicheData = await nicheResponse.json();
      if (!nicheData.success) {
        throw new Error('Failed to extract niche');
      }
      
      console.log('✅ [NICHE-SEARCH] Detected niche:', nicheData.niche);
      
      // Use the working select-niche-users endpoint
      const response = await fetch('/api/select-niche-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche: nicheData.niche,
          users: allUsers,
          prompt: postContent,
          limit: 25  // Select only 5 most relevant personas
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to identify niche');
      }

      const data = await response.json();
      
      if (!data.success || !data.selectedUsers) {
        throw new Error('Failed to select niche users');
      }
      
      // Extract persona IDs from selected users
      const nicheIds = data.selectedUsers.map((u: any) => {
        const persona = u.user_metadata || u;
        return persona.personaId;
      });
      
      setNichePersonaIds(nicheIds);
      setNicheInfo({
        nicheDescription: nicheData.niche,
        totalSelected: data.totalSelected,
        averageRelevanceScore: data.averageRelevanceScore
      });
      
      setSelectedUsers(data.selectedUsers);
      
      console.log(`✅ [NICHE-SEARCH] Found ${data.selectedUsers.length} most relevant personas in niche: ${nicheData.niche}`);
      setCurrentProcessingStep(`Found ${data.selectedUsers.length} most relevant personas in: ${nicheData.niche}`);
      
      // Update globe dots to highlight niche personas
      updateGlobeDotsForNiche(nicheIds);
      
    } catch (error) {
      console.error('💥 [NICHE-SEARCH] Error:', error);
      alert(`Failed to select focus group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSelectingNiche(false);
    }
  };

  // Run sentiment analysis on selected users
  const runAnalysis = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select focus group first');
      return;
    }
    
    console.log('🚀 STARTING ANALYSIS - Resetting all states');
    
    // Clear any existing polling before starting new analysis
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
      console.log('🧹 Cleared existing polling interval');
    }
    
    setIsRunningAnalysis(true);
    setIsSimulating(true);
    setReactions([]);
    setMetrics({
      score: 0,
      fullAttention: 0,
      partialAttention: 0,
      ignored: 0,
      totalResponses: 0,
      viralCoefficient: 0,
      avgSentiment: 0
    });
    
    try {
      console.log('🚀 [ANALYSIS] Running sentiment analysis on', selectedUsers.length, 'users');
      
      // Generate opinions for selected users
      const opinionsResponse = await fetch('/api/generate-opinions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idea: postContent, 
          profiles: selectedUsers 
        })
      });
      
      const opinionsData = await opinionsResponse.json();
      if (!opinionsData.success) {
        throw new Error('Failed to generate opinions');
      }
      
      console.log('✅ [ANALYSIS] Generated', opinionsData.opinions.length, 'opinions');
      
      // Run simulation with generated opinions
      runGeneratedSimulation(opinionsData.opinions);
      
    } catch (error) {
      console.error('💥 [ANALYSIS] Error:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSimulating(false);
      setIsRunningAnalysis(false);
    }
  };

  // Load niche profiles (generated profiles)
  const loadNicheProfiles = async () => {
    console.log('🎯 [NICHE-PROFILES] Loading generated profiles...');
    
    try {
      const response = await fetch('/api/generate-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ niche: 'General' })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate profiles');
      }
      
      console.log('✅ [NICHE-PROFILES] Loaded profiles:', data.profiles.length);
      
      // Convert to globe dots (filter for @fake.com only)
      const nicheDots = data.profiles
        .filter((profile: any) => {
          const email = profile.email || '';
          return email.endsWith('@fake.com');
        })
        .map((profile: any) => ({
        id: profile.personaId,
        lat: profile.location.coordinates.coordinates[1],
        lon: profile.location.coordinates.coordinates[0],
        color: '#00ff88', // Green for generated profiles
        size: 6, // Larger size for niche view
        persona: profile
      }));
      
      setGlobeDots(nicheDots);
      setPersonas(data.profiles);
      
    } catch (error) {
      console.error('💥 [NICHE-PROFILES] Error loading niche profiles:', error);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'niche' | 'global') => {
    setViewMode(mode);
    if (mode === 'global') {
      loadRealAuth0Users();
    } else {
      loadNicheProfiles();
    }
  };

  // Poll for simulation updates
  useEffect(() => {
    if (simulationId && isSimulating) {
      console.log('📡 Starting polling for simulation:', simulationId);
      pollInterval.current = setInterval(() => {
        fetchSimulationUpdates();
      }, 1000);
      return () => {
        if (pollInterval.current) {
          console.log('🛑 Stopping polling (cleanup)');
          clearInterval(pollInterval.current);
          pollInterval.current = null;
        }
      };
    }
  }, [simulationId, isSimulating]);

  const fetchPersonas = async () => {
    try {
      const response = await fetch('/api/personas');
      const data = await response.json();
      setPersonas(data.personas);
    } catch (error) {
      console.error('Error fetching personas:', error);
    }
  };

  const handleDotClick = (dot: any) => {
    if (dot.persona) {
      setSelectedPersona(dot.persona);
    }
  };

  const initiatePersonaCall = (persona: Persona, reaction: Reaction) => {
    // Store persona context in session storage for the voice agent to access
    const personaContext = {
      persona: persona.user_metadata || persona,
      reaction: reaction,
      projectIdea: postContent,
      simulationType: selectedType,
      nicheInfo: nicheInfo
    };
    
    sessionStorage.setItem('personaCallContext', JSON.stringify(personaContext));
    
    // Open voice agent in a new window/tab with persona mode
    window.open('/voice-agent?mode=persona', '_blank');
  };

  const addToFeedbackList = (persona: Persona, reaction: any) => {
    // Check if already in feedback list
    const personaId = (persona.user_metadata || persona).personaId;
    const alreadyExists = feedbackList.some(item => 
      (item.persona.user_metadata || item.persona).personaId === personaId
    );
    
    if (!alreadyExists) {
      setFeedbackList(prev => [...prev, { persona, reaction }]);
    }
  };

  const refineIdea = async () => {
    if (feedbackList.length === 0) {
      alert('Please add some feedback to the list first');
      return;
    }

    setIsRefining(true);
    
    try {
      // Prepare feedback for refinement
      const feedbackText = feedbackList.map(item => {
        const persona = item.persona.user_metadata || item.persona;
        return `${persona.name} (${persona.title}, ${persona.demographics.generation}): ${item.reaction.comment || item.reaction.reason}`;
      }).join('\n\n');

      // Call Cohere to refine the idea
      const response = await fetch('/api/cohere/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Refine this idea based on user feedback. Return ONLY the improved idea, no explanations or reasoning.

Original: "${postContent}"

Feedback:
${feedbackText}

Improved idea:`,
          maxTokens: 200,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Refine API error:', errorText);
        throw new Error(`Failed to refine idea: ${response.status}`);
      }

      const refinedData = await response.json();
      console.log('Refine response:', refinedData);
      
      // Handle the Cohere API response format
      let refinedText = '';
      if (refinedData.response) {
        refinedText = refinedData.response.trim();
      } else if (typeof refinedData === 'string') {
        refinedText = refinedData.trim();
      } else if (refinedData.text) {
        refinedText = refinedData.text.trim();
      } else {
        console.error('Unexpected response format:', refinedData);
        throw new Error('Unexpected response format from Cohere');
      }
      
      if (!refinedText) {
        throw new Error('Empty response from Cohere');
      }
      
      // Update the post content with the refined idea
      setPostContent(refinedText);
      
      // Clear previous reactions and feedback list to prepare for new analysis
      setReactions([]);
      setFeedbackList([]);
      
      // Keep hasEnteredPrompt true and automatically run analysis with same focus group
      setHasEnteredPrompt(true);
      
      // Set refined state and automatically run analysis
      setJustRefined(true);
      
      // Automatically run analysis with the same focus group to see how opinions change
      setTimeout(() => {
        runAnalysis();
        // Reset refined state after analysis starts
        setTimeout(() => setJustRefined(false), 1000);
      }, 500); // Small delay to let the UI update
      
    } catch (error) {
      console.error('Error refining idea:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to refine idea: ${errorMessage}`);
    } finally {
      setIsRefining(false);
    }
  };

  const runGlobalDeployment = async () => {
    if (!postContent.trim()) {
      alert('Please enter an idea first');
      return;
    }

    setIsGlobalDeployment(true);
    setIsRunningAnalysis(true);
    setReactions([]); // Clear previous reactions
    // Don't clear feedbackList in global mode
    setCurrentProcessingStep('Deploying globally...');

    try {
      // Use all personas for global deployment (no niche filtering)
      setSelectedUsers(allUsers);
      
      // Update globe dots to show all users as WHITE for global deployment
      const allDots = allUsers
        .filter(user => user.email?.endsWith('@fake.com'))
        .map(user => {
          const persona = user.user_metadata || user;
          const coords = persona.location?.coordinates;
          
          if (!coords) {
            console.warn('No coordinates for user:', persona.name);
            return null;
          }
          
          let lat, lng;
          if ('coordinates' in coords && Array.isArray(coords.coordinates)) {
            lng = coords.coordinates[0];
            lat = coords.coordinates[1];
          } else if ('latitude' in coords && 'longitude' in coords) {
            lat = coords.latitude;
            lng = coords.longitude;
          } else {
            console.warn('Invalid coordinate format for user:', persona.name, coords);
            return null;
          }

          return {
            id: persona.personaId,
            lat: lat,  // Use lat/lon format like in other parts
            lon: lng,
            color: '#ffffff', // All nodes turn WHITE for global deployment
            size: 8, // Make them slightly bigger for global view
            persona: user
          };
        })
        .filter(Boolean);
      
      console.log('🌍 [GLOBAL] Created', allDots.length, 'dots for globe');

      setGlobeDots(allDots);

      // Generate opinions for ALL users (global deployment)
      console.log('🌍 [GLOBAL] Running analysis on', allUsers.length, 'users globally');
      
      const opinionsResponse = await fetch('/api/generate-opinions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idea: postContent, 
          profiles: allUsers  // Use ALL users for global deployment
        })
      });
      
      const opinionsData = await opinionsResponse.json();
      if (!opinionsData.success) {
        throw new Error('Failed to generate global opinions');
      }
      
      console.log('✅ [GLOBAL] Generated', opinionsData.opinions.length, 'opinions globally');
      
      // Run simulation with generated opinions
      runGeneratedSimulation(opinionsData.opinions);

    } catch (error) {
      console.error('Error in global deployment:', error);
      alert('Failed to run global deployment. Please try again.');
      setIsRunningAnalysis(false);
      setIsGlobalDeployment(false);
    }
  };

  const handleTypeSelect = (type: SimulationType) => {
    setSelectedType(type);
    setShowTypeSelector(false);
  };

  const getPlaceholderText = () => {
    switch (selectedType) {
      case 'linkedin':
        return "Write your LinkedIn post...";
      case 'instagram':
        return "Write your Instagram caption...";
      case 'twitter':
        return "Write your tweet...";
      case 'article':
        return "Write your article headline or summary...";
      case 'email':
        return "Write your email content...";
      case 'email-subject':
        return "Write your email subject line...";
      case 'project-idea':
        return "Pitch your project idea and get feedback...";
      case 'product':
        return "Describe your product proposition...";
      default:
        return "What would you like to simulate?";
    }
  };

  const getTypeLabel = () => {
    switch (selectedType) {
      case 'project-idea': return 'Project Idea';
      case 'linkedin': return 'LinkedIn Post';
      case 'instagram': return 'Instagram Post';
      case 'twitter': return 'Tweet';
      case 'tiktok': return 'TikTok Video';
      case 'article': return 'Article';
      case 'website': return 'Website';
      case 'ad': return 'Advertisement';
      case 'email': return 'Email';
      case 'email-subject': return 'Email Subject';
      case 'product': return 'Product';
      default: return 'Content';
    }
  };



  // Removed old content analysis functions - now using API-generated responses

  // Simulation with generated profiles and opinions
  const runGeneratedSimulation = (opinions: any[]) => {
    console.log('🚀 [SIMULATION] Running simulation with generated opinions');
    
    // Reset notification tracking
    setNotifiedPersonaIds(new Set());
    setNotifications([]);
    
    let currentReactions: any[] = [];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex >= opinions.length) {
        clearInterval(interval);
        console.log('✅ SIMULATION COMPLETE - All opinions processed');
        setIsSimulating(false);
        setIsRunningAnalysis(false);  // FIX: Reset the analyze button
        setHasCompletedFirstAnalysis(true);  // FIX: Enable global button
        
        // Generate insights based on the reactions
        const fullAttentionReasons = opinions
          .filter(o => o.attention === 'full')
          .map(o => o.reason)
          .slice(0, 3);
        
        const ignoreReasons = opinions
          .filter(o => o.attention === 'ignore')
          .map(o => o.reason)
          .slice(0, 3);
        
        setInsights({
          topEngagementReasons: fullAttentionReasons.length > 0 ? fullAttentionReasons : ['High engagement detected'],
          topIgnoreReasons: ignoreReasons.length > 0 ? ignoreReasons : ['Some resistance detected'],
          recommendations: [
            'Focus on addressing the main concerns raised',
            'Leverage the positive feedback for marketing',
            'Consider targeting early adopters first'
          ]
        });
        return;
      }
      
      const batch = opinions.slice(currentIndex, currentIndex + 5);
      currentReactions = [...currentReactions, ...batch];
      setReactions(currentReactions);
      
      const full = currentReactions.filter(r => r.attention === 'full').length;
      const partial = currentReactions.filter(r => r.attention === 'partial').length;
      const ignored = currentReactions.filter(r => r.attention === 'ignore').length;
      
      setMetrics({
        score: full * 2 + partial,
        fullAttention: full,
        partialAttention: partial,
        ignored: ignored,
        totalResponses: currentReactions.length,
        viralCoefficient: (full * 2 + partial) / (currentReactions.length * 2),
        avgSentiment: currentReactions.reduce((sum, r) => sum + r.sentiment, 0) / currentReactions.length
      });
      
      // Update processing progress
      setProcessedPersonas(currentReactions.length);
      setCurrentProcessingStep(
        currentReactions.length < 10 ? 'Analyzing user profiles...' :
        currentReactions.length < 25 ? 'Processing opinions...' :
        currentReactions.length < 40 ? 'Computing sentiment...' :
        'Finalizing insights...'
      );
      
      // Add notifications for new reactions - FIXED LOGIC
      setNotifiedPersonaIds(currentNotified => {
        const eligibleReactions = batch.filter(reaction => {
          // Only show notifications for personas we haven't notified about yet
          // AND that have actual content (comment or reason)
          return !currentNotified.has(reaction.personaId) && 
                 (reaction.comment || reaction.reason);
        });
        
        // Only add one notification per batch to prevent spam
        if (eligibleReactions.length > 0 && notifications.length < 3) {
          const reaction = eligibleReactions[0];
          
          if (reaction.persona) {
            const notificationId = `${Date.now()}-${reaction.personaId}-${Math.random()}`;
            // Only use actual content, no fallback messages
            const message = reaction.attention === 'full' && reaction.comment ? 
              `"${reaction.comment}"` :
              reaction.attention === 'partial' && reaction.comment ?
              `"${reaction.comment}"` :
              reaction.reason ?
              `"${reaction.reason}"` : null;
            
            // Only create notification if we have a real message
            if (message) {
              setNotifications(prev => {
                const newNotification = {
                  id: notificationId,
                  persona: reaction.persona.name,
                  message: message,
                  type: reaction.attention,
                  timestamp: Date.now()
                };
                
                // Keep max 3 notifications, remove oldest
                return [newNotification, ...prev.slice(0, 2)];
              });
              
              // Auto-remove after 8 seconds
              setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
              }, 8000);
              
              // Return updated set with this persona marked as notified
              return new Set([...currentNotified, reaction.personaId]);
            }
          }
        }
        
        return currentNotified;
      });
      
      currentIndex += 5;
    }, 600); // Slightly slower to show the generated content better
  };

  // Demo simulation - only for fallback when API is not available
  const runDemoSimulation = () => {
    console.log('🔄 [SIMULATION] Running fallback demo (API not available)');
    alert('Running in demo mode - API keys not configured. Add OpenAI/Cohere API keys for unique AI-generated responses.');
    
    // Reset notification tracking when starting new simulation
    setNotifiedPersonaIds(new Set());
    setNotifications([]);
    
    let currentReactions: Reaction[] = [];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex >= personas.length) {
        clearInterval(interval);
        console.log('✅ DEMO SIMULATION COMPLETE - All personas processed');
        setIsSimulating(false);
        setIsRunningAnalysis(false);  // FIX: Reset the analyze button
        setHasCompletedFirstAnalysis(true);  // FIX: Enable global button
        setInsights({
          topEngagementReasons: ['Demo mode - add API keys for real insights'],
          topIgnoreReasons: ['Demo mode - add API keys for real insights'],
          recommendations: ['Configure API keys in .env.local for AI-generated responses']
        });
        return;
      }
      
      const batch = personas.slice(currentIndex, currentIndex + 5);
      const newReactions = batch.map(persona => {
        const rand = Math.random();
        const attention: 'full' | 'partial' | 'ignore' = 
          rand > 0.7 ? 'full' : rand > 0.4 ? 'partial' : 'ignore';
        
        return {
          personaId: persona.personaId,
          attention,
          reason: `Demo mode - ${attention} attention`,
          comment: attention === 'full' ? 'Demo comment - add API keys for unique responses' : undefined,
          sentiment: rand,
          persona
        };
      });
      
      currentReactions = [...currentReactions, ...newReactions];
      setReactions(currentReactions);
      
      const full = currentReactions.filter(r => r.attention === 'full').length;
      const partial = currentReactions.filter(r => r.attention === 'partial').length;
      const ignored = currentReactions.filter(r => r.attention === 'ignore').length;
      
      setMetrics({
        score: full * 2 + partial,
        fullAttention: full,
        partialAttention: partial,
        ignored: ignored,
        totalResponses: currentReactions.length,
        viralCoefficient: (full * 2 + partial) / (currentReactions.length * 2),
        avgSentiment: currentReactions.reduce((sum, r) => sum + r.sentiment, 0) / currentReactions.length
      });
      
      // Update processing progress
      setProcessedPersonas(currentReactions.length);
      setCurrentProcessingStep(
        currentReactions.length < 20 ? 'Initializing personas...' :
        currentReactions.length < 100 ? 'Analyzing reactions...' :
        currentReactions.length < 200 ? 'Processing sentiment...' :
        currentReactions.length < 300 ? 'Computing insights...' :
        'Finalizing results...'
      );
      
      // Add notifications for new reactions - FIXED LOGIC
      setNotifiedPersonaIds(currentNotified => {
        const eligibleReactions = newReactions.filter(reaction => {
          // Only show notifications for personas we haven't notified about yet
          return !currentNotified.has(reaction.personaId);
        });
        
        // Only add one notification per batch to prevent spam
        if (eligibleReactions.length > 0 && notifications.length < 3) {
          const reaction = eligibleReactions[0]; // Take the first eligible reaction
          const persona = personas.find(p => p.personaId === reaction.personaId);
          
          if (persona) {
            const notificationId = `${Date.now()}-${reaction.personaId}-${Math.random()}`;
            const message = reaction.comment || reaction.reason || 'Reacted to your content';
            
            // Add notification
            setNotifications(prev => {
              const newNotification = {
                id: notificationId,
                persona: persona.name,
                message: message,
                type: reaction.attention,
                timestamp: Date.now()
              };
              
              // Keep max 3 notifications, remove oldest
              return [newNotification, ...prev.slice(0, 2)];
            });
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notificationId));
            }, 8000);
            
            // Return updated set with this persona marked as notified
            return new Set([...currentNotified, reaction.personaId]);
          }
        }
        
        return currentNotified;
      });
      
      currentIndex += 5;
    }, 500);
  };


  const fetchSimulationUpdates = async () => {
    if (!simulationId) return;

    try {
      const response = await fetch(`/api/simulation/${simulationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lastIndex: reactions.length })
      });

      const data = await response.json();
      console.log('📡 Polling response:', data);
      console.log('📡 Status:', data.status);
      
      if (data.newReactions && data.newReactions.length > 0) {
        console.log(`🔄 [SIMULATION] Got ${data.newReactions.length} new reactions from API:`, data.newReactions[0]);
        
        const reactionsWithPersona = data.newReactions.map((r: any) => ({
          ...r,
          persona: r.persona || personas.find(p => {
            const personaData = p.user_metadata || p;
            return personaData.personaId === r.personaId;
          })
        }));
        
        setReactions(prev => {
          const newReactions = [...prev, ...reactionsWithPersona];
          console.log(`📊 Total reactions now: ${newReactions.length}, Selected users: ${selectedUsers.length}`);
          
          // If we have all reactions, stop the simulation immediately
          if (newReactions.length >= selectedUsers.length && selectedUsers.length > 0) {
            console.log('🎉 ALL REACTIONS RECEIVED FROM API - STOPPING SIMULATION');
            
            // Stop polling immediately
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
              pollInterval.current = null;
              console.log('🛑 Polling stopped');
            }
            
            // Force state reset with minimal delay
            setTimeout(() => {
              setIsSimulating(false);
              setIsRunningAnalysis(false);
              setHasCompletedFirstAnalysis(true);
              console.log('✅ FORCED STATE RESET COMPLETE - Buttons should work now');
            }, 50);
          }
          
          return newReactions;
        });
        setProcessedPersonas(reactions.length + reactionsWithPersona.length);
        setCurrentProcessingStep('Processing...');
        
        // Add notifications for API reactions - FIXED LOGIC
        setNotifiedPersonaIds(currentNotified => {
          const eligibleReactions = reactionsWithPersona.filter((reaction: any) => {
            // Only show notifications for personas we haven't notified about yet
            // AND that have actual API-generated content (comment or reason)
            return !currentNotified.has(reaction.personaId) && 
                   (reaction.comment || reaction.reason);
          });
          
          // Only add one notification to prevent spam
          if (eligibleReactions.length > 0 && notifications.length < 3) {
            const reaction = eligibleReactions[0];
            const persona = personas.find(p => p.personaId === reaction.personaId);
            
            if (persona) {
              const notificationId = `${Date.now()}-${reaction.personaId}-${Math.random()}`;
              // Only use actual API content, no fallback messages
              const message = reaction.attention === 'full' && reaction.comment ? 
                `"${reaction.comment}"` :
                reaction.attention === 'partial' && reaction.comment ?
                `"${reaction.comment}"` :
                reaction.reason ?
                `"${reaction.reason}"` : null;
              
              // Only create notification if we have a real message
              if (message) {
                setNotifications(prev => {
                  const newNotification = {
                    id: notificationId,
                    persona: persona.name,
                    message: message,
                    type: reaction.attention,
                    timestamp: Date.now()
                  };
                  
                  return [newNotification, ...prev.slice(0, 2)];
                });
                
                // Auto-remove after 8 seconds
                setTimeout(() => {
                  setNotifications(prev => prev.filter(n => n.id !== notificationId));
                }, 8000);
                
                // Return updated set with this persona marked as notified
                return new Set([...currentNotified, reaction.personaId]);
              }
            }
          }
          
          return currentNotified;
        });
      }

      if (data.metrics) {
        setMetrics(data.metrics);
      }

      // Check if simulation is complete either by status or by having all expected reactions
      const isComplete = data.status === 'completed' || 
                        (reactions.length >= selectedUsers.length && selectedUsers.length > 0);
      
      if (isComplete) {
        console.log('🎉 SIMULATION COMPLETED - Resetting states');
        console.log('📊 Completion reason:', data.status === 'completed' ? 'Status completed' : 'All reactions received');
        console.log(`📊 Reactions: ${reactions.length}, Selected Users: ${selectedUsers.length}`);
        
        // Stop polling immediately
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
          pollInterval.current = null;
        }
        
        // Force state reset
        setIsSimulating(false);
        setIsRunningAnalysis(false); // Reset the running state immediately
        setHasCompletedFirstAnalysis(true); // Enable global button
        console.log('✅ States reset: isSimulating=false, isRunningAnalysis=false, hasCompletedFirstAnalysis=true');
        
        if (simulationId) {
          fetchFullResults();
        }
      }
    } catch (error) {
      console.error('💥 [SIMULATION] Error fetching updates:', error);
    }
  };

  const fetchFullResults = async () => {
    if (!simulationId) return;

    try {
      const response = await fetch(`/api/simulation/${simulationId}`);
      const data = await response.json();
      
      console.log('📊 [SIMULATION] Full simulation results:', data);
      
      // Set all reactions with their API-generated comments
      if (data.reactions) {
        const reactionsWithPersona = data.reactions.map((r: any) => ({
          ...r,
          persona: r.persona || personas.find(p => {
            const personaData = p.user_metadata || p;
            return personaData.personaId === r.personaId;
          })
        }));
        setReactions(reactionsWithPersona);
      }
      
      setInsights(data.insights);
      setMetrics(data.metrics);
      
      // Reset analysis state when complete
      console.log('🏁 FETCH FULL RESULTS COMPLETE - Final state reset');
      setIsRunningAnalysis(false);
      setIsSimulating(false);
      setIsGlobalDeployment(false);
      setHasCompletedFirstAnalysis(true); // Enable global button after first analysis
      console.log('🔄 Final states: isRunningAnalysis=false, hasCompletedFirstAnalysis=true');
    } catch (error) {
      console.error('💥 [SIMULATION] Error fetching full results:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedType) {
        if (!hasEnteredPrompt) {
          findNicheUsers();
        } else {
          runAnalysis();
        }
      }
    }
  };

  // Calculate percentages for display
  const fullPercent = metrics.totalResponses > 0 
    ? Math.round((metrics.fullAttention / metrics.totalResponses) * 100) : 0;
  const partialPercent = metrics.totalResponses > 0 
    ? Math.round((metrics.partialAttention / metrics.totalResponses) * 100) : 0;
  const ignorePercent = metrics.totalResponses > 0 
    ? Math.round((metrics.ignored / metrics.totalResponses) * 100) : 0;

  const impactScore = Math.round((fullPercent * 2 + partialPercent) / 2);

  // Initialize Vapi
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    
    if (!publicKey || publicKey === 'your_vapi_public_key_here') {
      setError('Please add your Vapi public key to the environment variables');
      return;
    }

    try {
      vapiRef.current = new Vapi(publicKey);
      
      // Set up event listeners
      vapiRef.current.on('call-start', () => {
        console.log('Call started');
        setIsInCall(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        setTranscript(prev => [...prev, '📞 Call started']);
      });

      vapiRef.current.on('call-end', () => {
        console.log('Call ended');
        setIsInCall(false);
        setConnectionStatus('idle');
        setTranscript(prev => [...prev, '📞 Call ended']);
      });

      vapiRef.current.on('speech-start', () => {
        console.log('User started speaking');
        setTranscript(prev => [...prev, '🎤 User speaking...']);
      });

      vapiRef.current.on('speech-end', () => {
        console.log('User stopped speaking');
      });

      vapiRef.current.on('message', (message: any) => {
        console.log('Message received:', message);
        if (message.type === 'transcript') {
          const speaker = message.role === 'user' ? '👤 You' : '🤖 Assistant';
          const newTranscript = `${speaker}: ${message.transcript}`;
          setTranscript(prev => [...prev, newTranscript]);
          setTranscription(message.transcript); // Update live transcription
          
          // REMOVED: Don't generate feedback during the call
          // if (message.role === 'assistant' && message.transcript) {
          //   const fullConversation = [...transcript, newTranscript].join(' ');
          //   generateFeedbackSummary(fullConversation);
          // }
        }
      });

      vapiRef.current.on('error', (error: any) => {
        console.error('Vapi error:', error);
        const errorMessage = error?.error?.message || error?.message || 'An error occurred with Vapi';
        setError(errorMessage);
        setConnectionStatus('error');
        setIsConnecting(false);
        setIsInCall(false);
      });

    } catch (err) {
      console.error('Failed to initialize Vapi:', err);
      setError('Failed to initialize voice agent');
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  // Build persona system prompt
  const buildPersonaSystemPrompt = () => {
    if (!selectedPersona) return '';
    
    const persona = selectedPersona.user_metadata || selectedPersona;
    const reaction = reactions.find(r => r.personaId === persona.personaId);
    
    if (!reaction) return '';
    
    return `You are ${persona.name}, ${persona.title} from ${persona.location.city}.

Context: You're a ${persona.demographics.generation} ${persona.professional.seniority} in ${persona.professional.primaryIndustry}. Your interests include ${persona.interests?.slice(0, 3).join(', ') || 'technology and innovation'}.

The user pitched: "${currentPost}"

Your reaction: You gave it ${reaction.attention} attention. ${reaction.comment ? `You thought: "${reaction.comment}"` : `Your reason: ${reaction.reason}`}

Instructions:
- Be concise and conversational. Keep responses short (2-3 sentences max unless asked for details)
- You already know your feedback - don't rediscover it. Stand by your initial reaction
- ${reaction.attention === 'ignore' ? "Explain why it doesn't interest you and what would need to change" : reaction.attention === 'partial' ? "Share your specific concerns and what would make you fully interested" : "Express your enthusiasm and ask about specific details that excite you"}
- Speak naturally as a ${persona.demographics.gender?.toLowerCase() || 'professional'} from your generation would
- Be direct but constructive. If skeptical, say why. If interested, say what caught your attention
- Don't over-explain. Wait for them to ask follow-ups
- Always give direct feedback. Do not beat around the bush. Be honest and straightforward and how we can improve the idea based on your feedback.

Remember: You've already formed your opinion. You're here to discuss it, not to be convinced otherwise (unless they address your specific concerns).`;
  };

  // Call control functions
  const startCall = async () => {
    if (!vapiRef.current) {
      setError('Voice agent not initialized');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);
    setTranscript([]);
    setTranscription('');
    setFeedbackSummary('');
    setFeedbackHistory([]);

    const systemPrompt = buildPersonaSystemPrompt();
    const persona = selectedPersona?.user_metadata || selectedPersona;
    const reaction = reactions.find(r => r.personaId === persona?.personaId);

    const firstMessage = reaction && persona ?
      `Hey, it's ${persona.name}. ${
        reaction.attention === 'ignore' 
          ? "Honestly, your idea didn't grab me." 
          : reaction.attention === 'partial'
          ? "I have mixed feelings about your idea."
          : "Your idea really caught my attention!"
      } Want to hear why?` :
      'Hello! How can I help you today?';

    try {
      await vapiRef.current.start({
        name: persona?.name || 'Assistant',
        firstMessage: firstMessage,
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt || 'You are a helpful AI assistant. Keep responses conversational and concise.',
            },
          ],
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer',
        },
      });
      
      // Remove the auto-opening of feedback modal
      
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setError(err?.message || 'Failed to start call');
      setIsConnecting(false);
      setConnectionStatus('error');
    }
  };

  const endCall = async () => {
    if (!vapiRef.current) return;

    try {
      vapiRef.current.stop();
      setIsInCall(false);
      setConnectionStatus('idle');
      setTranscription('');
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  const toggleMute = () => {
    if (!vapiRef.current || !isInCall) return;
    
    if (isMuted) {
      vapiRef.current.setMuted(false);
      setIsMuted(false);
    } else {
      vapiRef.current.setMuted(true);
      setIsMuted(true);
    }
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fix the response parsing in generateFeedbackSummary
  const generateFeedbackSummary = async (transcript: string) => {
    if (!transcript || transcript.length < 50) {
      console.log('❌ [FEEDBACK] Transcript too short:', transcript.length);
      return;
    }
    
    // Prevent concurrent calls
    if (isGeneratingFeedbackRef.current) {
      console.log('⚠️ [FEEDBACK] Feedback generation already in progress, skipping...');
      return;
    }
    
    console.log('🔄 [FEEDBACK] Generating feedback for transcript length:', transcript.length);
    isGeneratingFeedbackRef.current = true;
    setIsGeneratingFeedback(true);
    
    try {
      const response = await fetch('/api/cohere/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Based on this conversation transcript, provide actionable steps to improve the idea:

${transcript}

Give me specific action items to address the feedback mentioned in the conversation.`,
          max_tokens: 300
        })
      });
      
      const data = await response.json();
      console.log('📊 [FEEDBACK] API response:', data);
      
      // Fix the response parsing - check for both possible response formats
      if (data.success && (data.text || data.response)) {
        const feedbackText = data.text || data.response;
        console.log('✅ [FEEDBACK] Got feedback from API:', feedbackText.substring(0, 100) + '...');
        setFeedbackSummary(feedbackText);
        setShowFeedback(true);
      } else {
        console.log('❌ [FEEDBACK] API failed:', data);
        setFeedbackSummary('Failed to generate feedback. Please try again.');
        setShowFeedback(true);
      }
      
    } catch (error) {
      console.error('💥 [FEEDBACK] Error generating feedback:', error);
      setFeedbackSummary('Error generating feedback summary. Please try again.');
      setShowFeedback(true);
    } finally {
      setIsGeneratingFeedback(false);
      isGeneratingFeedbackRef.current = false; // Reset the ref
    }
  };

  // Update the openFeedbackModal function to only run once
  const openFeedbackModal = async () => {
    console.log('🔄 [FEEDBACK] Opening feedback modal, transcript length:', transcript.length);
    
    // End the call first
    if (isInCall) {
      console.log(' [FEEDBACK] Ending call first');
      await endCall();
    }
    
    // Only generate feedback if we have a transcript and haven't already generated it
    if (transcript.length > 0 && !showFeedback && !isGeneratingFeedbackRef.current) {
      const fullConversation = transcript.join(' ');
      console.log('🔄 [FEEDBACK] Generating feedback for full conversation');
      await generateFeedbackSummary(fullConversation);
    } else if (showFeedback) {
      console.log('ℹ️ [FEEDBACK] Feedback already generated');
    } else if (isGeneratingFeedbackRef.current) {
      console.log('ℹ️ [FEEDBACK] Feedback generation already in progress');
    } else {
      console.log('❌ [FEEDBACK] No transcript available');
    }
  };

  // Generate improved prompt based on reactions
  const generateImprovedPrompt = async () => {
    if (reactions.length === 0 || !currentPost) {
      console.log('❌ [IMPROVE] No reactions or current post available');
      return;
    }
    
    // Prevent concurrent calls
    if (isGeneratingImprovedPromptRef.current) {
      console.log('⚠️ [IMPROVE] Improved prompt generation already in progress, skipping...');
      return;
    }
    
    console.log('🔄 [IMPROVE] Generating improved prompt based on reactions');
    isGeneratingImprovedPromptRef.current = true;
    setIsGeneratingImprovedPrompt(true);
    
    try {
      // Extract key feedback from reactions
      const ignoreReasons = reactions
        .filter(r => r.attention === 'ignore' && r.reason)
        .map(r => r.reason)
        .slice(0, 3);
      
      const partialReasons = reactions
        .filter(r => r.attention === 'partial' && r.reason)
        .map(r => r.reason)
        .slice(0, 3);
      
      const positiveComments = reactions
        .filter(r => r.attention === 'full' && r.comment)
        .map(r => r.comment)
        .slice(0, 3);
      
      const feedbackText = `
CONCERNS TO ADDRESS:
${ignoreReasons.length > 0 ? ignoreReasons.join('\n') : 'No major concerns raised'}

AREAS FOR IMPROVEMENT:
${partialReasons.length > 0 ? partialReasons.join('\n') : 'No specific improvements suggested'}

POSITIVE ASPECTS TO BUILD ON:
${positiveComments.length > 0 ? positiveComments.join('\n') : 'No specific positive feedback'}`;

      const response = await fetch('/api/cohere/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Based on the user reactions below, rephrase and improve the original idea to address the concerns and incorporate the suggestions:

ORIGINAL IDEA:
"${currentPost}"

USER REACTIONS ANALYSIS:
${feedbackText}

Please provide an improved version of the idea that:
1. Addresses the main concerns raised by users who ignored it
2. Incorporates improvements suggested by users with partial interest
3. Builds on the positive aspects that engaged users liked
4. Maintains the core concept but makes it more compelling
5. Is clear and concise

Return only the improved idea, no additional commentary.`,
          max_tokens: 400
        })
      });
      
      const data = await response.json();
      console.log('📊 [IMPROVE] API response:', data);
      
      // Fix the response parsing - check for the actual response format
      if (data.response || data.text) {
        const improvedText = data.response || data.text;
        console.log('✅ [IMPROVE] Got improved prompt from API');
        setImprovedPrompt(improvedText);
        setPostContent(improvedText); // Update the main input with improved version
      } else {
        console.log('❌ [IMPROVE] API failed:', data);
        alert('Failed to generate improved prompt. Please try again.');
      }
      
    } catch (error) {
      console.error('💥 [IMPROVE] Error generating improved prompt:', error);
      alert('Error generating improved prompt. Please try again.');
    } finally {
      setIsGeneratingImprovedPrompt(false);
      isGeneratingImprovedPromptRef.current = false; // Reset the ref
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fillBlock {
          0% {
            background-color: rgba(255, 255, 255, 0.2);
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            background-color: currentColor;
            transform: scale(1);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
          }
        }
        
        .loading-block {
          animationName: pulseGlow;
          animationDuration: 1.5s;
          animationTimingFunction: ease-in-out;
          animationIterationCount: infinite;
        }
        
        .pulse-box {
          animation: pulseBox 1s ease-in-out infinite;
        }
        
        @keyframes pulseBox {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }
      `}</style>
      <div className="h-screen bg-black text-white font-mono flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-white/10 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/projects" className="flex items-center gap-2" aria-label="Go to Projects">
            <img 
              src="/logo.png" 
              alt="MarketLens Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-white font-mono text-lg">MarketLens</span>
          </Link>
        </div>
                  
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/projects'}
          className="font-mono text-white/80 hover:text-white hover:bg-white/10 mb-6 justify-start"
        >
          ← Projects View
        </Button>


        <Button 
          onClick={handleCreateNewTest}
          disabled={isSimulating}
          className="mb-6 bg-white/10 text-white hover:bg-white/20 border border-white/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Session
        </Button>

        {/* Analysis Sessions */}
        {projectId && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/60">Analysis Sessions</span>
              {hasUnsavedChanges && (
                <div className="flex items-center text-amber-400 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unsaved
                </div>
              )}
              {isSaving && (
                <div className="flex items-center text-blue-400 text-xs">
                  <Save className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
            
            {/* Current Session */}
            {currentSession && (
              <div className="mb-3 p-2 bg-white/10 border border-white/20 rounded text-xs">
                <div className="text-white/60 mb-1">Current:</div>
                <div className="text-white/90 truncate">{currentSession.sessionName}</div>
              </div>
            )}
            
            {/* Session List */}
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className={`group relative rounded transition-colors ${
                    currentSession?._id === session._id
                      ? 'bg-white/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <button
                    onClick={() => handleSessionSelect(session._id)}
                    className="w-full text-left p-2 text-xs pr-8"
                  >
                    <div className={`truncate ${
                      currentSession?._id === session._id ? 'text-white' : 'text-white/70'
                    }`}>
                      {session.sessionName || 'Untitled Session'}
                    </div>
                    <div className="text-white/40 text-xs mt-1">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteSession(session._id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                    title="Delete session"
                  >
                    <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-white/40 text-xs text-center py-2">
                  No sessions yet
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-auto space-y-3">
          <div className="text-xs text-white/60 mb-2">
          {selectedUsers.length > 0 ? `${selectedUsers.length} users selected` : `${allUsers.length} Auth0 users loaded`}
        </div>
        
          <div className="text-xs text-white/60 mb-3">
          {currentPost ? `Analysis: ${currentPost.substring(0, 30)}...` : 'No analysis running'}
        </div>
          <div className="flex items-center justify-between text-xs">
            {/* <span className="text-white/60">Credits: {credits}</span> */}
            <HelpCircle className="h-3 w-3 text-white/40" />
          </div>
          
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-white/10 p-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {project && (
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg font-mono text-white">{project.name}</h1>
                  {project.description && (
                    <p className="text-xs text-white/60">{project.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">United States</Badge>
            <Badge variant="outline" className="text-xs">United Kingdom</Badge>
            <Badge variant="outline" className="text-xs">Germany</Badge>
            <Badge variant="outline" className="text-xs">Canada</Badge>
            <Badge variant="outline" className="text-xs">Australia</Badge>
          </div> */}
          <Button 
            variant="ghost" 
            className="text-xs hover:bg-white/5"
            onClick={() => {}}
          >
            <Share2 className="h-3 w-3 mr-2" />
            Share Simulation
          </Button>
        </div>

        {/* Filter System Controls - Only show after prompt entered */}
        {hasEnteredPrompt && (
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-white/60 uppercase tracking-wider">Analysis Mode</span>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 text-xs font-mono border bg-white/20 border-white/40 text-white">
                    {!hasEnteredPrompt ? 'Finding Focus Group' : (isRunningAnalysis ? (isGlobalDeployment ? 'Deploying Globally...' : 'Analyzing...') : 'Analysis Complete')}
                  </div>
                  <Button
                    onClick={() => {
                      console.log('🌍 Global button clicked');
                      console.log('hasCompletedFirstAnalysis:', hasCompletedFirstAnalysis);
                      console.log('isRunningAnalysis:', isRunningAnalysis);
                      runGlobalDeployment();
                    }}
                    disabled={!hasCompletedFirstAnalysis || isRunningAnalysis}
                    className={`px-3 py-1 text-xs font-mono border ${
                      hasCompletedFirstAnalysis && !isRunningAnalysis
                        ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-600/40'
                        : 'bg-gray-600/10 text-gray-500 border-gray-600/20 cursor-not-allowed'
                    }`}
                  >
                    {isGlobalDeployment ? 'Deploying...' : 'Global'}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-white/60">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <span>{selectedUsers.length} Selected Users</span>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span>{allUsers.length - selectedUsers.length} Other Users</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Globe Area */}
          <div className="flex-1 relative bg-black">
            <div className="absolute inset-0 flex items-center justify-center">
              <ThreeJSGlobeWithDots 
                size={800}
                color="#333333"
                speed={0.003}
                dots={globeDots}
                onDotClick={handleDotClick}
              />
            </div>
            
            {/* Loading Animation - Top Left of Globe */}
            {isSimulating && (
              <div className="absolute top-8 left-8 pointer-events-none z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-black/90 border border-white/30 p-4 backdrop-blur-md min-w-[280px]"
                >
                  <div className="flex items-center space-x-3 mb-3">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-white"
                          style={{
                            animation: `fillBlock 1.0s infinite ${i * 0.15}s`,
                            animationTimingFunction: 'ease-in-out'
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-white/90 text-sm font-mono">
                      {currentProcessingStep || 'Initializing...'}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-xs font-mono">Personas Processed</span>
                      <span className="text-white font-mono text-sm">
                        {processedPersonas} / {personas.length}
                      </span>
                    </div>
                    
                    <div className="flex space-x-0.5">
                      {Array.from({ length: 25 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-2 transition-all duration-500 ${
                            i < Math.floor((processedPersonas / personas.length) * 25) ? 'bg-white' : 'bg-white/20'
                          }`}
                          style={{
                            animationDelay: `${i * 20}ms`
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-mono text-white/60">
                      <span>Progress: {Math.round((processedPersonas / personas.length) * 100)}%</span>
                      <span>ETA: {Math.max(0, Math.ceil((personas.length - processedPersonas) / 10))}s</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
            
            {/* Notification Area - Top Right of Globe - Stacked */}
            <div className="absolute top-8 right-8 w-80 pointer-events-none z-50">
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  // Reverse index so newest (index 0) appears on top
                  const stackIndex = notifications.length - 1 - index;
                  return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 100, scale: 0.8, y: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: stackIndex * 4, // Slight horizontal offset for stacking
                      scale: 1 - (stackIndex * 0.02), // Slightly smaller for stacked effect
                      y: stackIndex * 8, // Vertical stacking
                      zIndex: 50 + index // Higher z-index for newer notifications (index 0 = newest)
                    }}
                    exit={{ opacity: 0, x: 100, scale: 0.8, y: -20 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30,
                      duration: 0.3
                    }}
                    className="absolute top-0 right-0 p-3 bg-black/90 border border-white/30 backdrop-blur-md shadow-xl pointer-events-auto"
                    style={{
                      transform: `translateY(${stackIndex * 8}px) translateX(${stackIndex * 4}px) scale(${1 - (stackIndex * 0.02)})`,
                      zIndex: 50 + index
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-white mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-white/95 truncate">
                            {notification.persona}
                          </span>
                          <button
                            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                            className="w-4 h-4 bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                          >
                            <X className="w-2.5 h-2.5 text-white/70" />
                          </button>
                        </div>
                        <p className="text-white/80 text-xs leading-relaxed break-words line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
          </div>

          {/* Right Sidebar */}
          <div 
            className="border-l border-white/10 h-full flex flex-col relative"
            style={{ width: `${rightSidebarWidth}px` }}
          >
            {/* Drag handle */}
            <div 
              onMouseDown={handleRightResizeMouseDown}
              className={`absolute left-0 top-0 h-full w-1 cursor-col-resize select-none ${isResizingRight ? 'bg-white/20' : 'bg-transparent'} `}
              aria-label="Resize right sidebar"
              role="separator"
              aria-orientation="vertical"
            />
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 sidebar-scroll">
            
            {/* Mission Status Block */}
            <div className="border border-white/20 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400"></div>
                  <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Mission Status</span>
                </div>
                <span className="text-xs text-white/60 font-mono">ACTIVE</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-white/60 font-mono">Impact Score</span>
                  <span className="text-lg font-mono text-white font-bold">{impactScore}</span>
                </div>
                
                {/* Terminal-style progress bar */}
                <div className="font-mono text-xs">
                  <div className="flex">
                    {Array.from({ length: 20 }, (_, i) => (
                      <span 
                        key={i} 
                        className={`inline-block w-2 h-3 mr-0.5 transition-all duration-300 ${
                          i < Math.floor(impactScore / 5) ? 'bg-white' : 
                          isSimulating ? 'bg-white/20 pulse-box' : 'bg-white/20'
                        }`}
                        style={{
                          animationDelay: isSimulating ? `${i * 50}ms` : '0ms',
                          animationName: isSimulating && i < Math.floor(impactScore / 5) ? 'fillBlock' : 'none',
                          animationDuration: '0.2s',
                          animationTimingFunction: 'ease-in-out',
                          animationFillMode: 'forwards'
                        }}
                      ></span>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1 text-white/40">
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>
                
                <div className="text-xs font-mono text-white/60 mt-2">
                  Status: {impactScore <= 20 ? 'CRITICAL' : 
                           impactScore <= 40 ? 'LOW' :
                           impactScore <= 60 ? 'MODERATE' :
                           impactScore <= 80 ? 'HIGH' : 'OPTIMAL'}
                </div>
              </div>
            </div>

            {/* Agent Activity Block */}
            <div className="border border-white/20 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400"></div>
                  <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Agent Activity</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-lg font-mono font-bold text-white transition-all duration-500 ${
                      isSimulating ? 'animate-pulse' : ''
                    }`}>
                      {metrics.fullAttention || 0}
                    </div>
                    <div className="text-xs text-white/60">High</div>
                  </div>
                  <div>
                    <div className={`text-lg font-mono font-bold text-white transition-all duration-500 ${
                      isSimulating ? 'animate-pulse' : ''
                    }`}>
                      {metrics.partialAttention || 0}
                    </div>
                    <div className="text-xs text-white/60">Medium</div>
                  </div>
                  <div>
                    <div className={`text-lg font-mono font-bold text-white transition-all duration-500 ${
                      isSimulating ? 'animate-pulse' : ''
                    }`}>
                      {metrics.ignored || 0}
                    </div>
                    <div className="text-xs text-white/60">Low</div>
                  </div>
                </div>
                
                {/* Engagement Level Blocks */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white"></div>
                      <span className="text-xs font-mono text-white/80">HIGH ENGAGEMENT</span>
                    </div>
                    <span className={`text-xs font-mono text-white/60 transition-all duration-300 ${
                      isSimulating ? 'animate-pulse' : ''
                    }`}>
                      {fullPercent}
                    </span>
                  </div>
                  <div className="flex">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-2 mr-1 transition-all duration-300 ${
                          i < Math.floor(fullPercent / 10) ? 'bg-white' : 
                          isSimulating ? 'bg-white/20 pulse-box' : 'bg-white/20'
                        }`}
                        style={{
                          animationDelay: isSimulating ? `${i * 100}ms` : '0ms',
                          animationName: isSimulating && i < Math.floor(fullPercent / 10) ? 'fillBlock' : 'none',
                          animationDuration: '0.3s',
                          animationTimingFunction: 'ease-in-out',
                          animationFillMode: 'forwards'
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white"></div>
                      <span className="text-xs font-mono text-white/80">MEDIUM ENGAGEMENT</span>
                    </div>
                    <span className={`text-xs font-mono text-white/60 transition-all duration-300 ${
                      isSimulating ? 'animate-pulse' : ''
                    }`}>
                      {partialPercent}
                    </span>
                  </div>
                  <div className="flex">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-2 mr-1 transition-all duration-300 ${
                          i < Math.floor(partialPercent / 10) ? 'bg-white' : 
                          isSimulating ? 'bg-white/20 pulse-box' : 'bg-white/20'
                        }`}
                        style={{
                          animationDelay: isSimulating ? `${i * 100}ms` : '0ms',
                          animationName: isSimulating && i < Math.floor(partialPercent / 10) ? 'fillBlock' : 'none',
                          animationDuration: '0.3s',
                          animationTimingFunction: 'ease-in-out',
                          animationFillMode: 'forwards'
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white"></div>
                      <span className="text-xs font-mono text-white/80">LOW ENGAGEMENT</span>
                    </div>
                    <span className={`text-xs font-mono text-white/60 transition-all duration-300 ${
                      isSimulating ? 'animate-pulse' : ''
                    }`}>
                      {ignorePercent}
                    </span>
                  </div>
                  <div className="flex">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-2 mr-1 transition-all duration-300 ${
                          i < Math.floor(ignorePercent / 10) ? 'bg-white' : 
                          isSimulating ? 'bg-white/20 pulse-box' : 'bg-white/20'
                        }`}
                        style={{
                          animationDelay: isSimulating ? `${i * 100}ms` : '0ms',
                          animationName: isSimulating && i < Math.floor(ignorePercent / 10) ? 'fillBlock' : 'none',
                          animationDuration: '0.3s',
                          animationTimingFunction: 'ease-in-out',
                          animationFillMode: 'forwards'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>


             {/* Reaction List */}
             {reactions.length > 0 && (
            <div className="border border-white/20 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400"></div>
                    <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Live Reactions</span>
                </div>
                  <span className="text-xs text-white/60 font-mono">{reactions.length} RESPONSES</span>
              </div>
              
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {reactions.slice(-5).reverse().map((reaction, index) => (
                    <div key={`${reaction.personaId}-${index}`} className="text-xs border-l-2 border-white/20 pl-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/90 font-mono">{reaction.persona?.name || 'Unknown'}</span>
                        <div className={`w-2 h-2 ${
                          reaction.attention === 'full' ? 'bg-green-400' :
                          reaction.attention === 'partial' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                      </div>
                      {reaction.comment && (
                        <div className="text-white/60 mt-1 italic">
                          "{reaction.comment.substring(0, 60)}..."
                        </div>
                      )}
                      <div className="text-white/40 mt-1">
                        {reaction.reason?.substring(0, 80)}...
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/20">
                  <button className="w-full px-3 py-2 border border-white/20 bg-black/60 hover:bg-white/5 text-xs font-mono text-white/80 transition-all">
                    {'>'} INITIATE FOLLOW-UP PROTOCOL
                  </button>
                </div>
              </div>
            )}

            {/* Mission Deliverables Block - Show when there are reactions OR feedback */}
            {false && (
              <div className="border border-white/20 bg-black/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400"></div>
                    <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Mission Deliverables</span>
                  </div>
                  {/* Add Improve Prompt Button - Show when reactions are available */}
                  {reactions.length > 0 && (
                    <Button
                      onClick={generateImprovedPrompt}
                      disabled={isGeneratingImprovedPrompt}
                      className="bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs px-3 py-1 h-auto"
                    >
                      {isGeneratingImprovedPrompt ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Improving...
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3 w-3 mr-1" />
                          Improve Prompt
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {/* Show actionable feedback if available */}
                  {showFeedback && feedbackSummary && (
                    <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Actionable Feedback</span>
                        {isGeneratingFeedback && (
                      <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                            <span className="text-xs text-cyan-400 font-mono">Generating...</span>
                      </div>
                        )}
                      </div>
                      <div className="text-sm text-white/90 font-mono leading-relaxed whitespace-pre-line">
                        {feedbackSummary}
                    </div>
                      
                      {/* Show improved prompt if generated */}
                      {improvedPrompt && (
                        <div className="mt-4 pt-4 border-t border-cyan-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-green-400 uppercase tracking-wider">Improved Prompt</span>
                            <Button
                              onClick={() => {
                                setPostContent(improvedPrompt);
                                setSelectedUsers([]);
                                setReactions([]);
                                setMetrics({
                                  score: 0,
                                  totalResponses: 0,
                                  fullAttention: 0,
                                  partialAttention: 0,
                                  ignored: 0,
                                  viralCoefficient: 0,
                                  avgSentiment: 0
                                });
                                setHasEnteredPrompt(false);
                                setGlobeDots([]);
                                setNichePersonaIds([]);
                                setInsights(null);
                                setShowFeedback(false);
                                setFeedbackSummary('');
                                setImprovedPrompt('');
                              }}
                              className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 text-xs px-2 py-1 h-auto"
                            >
                              Use This Version
                            </Button>
                    </div>
                          <div className="text-sm text-green-300/90 font-mono leading-relaxed bg-green-900/10 border border-green-500/20 p-3 rounded">
                            {improvedPrompt}
                      </div>
                      </div>
                      )}
                    </div>
                  )}
                  
                  {/* Original threat analysis - only show if no feedback */}
                  {!showFeedback && reactions.filter(r => r.attention === 'ignore').length > 30 && (
                    <div>
                      <div className="text-xs font-mono text-white/60 mb-2">
                        HOSTILE TARGETS: {Math.round(reactions.filter(r => r.attention === 'ignore').length / reactions.length * 100)}% resistance
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {reactions.filter(r => r.attention === 'ignore' && r.reason)
                          .slice(0, 3)
                          .map((r, i) => (
                            <div key={i} className="text-xs font-mono bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent pl-2 border-l-2 border-red-400/50 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-red-500/60 before:to-rose-400/40">
                              {r.reason}
                  </div>
                ))}
              </div>
                    </div>
                  )}
                  
                  {/* Rest of the original content... */}
                  {!showFeedback && reactions.filter(r => r.attention === 'partial').length > 20 && (
                    <div className="pt-2 border-t border-white/20">
                      <div className="text-xs font-mono text-white/60 mb-2">
                        SURVEILLANCE MODE: {Math.round(reactions.filter(r => r.attention === 'partial').length / reactions.length * 100)}% monitoring
              </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {reactions.filter(r => r.attention === 'partial' && r.reason)
                          .slice(0, 3)
                          .map((r, i) => (
                            <div key={i} className="text-xs font-mono text-yellow-400 pl-2 border-l border-yellow-400/30">
                              {r.reason}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {!showFeedback && reactions.filter(r => r.attention === 'full' && r.comment).length > 0 && (
                    <div className="pt-2 border-t border-white/20">
                      <div className="text-xs font-mono text-white/60 mb-2">
                        ALLIED FORCES: {Math.round(reactions.filter(r => r.attention === 'full').length / reactions.length * 100)}% engaged
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {reactions.filter(r => r.attention === 'full' && r.comment)
                          .slice(0, 3)
                          .map((r, i) => (
                            <div key={i} className="text-xs font-mono text-green-400 pl-2 border-l border-green-400/30">
                              {r.comment}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback List Block - Only show in focus group mode */}
            {!isGlobalDeployment && (
            <div className="border border-white/20 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400"></div>
                  <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Feedback List ({feedbackList.length})</span>
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {feedbackList.map((item, i) => (
                  <div 
                    key={i}
                    className="p-3 border border-white/20 rounded bg-black/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-white/80">{item.persona.name}</span>
                      <Badge className={`text-xs ${
                        item.reaction.attention === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.reaction.attention === 'partial' ? 'Neutral' : 'Negative'}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">{item.reaction.comment || item.reaction.reason}</p>
                  </div>
                ))}
                
                {feedbackList.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-xs text-white/40 font-mono">No feedback collected yet</div>
                  </div>
                )}
              </div>
              
              {/* Refine Button - styled like live reactions */}
              {feedbackList.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/20">
                  <Button
                    onClick={refineIdea}
                    disabled={isRefining}
                    className="w-full bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-600/40 font-mono text-xs"
                  >
                    {isRefining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Refining Idea...
                      </>
                    ) : justRefined ? (
                      'Refined ✓'
                    ) : (
                      'Refine Idea Based on Feedback'
                    )}
                  </Button>
              </div>
              )}
            </div>
            )}

            {/* Brief Announcement Block */}
            {false && (
              <div className="border border-white/20 bg-black/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400"></div>
                    <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Brief Announcement</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {insights.topIgnoreReasons && insights.topIgnoreReasons.length > 0 && (
                    <div>
                      <div className="text-xs font-mono text-white/60 mb-2">
                        THREAT ANALYSIS: {ignorePercent}% resistance detected
                      </div>
                      <div className="space-y-1">
                        {insights.topIgnoreReasons.slice(0, 3).map((reason: string, i: number) => (
                          <div key={i} className="text-xs font-mono bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent pl-2 border-l-2 border-red-400/50 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-red-500/60 before:to-rose-400/40">
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {insights.recommendations && insights.recommendations.length > 0 && (
                    <div className="pt-2 border-t border-white/20">
                      <div className="text-xs font-mono text-white/60 mb-2">
                        TACTICAL RECOMMENDATIONS:
                      </div>
                      <div className="space-y-2">
                        {insights.recommendations.slice(0, 3).map((rec: string, i: number) => (
                          <div key={i} className="text-xs font-mono text-white/80 pl-2 border-l border-green-400/30">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {insights.viralPotentialScore !== undefined && (
                    <div className="pt-2 border-t border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-white/60">VIRAL COEFFICIENT:</span>
                        <span className="text-sm font-mono font-bold text-cyan-400">{insights.viralPotentialScore}/100</span>
                      </div>
                      {insights.viralPotentialExplanation && (
                        <div className="text-xs font-mono text-white/60 leading-relaxed">
                          {insights.viralPotentialExplanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Target Operation Block */}
            {false && (
              <div className="border border-white/20 bg-black/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400"></div>
                    <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Target Operation</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Threat Analysis */}
                  {reactions.filter(r => r.attention === 'ignore').length > 30 && (
                    <div>
                      <div className="text-xs font-mono text-white/60 mb-2">
                        HOSTILE TARGETS: {Math.round(reactions.filter(r => r.attention === 'ignore').length / reactions.length * 100)}% resistance
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {reactions.filter(r => r.attention === 'ignore' && r.reason)
                          .slice(0, 3)
                          .map((r, i) => (
                            <div key={i} className="text-xs font-mono bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent pl-2 border-l-2 border-red-400/50 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-red-500/60 before:to-rose-400/40">
                              "{r.reason}"
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {reactions.filter(r => r.attention === 'partial').length > 20 && (
                    <div className="pt-2 border-t border-white/20">
                      <div className="text-xs font-mono text-white/60 mb-2">
                        SURVEILLANCE MODE: {Math.round(reactions.filter(r => r.attention === 'partial').length / reactions.length * 100)}% monitoring
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {reactions.filter(r => r.attention === 'partial' && r.reason)
                          .slice(0, 3)
                          .map((r, i) => (
                            <div key={i} className="text-xs font-mono text-yellow-400 pl-2 border-l border-yellow-400/30">
                              "{r.reason}"
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {reactions.filter(r => r.attention === 'full' && r.comment).length > 0 && (
                    <div className="pt-2 border-t border-white/20">
                      <div className="text-xs font-mono text-white/60 mb-2">
                        ALLIED FORCES: {Math.round(reactions.filter(r => r.attention === 'full').length / reactions.length * 100)}% engaged
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {reactions.filter(r => r.attention === 'full' && r.comment)
                          .slice(0, 3)
                          .map((r, i) => (
                            <div key={i} className="text-xs font-mono text-green-400 pl-2 border-l border-green-400/30">
                              "{r.comment}"
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Simple Input Area at Bottom */}
            <div className="border border-white/20 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400"></div>
                  <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Analysis Input</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Enter your idea to analyze against personas..."
                  className="w-full p-3 bg-black border border-white/20 text-white font-mono text-sm focus:border-white/40 focus:outline-none h-20 resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      if (!hasEnteredPrompt) {
                        findNicheUsers();
                      } else {
                        runAnalysis();
                      }
                    }
                  }}
                />
                
                {/* Small text about global deployment */}
                <div className="text-xs text-white/40 font-mono text-center">
                  When you're ready, deploy your idea to the whole world
                </div>
                
                <div className="flex justify-between items-center gap-2">
                  <div className="text-xs text-white/60 font-mono">
                    {selectedUsers.length > 0 ? `${selectedUsers.length} users selected via Cohere` : `${allUsers.length} Auth0 users loaded`}
                  </div>
                  <div className="flex gap-2">
                    {!hasEnteredPrompt ? (
                      <Button
                        onClick={findNicheUsers}
                        disabled={!postContent.trim() || isSelectingNiche}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 font-mono text-xs px-4 py-2"
                      >
                        {isSelectingNiche ? 'Finding...' : 'Focus Group'}
                      </Button>
                    ) : (
                      <Button
                        onClick={runAnalysis}
                        disabled={selectedUsers.length === 0 || isRunningAnalysis}
                        className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 font-mono text-xs px-4 py-2 text-green-300"
                      >
                        {isRunningAnalysis ? 'Running...' : 'Run Analysis'}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-white/40 font-mono">
                  {!hasEnteredPrompt 
                    ? 'Ctrl+Enter to select focus group • Uses Cohere to select 5 most relevant personas'
                    : 'Click "Run Analysis" to analyze sentiment of selected users'}
                </div>
              </div>
            </div>
            
           
                      </div>
        </div>
      </div>

      {/* Type Selector Modal */}
        <AnimatePresence>
          {showTypeSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowTypeSelector(false)}
            >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-black border border-white/20 p-8 rounded-lg max-w-3xl w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl">What would you like to simulate?</h2>
                    <button onClick={() => setShowTypeSelector(false)}>
                      <X className="h-5 w-5 text-white/60 hover:text-white" />
                    </button>
                  </div>
                      
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-xs text-white/60 mb-3">PROJECT IDEA</h3>
                      <button
                        onClick={() => handleTypeSelect('project-idea')}
                        className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                      >
                        <FileText className="h-4 w-4" />
                        <div>
                          <div className="text-sm">Project Idea</div>
                          <Badge variant="outline" className="text-xs mt-1">New</Badge>
                        </div>
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xs text-white/60 mb-3">SOCIAL MEDIA POSTS</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleTypeSelect('linkedin')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span className="text-sm">LinkedIn Post</span>
                        </button>
                        <button
                          onClick={() => handleTypeSelect('instagram')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Instagram className="h-4 w-4" />
                          <span className="text-sm">Instagram Post</span>
                        </button>
                        <button
                          onClick={() => handleTypeSelect('twitter')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Twitter className="h-4 w-4" />
                          <span className="text-sm">X Post</span>
                        </button>
                        <button
                          onClick={() => handleTypeSelect('tiktok')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Video className="h-4 w-4" />
                          <span className="text-sm">TikTok Script</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs text-white/60 mb-3">COMMUNICATION</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleTypeSelect('email-subject')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">Email Subject Line</span>
                        </button>
                        <button
                          onClick={() => handleTypeSelect('email')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">Email</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs text-white/60 mb-3">MARKETING CONTENT</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleTypeSelect('article')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span className="text-sm">Article</span>
                        </button>
                        <button
                          onClick={() => handleTypeSelect('website')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">Website Content</span>
                        </button>
                        <button
                          onClick={() => handleTypeSelect('ad')}
                          className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                        >
                          <Megaphone className="h-4 w-4" />
                          <span className="text-sm">Advertisement</span>
                        </button>
                      </div>
                    </div>

                    <div></div>

                    <div>
                      <h3 className="text-xs text-white/60 mb-3">PRODUCT</h3>
                      <button
                        onClick={() => handleTypeSelect('product')}
                        className="w-full p-3 border border-white/20 rounded hover:bg-white/5 text-left flex items-center gap-3"
                      >
                        <Package className="h-4 w-4" />
                        <span className="text-sm">Product Proposition</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button className="text-xs text-white/40 hover:text-white/60 flex items-center gap-2 mx-auto">
                      <Plus className="h-3 w-3" />
                      Request a new context
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent Project Idea Input - Always Visible */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-8 z-20 flex justify-center"
            style={{
              left: '256px', // Left sidebar width (w-64 = 16rem = 256px)
              right: `${rightSidebarWidth}px`, // Dynamic right sidebar width
              paddingLeft: '1rem',
              paddingRight: '1rem'
            }}
          >
            <div className="bg-black/95 border border-white/20 rounded-lg p-4 backdrop-blur-lg w-full max-w-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!hasEnteredPrompt) {
                        findNicheUsers();
                      } else {
                        runAnalysis();
                      }
                    }
                  }}
                  placeholder="Enter your idea to analyze against personas..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/40"
                  autoFocus
                />
                <Button
                  onClick={!hasEnteredPrompt ? findNicheUsers : runAnalysis}
                  disabled={!postContent.trim() || (!hasEnteredPrompt ? isSelectingNiche : (selectedUsers.length === 0 || isRunningAnalysis))}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-4"
                >
                  {!hasEnteredPrompt ? (isSelectingNiche ? 'Finding...' : 'Focus Group') : (isRunningAnalysis ? (isGlobalDeployment ? 'Deploying...' : 'Running...') : 'Analyze')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Persona Detail Modal */}
      <AnimatePresence>
        {selectedPersona && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPersona(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border border-white/20 p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4">{selectedPersona.name}</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-white/60">Title:</span>
                  <span className="ml-2">{selectedPersona.title}</span>
                </div>
                <div>
                  <span className="text-white/60">Location:</span>
                  <span className="ml-2">{(selectedPersona.user_metadata || selectedPersona).location.city}, {(selectedPersona.user_metadata || selectedPersona).location.country}</span>
                </div>
                <div>
                  <span className="text-white/60">Generation:</span>
                  <span className="ml-2">{(selectedPersona.user_metadata || selectedPersona).demographics.generation}</span>
                </div>
                <div>
                  <span className="text-white/60">Industry:</span>
                  <span className="ml-2">{(selectedPersona.user_metadata || selectedPersona).professional.primaryIndustry}</span>
                </div>
              </div>
              
              {reactions.find(r => r.personaId === (selectedPersona.user_metadata || selectedPersona).personaId) && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h3 className="text-sm mb-2">Reaction</h3>
                  {(() => {
                    const reaction = reactions.find(r => r.personaId === (selectedPersona.user_metadata || selectedPersona).personaId);
                    return reaction ? (
                      <div className="space-y-2 text-xs">
                        <Badge 
                          className={`${
                            reaction.attention === 'full' ? 'bg-green-900/30 text-green-400' :
                            reaction.attention === 'partial' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-gradient-to-br from-red-900/40 via-rose-900/30 to-red-800/20 border border-red-500/30 shadow-lg shadow-red-500/20 text-red-300'
                          }`}
                        >
                          {reaction.attention}
                        </Badge>
                        <p className="text-white/80">{reaction.reason}</p>
                        {reaction.comment && (
                          <p className="text-white/60 italic">"{reaction.comment}"</p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              
              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {/* Voice Call Interface */}
              {isInCall && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                        connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                        'bg-red-400'
                      }`}></div>
                      <span className="text-xs font-mono text-white/80 uppercase tracking-wider">Live Call</span>
                    </div>
                    <span className="text-xs text-white/60 font-mono">{formatDuration(callDuration)}</span>
                  </div>
                  
                  {/* Live Transcription - Fixed Height */}
                  <div className="bg-black/40 border border-white/20 p-3 rounded mb-3 h-[80px] overflow-y-auto">
                    <div className="text-xs text-white/60 mb-2 font-mono">LIVE TRANSCRIPTION:</div>
                    <div className="text-sm text-white/80 font-mono leading-relaxed">
                      {transcription || 'Waiting for speech...'}
                    </div>
                  </div>
                  
                  {/* Call Controls */}
                  <div className="flex items-center justify-center gap-3">
              <Button
                      onClick={toggleMute}
                      className={`w-12 h-12 rounded-full border-2 ${
                        isMuted 
                          ? 'bg-red-600/20 border-red-500/40 text-red-400 hover:bg-red-600/30' 
                          : 'bg-white/10 border-white/40 text-white hover:bg-white/20'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
                    
                    <Button
                      onClick={endCall}
                      className="w-12 h-12 rounded-full bg-red-600/20 border-red-500/40 text-red-400 hover:bg-red-600/30"
                    >
                      <Phone className="w-5 h-5 rotate-45" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                {reactions.find(r => r.personaId === (selectedPersona.user_metadata || selectedPersona).personaId) && !isInCall && (
                  <Button
                    onClick={startCall}
                    disabled={isConnecting}
                    className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/40"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Call {selectedPersona.name.split(' ')[0]}
                      </>
                    )}
                  </Button>
                )}

                {/* Add to Feedback List Button - only show for negative/neutral reactions */}
                {(() => {
                  const reaction = reactions.find(r => r.personaId === (selectedPersona.user_metadata || selectedPersona).personaId);
                  return reaction && (reaction.attention === 'ignore' || reaction.attention === 'partial') && (
                    <Button
                      onClick={() => addToFeedbackList(selectedPersona, reaction)}
                      className="flex-1 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-600/40"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Add to Feedback
                    </Button>
                  );
                })()}
                
                {/* Get Feedback Button - only show when not in call and have conversation */}
                {!isInCall && transcript.length > 0 && (
                  <Button
                    onClick={openFeedbackModal}
                    disabled={isGeneratingFeedback}
                    className="flex-1 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-600/40"
                  >
                    {isGeneratingFeedback ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Get Feedback
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    if (isInCall) {
                      endCall();
                    }
                    setSelectedPersona(null);
                  }}
                  className="flex-1 bg-white/10 text-white hover:bg-white/20"
                >
                  {isInCall ? 'End Call & Close' : 'Close'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default SimulationDashboard;
