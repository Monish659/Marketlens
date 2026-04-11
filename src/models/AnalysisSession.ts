import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysisSession extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: string; // Auth0 ID
  sessionName: string; // Auto-generated or user-provided
  prompt: string;
  
  // Analysis state
  analysisState: {
    niche: string;
    nicheExtracted: boolean;
    selectedUsers: any[]; // Store the selected personas
    opinions: any[]; // Store generated opinions
    metrics: {
      score: number;
      totalResponses: number;
      fullAttention: number;
      partialAttention: number;
      ignored: number;
      viralCoefficient: number;
      avgSentiment: number;
    };
    globeDots: any[]; // Store globe visualization data
    reactions: any[]; // Store all reactions
    insights: any; // Store generated insights
    nicheInfo: any; // Store niche information
  };
  
  // UI state
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
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

const AnalysisSessionSchema = new Schema<IAnalysisSession>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: String, required: true },
  sessionName: { type: String, required: true },
  prompt: { type: String, required: true },
  
  analysisState: {
    niche: { type: String, default: '' },
    nicheExtracted: { type: Boolean, default: false },
    selectedUsers: { type: [Schema.Types.Mixed], default: [] },
    opinions: { type: [Schema.Types.Mixed], default: [] },
    metrics: {
      score: { type: Number, default: 0 },
      totalResponses: { type: Number, default: 0 },
      fullAttention: { type: Number, default: 0 },
      partialAttention: { type: Number, default: 0 },
      ignored: { type: Number, default: 0 },
      viralCoefficient: { type: Number, default: 0 },
      avgSentiment: { type: Number, default: 0 }
    },
    globeDots: { type: [Schema.Types.Mixed], default: [] },
    reactions: { type: [Schema.Types.Mixed], default: [] },
    insights: { type: Schema.Types.Mixed, default: null },
    nicheInfo: { type: Schema.Types.Mixed, default: null }
  },
  
  uiState: {
    viewMode: { type: String, enum: ['niche', 'global'], default: 'global' },
    selectedPersonaId: { type: Number },
    expandedNodes: { type: [String], default: [] },
    activeTab: { type: String },
    simulationType: { type: String },
    currentSociety: { type: String },
    processedPersonas: { type: Number, default: 0 },
    currentProcessingStep: { type: String, default: '' }
  },
  
  lastAccessedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for efficient querying
AnalysisSessionSchema.index({ userId: 1, createdAt: -1 });
AnalysisSessionSchema.index({ projectId: 1, createdAt: -1 });
AnalysisSessionSchema.index({ userId: 1, projectId: 1 });
AnalysisSessionSchema.index({ sessionName: 'text' }); // Text search on session names

// Update lastAccessedAt on every find operation
AnalysisSessionSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function() {
  this.set({ lastAccessedAt: new Date() });
});

export default mongoose.models.AnalysisSession || mongoose.model<IAnalysisSession>('AnalysisSession', AnalysisSessionSchema);
