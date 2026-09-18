const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Service = require('./models/Service');
const Counter = require('./models/Counter');
const Token = require('./models/Token');
const Notification = require('./models/Notification');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartq');
    console.log('Connected to MongoDB for comprehensive seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Service.deleteMany({});
    await Counter.deleteMany({});
    await Token.deleteMany({});
    await Notification.deleteMany({});

    console.log('Cleared all existing database collections.');

    // 1. Create Users
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@smartq.com',
      password: 'password123',
      role: 'admin',
      phone: '+1 800-555-0199'
    });

    const alex = await User.create({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: 'password123',
      role: 'user',
      phone: '+1 555-0142'
    });

    const sarah = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      password: 'password123',
      role: 'user',
      phone: '+1 555-0188'
    });

    const michael = await User.create({
      name: 'Michael Scott',
      email: 'michael@example.com',
      password: 'password123',
      role: 'user',
      phone: '+1 555-0199'
    });

    // 2. Create Organizations across multiple categories
    const hospital = await Organization.create({
      name: 'Metro City Health Hospital',
      code: 'MCH',
      description: 'Premier regional healthcare center with specialized departments and diagnostic labs.',
      address: '100 Healthcare Blvd, Metro City'
    });

    const bank = await Organization.create({
      name: 'Apex Global Bank',
      code: 'AGB',
      description: 'Full-service financial center providing commercial, retail & loan advisory banking.',
      address: '500 Financial Center Way, Downtown'
    });

    const govt = await Organization.create({
      name: 'Metro Municipal Corporation',
      code: 'MMC',
      description: 'Government public services, civil documentation & civic registration authority.',
      address: '1 Civic Square, City Center'
    });

    const telecom = await Organization.create({
      name: 'Horizon Telecom Center',
      code: 'HTC',
      description: 'Customer service hub for high-speed mobile, broadband & corporate telecom plans.',
      address: '75 Network Avenue, Tech Park'
    });

    // 3. Create Services for each Organization
    // Healthcare Services
    const opdService = await Service.create({
      organizationId: hospital._id,
      name: 'OPD General Consultation',
      prefix: 'OPD',
      description: 'General Outpatient Doctor Consultation & Triage',
      estimatedTimePerUser: 10,
      historicalAvgDuration: 8.5,
      status: 'open',
      currentCounter: 105
    });

    const labService = await Service.create({
      organizationId: hospital._id,
      name: 'Blood Test & Diagnostics Lab',
      prefix: 'LAB',
      description: 'Routine blood draws, imaging & diagnostic sample collection',
      estimatedTimePerUser: 5,
      historicalAvgDuration: 4.2,
      status: 'open',
      currentCounter: 208
    });

    const radService = await Service.create({
      organizationId: hospital._id,
      name: 'Radiology & X-Ray Imaging',
      prefix: 'RAD',
      description: 'Digital X-Rays, Ultrasound & MRI scans',
      estimatedTimePerUser: 15,
      historicalAvgDuration: 12.0,
      status: 'open',
      currentCounter: 302
    });

    // Banking Services
    const cashService = await Service.create({
      organizationId: bank._id,
      name: 'Cash Deposit & Withdrawal',
      prefix: 'CSH',
      description: 'In-person teller transactions, cash & check deposits',
      estimatedTimePerUser: 4,
      historicalAvgDuration: 3.8,
      status: 'open',
      currentCounter: 406
    });

    const loanService = await Service.create({
      organizationId: bank._id,
      name: 'Personal & Mortgage Loan Advisory',
      prefix: 'LON',
      description: 'Loan applications, mortgage guidance & credit consultation',
      estimatedTimePerUser: 15,
      historicalAvgDuration: 14.5,
      status: 'open',
      currentCounter: 504
    });

    // Govt Services
    const passportService = await Service.create({
      organizationId: govt._id,
      name: 'Passport & Identity Verification',
      prefix: 'PAS',
      description: 'Official passport applications, biometrics & national ID renewals',
      estimatedTimePerUser: 12,
      historicalAvgDuration: 11.0,
      status: 'open',
      currentCounter: 603
    });

    // Telecom Services
    const simService = await Service.create({
      organizationId: telecom._id,
      name: '5G SIM & Device Activation',
      prefix: 'SIM',
      description: 'New SIM activations, eSIM conversions & phone upgrades',
      estimatedTimePerUser: 6,
      historicalAvgDuration: 5.5,
      status: 'open',
      currentCounter: 704
    });

    // 4. Create Physical Counters
    const hospitalCounter1 = await Counter.create({
      organizationId: hospital._id,
      counterNumber: 1,
      name: 'Counter 1 - General Triage',
      assignedServices: [opdService._id],
      status: 'open',
      tokensServedCount: 14
    });

    const hospitalCounter2 = await Counter.create({
      organizationId: hospital._id,
      counterNumber: 2,
      name: 'Counter 2 - Express Diagnostics',
      assignedServices: [labService._id],
      status: 'open',
      tokensServedCount: 22
    });

    const bankCounter1 = await Counter.create({
      organizationId: bank._id,
      counterNumber: 1,
      name: 'Desk 1 - Express Teller',
      assignedServices: [cashService._id],
      status: 'open',
      tokensServedCount: 30
    });

    const bankCounter2 = await Counter.create({
      organizationId: bank._id,
      counterNumber: 2,
      name: 'Desk 2 - Financial Advisory',
      assignedServices: [loanService._id],
      status: 'open',
      tokensServedCount: 8
    });

    // 5. Seed Historical & Active Tokens for Analytics & Live Tracking
    const now = Date.now();

    // Completed Token 1
    await Token.create({
      serviceId: opdService._id,
      userId: alex._id,
      counterId: hospitalCounter1._id,
      counterName: hospitalCounter1.name,
      tokenNumber: 'OPD-101',
      sequenceNumber: 101,
      customerName: 'Alex Johnson',
      customerPhone: alex.phone,
      status: 'completed',
      calledAt: new Date(now - 45 * 60000),
      completedAt: new Date(now - 35 * 60000),
      actualWaitDurationMins: 12.0,
      actualServiceDurationMins: 10.0,
      predictedWaitTimeMins: 10.0,
      predictionConfidence: 0.92,
      createdAt: new Date(now - 57 * 60000)
    });

    // Completed Token 2
    await Token.create({
      serviceId: labService._id,
      userId: sarah._id,
      counterId: hospitalCounter2._id,
      counterName: hospitalCounter2.name,
      tokenNumber: 'LAB-201',
      sequenceNumber: 201,
      customerName: 'Sarah Connor',
      customerPhone: sarah.phone,
      status: 'completed',
      calledAt: new Date(now - 30 * 60000),
      completedAt: new Date(now - 25 * 60000),
      actualWaitDurationMins: 5.0,
      actualServiceDurationMins: 5.0,
      predictedWaitTimeMins: 5.0,
      predictionConfidence: 0.95,
      createdAt: new Date(now - 35 * 60000)
    });

    // Currently Called Active Token
    const calledToken = await Token.create({
      serviceId: opdService._id,
      userId: michael._id,
      counterId: hospitalCounter1._id,
      counterName: hospitalCounter1.name,
      tokenNumber: 'OPD-102',
      sequenceNumber: 102,
      customerName: 'Michael Scott',
      customerPhone: michael.phone,
      status: 'called',
      calledAt: new Date(now - 2 * 60000),
      actualWaitDurationMins: 8.0,
      predictedWaitTimeMins: 7.5,
      predictionConfidence: 0.89,
      createdAt: new Date(now - 10 * 60000)
    });

    // Update Counter with current token
    hospitalCounter1.currentServingToken = calledToken._id;
    hospitalCounter1.status = 'busy';
    await hospitalCounter1.save();

    // Waiting Token (Alex Johnson active token for demo tracking)
    await Token.create({
      serviceId: opdService._id,
      userId: alex._id,
      tokenNumber: 'OPD-103',
      sequenceNumber: 103,
      customerName: 'Alex Johnson',
      customerPhone: alex.phone,
      status: 'waiting',
      predictedWaitTimeMins: 8.5,
      predictionConfidence: 0.88,
      createdAt: new Date(now - 5 * 60000)
    });

    // Seed Initial Notifications
    await Notification.create({
      userId: alex._id,
      title: 'Token OPD-103 Confirmed',
      message: 'Your token #OPD-103 for OPD General Consultation is confirmed. Est wait time ~8.5 mins.',
      type: 'info'
    });

    await Notification.create({
      userId: alex._id,
      title: 'Get Ready! Almost Your Turn',
      message: 'Token #OPD-103: There is only 1 person ahead of you.',
      type: 'approaching'
    });

    console.log('Sample data seeded successfully across ALL categories!');
    console.log('--- SYSTEM CREATED CATEGORIES & DATA ---');
    console.log('• Healthcare (Hospital): OPD, Diagnostics Lab, Radiology');
    console.log('• Banking: Cash Teller, Loan Advisory');
    console.log('• Public Govt Services: Passport Verification');
    console.log('• Telecom: 5G SIM Activation');
    console.log('• Multiple Physical Counters & Live Token Telemetry');
    console.log('----------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();
