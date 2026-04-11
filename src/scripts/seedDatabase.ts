import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { allPersonas } from '../data/personas';
import Persona from '../models/Persona';

dotenv.config({ path: '.env.local' });

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || '';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing personas
    await Persona.deleteMany({});
    console.log('Cleared existing personas');

    // Insert all personas
    const insertedPersonas = await Persona.insertMany(allPersonas);
    console.log(`Successfully inserted ${insertedPersonas.length} personas`);

    // Create indexes
    await Persona.createIndexes();
    console.log('Created indexes');

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
