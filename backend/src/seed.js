/**
 * Seed script
 *   npm run seed        -> creates the admin account only
 *   npm run seed:demo   -> also creates demo students and sample reports
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const ensureAdmin = require('./utils/ensureAdmin');
const User = require('./models/User');
const Item = require('./models/Item');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function run() {
  await connectDB(3, 2000);
  await ensureAdmin();

  if (process.argv.includes('--demo')) {
    const students = [
      { name: 'Nimali Perera', email: 'nimali@student.lk', studentId: 'EG/2023/5001' },
      { name: 'Kasun Silva', email: 'kasun@student.lk', studentId: 'EG/2023/5002' },
    ];

    const users = [];
    for (const s of students) {
      let user = await User.findOne({ email: s.email });
      if (!user) user = await User.create({ ...s, password: 'Student@123' });
      users.push(user);
    }

    if ((await Item.countDocuments({ reporter: { $in: users.map((u) => u._id) } })) === 0) {
      await Item.create([
        { type: 'lost', title: 'Black Casio calculator', description: 'fx-991EX with my initials scratched on the back.', category: 'Electronics', location: 'Engineering Faculty, Lecture Hall 3', dateOccurred: daysAgo(3), reporter: users[0]._id },
        { type: 'found', title: 'Blue water bottle', description: 'Steel bottle with a sticker of a mountain. Left on a bench.', category: 'Other', location: 'Main library, ground floor', dateOccurred: daysAgo(2), reporter: users[1]._id },
        { type: 'found', title: 'Student ID card', description: 'Faculty of Engineering ID card. Name starts with an S.', category: 'ID & Cards', location: 'Canteen entrance', dateOccurred: daysAgo(1), reporter: users[1]._id },
        { type: 'lost', title: 'House keys with red tag', description: 'Three keys on a ring with a red fabric tag.', category: 'Keys', location: 'Sports complex', dateOccurred: daysAgo(5), reporter: users[0]._id },
        { type: 'found', title: 'Grey hoodie', description: 'Size M, left in the computer lab after the evening session.', category: 'Clothing & Bags', location: 'Computer lab 2', dateOccurred: daysAgo(4), reporter: users[0]._id },
      ]);
    }
    console.log('Demo data ready (students use password Student@123)');
  }

  await mongoose.connection.close();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
