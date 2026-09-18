const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Service = require('./models/Service');
const Token = require('./models/Token');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartq');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Service.deleteMany({});
    await Token.deleteMany({});

    console.log('Cleared existing database records.');

    // Create Admin User
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@smartq.com',
      password: 'password123',
      role: 'admin',
      phone: '+1 800-555-0199'
    });

    // Create Standard Demo User
    const demoUser = await User.create({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: 'password123',
      role: 'user',
      phone: '+1 555-0142'
    });

    // Create Organizations
    const metroHospital = await Organization.create({
      name: 'Metro City Health Hospital',
      code: 'MCH',
      description: 'Premier regional healthcare center with specialized departments.',
      address: '100 Healthcare Blvd, Metro City'
    });

    const apexBank = await Organization.create({
      name: 'Apex Global Bank',
      code: 'AGB',
      description: 'Full-service financial center providing commercial & retail banking.',
      address: '500 Financial Center Way, Downtown'
    });

    // Create Services for Metro Hospital
    const opdService = await Service.create({
      organizationId: metroHospital._id,
      name: 'OPD General Consultation',
      prefix: 'OPD',
      description: 'General Outpatient Doctor Consultation & Triage',
      estimatedTimePerUser: 10,
      status: 'open',
      currentCounter: 100
    });

    const labService = await Service.create({
      organizationId: metroHospital._id,
      name: 'Blood Test & Diagnostics Lab',
      prefix: 'LAB',
      description: 'Routine blood draws, imaging & diagnostic sample collection',
      estimatedTimePerUser: 5,
      status: 'open',
      currentCounter: 200
    });

    // Create Services for Apex Bank
    const tellerService = await Service.create({
      organizationId: apexBank._id,
      name: 'Cash Deposit & Withdrawal Counter',
      prefix: 'CSH',
      description: 'In-person teller transactions, cash & check deposits',
      estimatedTimePerUser: 4,
      status: 'open',
      currentCounter: 300
    });

    const loanService = await Service.create({
      organizationId: apexBank._id,
      name: 'Personal & Home Loan Advisory',
      prefix: 'LON',
      description: 'Loan applications, mortgage guidance & credit consultation',
      estimatedTimePerUser: 15,
      status: 'open',
      currentCounter: 400
    });

    console.log('Seed completed successfully!');
    console.log('--- DEFAULT CREDENTIALS ---');
    console.log('Admin Email: admin@smartq.com | Password: password123');
    console.log('User Email: alex@example.com   | Password: password123');
    console.log('---------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();
