const User = require('../models/User');

/**
 * Creates the first admin account from environment variables if it does not exist yet.
 */
module.exports = async function ensureAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({
    name: ADMIN_NAME || 'UniFind Admin',
    email,
    password: ADMIN_PASSWORD,
    role: 'admin',
  });
  console.log(`Admin account created: ${email}`);
};
