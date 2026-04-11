import mongoose, { Schema, Document } from 'mongoose';

export interface IReaction {
  personaId: number;
  attention: 'full' | 'partial' | 'ignore';
  reason: string;
  comment?: string;
  sentiment: number; // 0-1
  timestamp: Date;
}

export interface ISimulation extends Document {
  userId: string; // Auth0 ID
  projectId?: mongoose.Types.ObjectId;
  postContent: string;
  platform?: string; // Platform type (linkedin, twitter, etc.)
  postAnalysis: {
    category: string;
    targetAudience: string[];
    valueProps: string[];
    tone: string;
    concerns?: string[];
  };
  reactions: IReaction[];
  metrics: {
    score: number;
    fullAttention: number;
    partialAttention: number;
    ignored: number;
    viralCoefficient: number;
    avgSentiment: number;
    totalResponses: number;
  };
  insights?: {
    topEngagementReasons: string[];
    topIgnoreReasons: string[];
    demographicBreakdown: Record<string, any>;
    industryBreakdown: Record<string, any>;
    recommendations: string[];
    viralPotentialScore: number;
    unexpectedAudiences: string[];
  };
  cost: {
    cohere: number;
    martian: number;
    cerebras: number;
    total: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

const ReactionSchema = new Schema({
  personaId: { type: Number, required: true },
  attention: { 
    type: String, 
    enum: ['full', 'partial', 'ignore'],
    required: true 
  },
  reason: { type: String, required: true },
  comment: { type: String },
  sentiment: { type: Number, min: 0, max: 1, required: true },
  timestamp: { type: Date, default: Date.now }
});

const SimulationSchema = new Schema<ISimulation>({
  userId: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  postContent: { type: String, required: true },
  platform: { type: String, default: 'product' },
  postAnalysis: {
    category: { type: String },
    targetAudience: [{ type: String }],
    valueProps: [{ type: String }],
    tone: { type: String },
    concerns: [{ type: String }]
  },
  reactions: [ReactionSchema],
  metrics: {
    score: { type: Number, default: 0 },
    fullAttention: { type: Number, default: 0 },
    partialAttention: { type: Number, default: 0 },
    ignored: { type: Number, default: 0 },
    viralCoefficient: { type: Number, default: 0 },
    avgSentiment: { type: Number, default: 0 },
    totalResponses: { type: Number, default: 0 }
  },
  insights: {
    topEngagementReasons: [{ type: String }],
    topIgnoreReasons: [{ type: String }],
    demographicBreakdown: { type: Schema.Types.Mixed },
    industryBreakdown: { type: Schema.Types.Mixed },
    recommendations: [{ type: String }],
    viralPotentialScore: { type: Number, min: 0, max: 100 },
    unexpectedAudiences: [{ type: String }]
  },
  cost: {
    cohere: { type: Number, default: 0 },
    martian: { type: Number, default: 0 },
    cerebras: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for efficient queries
SimulationSchema.index({ userId: 1, createdAt: -1 });
SimulationSchema.index({ projectId: 1 });
SimulationSchema.index({ status: 1 });
SimulationSchema.index({ createdAt: -1 });

export default mongoose.models.Simulation || mongoose.model<ISimulation>('Simulation', SimulationSchema);
