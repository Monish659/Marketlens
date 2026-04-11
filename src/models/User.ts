import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  auth0Id: string;
  email: string;
  name?: string;
  picture?: string;
  credits: number;
  subscription: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  auth0Id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  picture: { type: String },
  credits: { type: Number, default: 50 },
  subscription: { 
    type: String, 
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  }
}, {
  timestamps: true
});

// Removed duplicate indexes since auth0Id and email are already unique

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);