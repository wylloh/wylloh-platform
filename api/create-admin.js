const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// User Schema (simplified for script)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, unique: true, sparse: true },
  roles: { type: [String], default: ['user'] },
  isVerified: { type: Boolean, default: false },
  proStatus: { type: String, enum: ['none', 'pending', 'verified', 'rejected'] }
}, { timestamps: true });

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wylloh');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@wylloh.com' },
        { username: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.username);
      
      // Update to ensure admin role
      if (!existingAdmin.roles.includes('admin')) {
        existingAdmin.roles.push('admin');
        await existingAdmin.save();
        console.log('✅ Updated existing user with admin role');
      }
      
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@wylloh.com',
      password: 'WyllohAdmin2024!',
      roles: ['user', 'admin'],
      isVerified: true,
      proStatus: 'verified'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@wylloh.com');
    console.log('🔑 Password: WyllohAdmin2024!');
    console.log('👤 Username: admin');
    console.log('🛡️  Roles: user, admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the script
createAdmin(); 