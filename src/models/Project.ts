import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  userId: string; // Auth0 ID
  name: string;
  description?: string;
  phase1Data?: any; // Ideation results
  phase2Data?: any; // Focus group results  
  simulations: mongoose.Types.ObjectId[]; // References to Simulation documents
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  phase1Data: { type: Schema.Types.Mixed },
  phase2Data: { type: Schema.Types.Mixed },
  simulations: [{ type: Schema.Types.ObjectId, ref: 'Simulation' }]
}, {
  timestamps: true
});

// Indexes
ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ name: 'text' }); // Text search on project names

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
