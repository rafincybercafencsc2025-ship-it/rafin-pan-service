const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Please provide a password of at least 12 characters in quotes.');
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 12));
