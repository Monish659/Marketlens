import mongoose, { Schema, Document } from 'mongoose';

export interface IPersona extends Document {
  personaId: number;
  name: string;
  title: string;
  avatar?: string;
  location: {
    city: string;
    country: string;
    coordinates: {
      type: string;
      coordinates: [number, number]; // [lng, lat] for GeoJSON
    };
  };
  demographics: {
    generation: 'Gen Z' | 'Millennial' | 'Gen X' | 'Boomer';
    gender: string;
    ageRange: string;
  };
  professional: {
    seniority: string;
    primaryIndustry: string;
    secondaryIndustry?: string;
    companySize: string;
    yearsExperience: number;
  };
  psychographics: {
    techAdoption: number; // 1-10
    riskTolerance: number; // 1-10
    priceSensitivity: number; // 1-10
    influenceScore: number; // 1-10
    brandLoyalty: number; // 1-10
  };
  interests: string[];
  personality: {
    openness: number; // 0-1
    conscientiousness: number; // 0-1
    extraversion: number; // 0-1
    agreeableness: number; // 0-1
    neuroticism: number; // 0-1
  };
  dataSources: string[];
}

const PersonaSchema = new Schema<IPersona>({
  personaId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  avatar: { type: String },
  location: {
    city: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    }
  },
  demographics: {
    generation: { 
      type: String, 
      enum: ['Gen Z', 'Millennial', 'Gen X', 'Boomer'],
      required: true 
    },
    gender: { type: String, required: true },
    ageRange: { type: String, required: true }
  },
  professional: {
    seniority: { type: String, required: true },
    primaryIndustry: { type: String, required: true },
    secondaryIndustry: { type: String },
    companySize: { type: String, required: true },
    yearsExperience: { type: Number, required: true }
  },
  psychographics: {
    techAdoption: { type: Number, min: 1, max: 10, required: true },
    riskTolerance: { type: Number, min: 1, max: 10, required: true },
    priceSensitivity: { type: Number, min: 1, max: 10, required: true },
    influenceScore: { type: Number, min: 1, max: 10, required: true },
    brandLoyalty: { type: Number, min: 1, max: 10, required: true }
  },
  interests: [{ type: String }],
  personality: {
    openness: { type: Number, min: 0, max: 1, required: true },
    conscientiousness: { type: Number, min: 0, max: 1, required: true },
    extraversion: { type: Number, min: 0, max: 1, required: true },
    agreeableness: { type: Number, min: 0, max: 1, required: true },
    neuroticism: { type: Number, min: 0, max: 1, required: true }
  },
  dataSources: [{ type: String }]
}, {
  timestamps: true
});

// Add geospatial index for location-based queries
PersonaSchema.index({ 'location.coordinates': '2dsphere' });
// Removed duplicate personaId index since it's already unique
PersonaSchema.index({ 'demographics.generation': 1 });
PersonaSchema.index({ 'professional.seniority': 1 });
PersonaSchema.index({ 'location.country': 1 });

export default mongoose.models.Persona || mongoose.model<IPersona>('Persona', PersonaSchema);