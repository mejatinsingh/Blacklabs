import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema(
  {
    auth0Id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: String,
    avatarUrl: String,
    phoneNumber: String,
    city: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Profile = mongoose.model('Profile', ProfileSchema);

const fakeUsers = [
  {
    auth0Id: 'auth0|fake001',
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@example.com',
    bio: 'Full-stack developer from Delhi',
    phoneNumber: '+91-9876543210',
    city: 'Delhi',
    isActive: true,
  },
  {
    auth0Id: 'auth0|fake002',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@example.com',
    bio: 'UI/UX designer passionate about creating beautiful interfaces',
    phoneNumber: '+91-9876543211',
    city: 'Mumbai',
    isActive: true,
  },
  {
    auth0Id: 'auth0|fake003',
    firstName: 'Amit',
    lastName: 'Kumar',
    email: 'amit.kumar@example.com',
    bio: 'Backend engineer specializing in Node.js and Python',
    phoneNumber: '+91-9876543212',
    city: 'Bangalore',
    isActive: true,
  },
  {
    auth0Id: 'auth0|fake004',
    firstName: 'Sneha',
    lastName: 'Gupta',
    email: 'sneha.gupta@example.com',
    bio: 'Product manager with 5 years of experience',
    phoneNumber: '+91-9876543213',
    city: 'Hyderabad',
    isActive: false,
  },
  {
    auth0Id: 'auth0|fake005',
    firstName: 'Vikram',
    lastName: 'Singh',
    email: 'vikram.singh@example.com',
    bio: 'DevOps engineer and cloud architect',
    phoneNumber: '+91-9876543214',
    city: 'Pune',
    isActive: true,
  },
  {
    auth0Id: 'auth0|fake006',
    firstName: 'Ananya',
    lastName: 'Reddy',
    email: 'ananya.reddy@example.com',
    bio: 'Data scientist working on ML models',
    phoneNumber: '+91-9876543215',
    city: 'Chennai',
    isActive: true,
  },
  {
    auth0Id: 'auth0|fake007',
    firstName: 'Karan',
    lastName: 'Malhotra',
    email: 'karan.malhotra@example.com',
    bio: 'Mobile developer building React Native apps',
    phoneNumber: '+91-9876543216',
    city: 'Gurugram',
    isActive: true,
  },
  {
    auth0Id: 'auth0|fake008',
    firstName: 'Neha',
    lastName: 'Joshi',
    email: 'neha.joshi@example.com',
    bio: 'QA engineer focused on automated testing',
    phoneNumber: '+91-9876543217',
    city: 'Noida',
    isActive: false,
  },
  {
    auth0Id: 'auth0|fake009',
    firstName: 'Arjun',
    lastName: 'Nair',
    email: 'arjun.nair@example.com',
    bio: 'Cybersecurity analyst and ethical hacker',
    phoneNumber: '+91-9876543218',
    city: 'Kochi',
    isActive: true,
  },
  {
    auth0Id: 'auth0|fake010',
    firstName: 'Divya',
    lastName: 'Iyer',
    email: 'divya.iyer@example.com',
    bio: 'Frontend developer specializing in React and TypeScript',
    phoneNumber: '+91-9876543219',
    city: 'Jaipur',
    isActive: true,
  },
];

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/blacklabs');
  console.log('Connected to MongoDB');

  await Profile.deleteMany({});
  console.log('Cleared existing profiles');

  const result = await Profile.insertMany(fakeUsers);
  console.log(`Seeded ${result.length} fake users`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
