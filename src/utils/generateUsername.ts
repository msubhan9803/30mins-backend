import escapeStringRegexp from 'escape-string-regexp';
import User from '../MongoModels/User';

export default async function generateUsername(name: String, num: number) {
  const generatedUsername = `${name.replace(/\s/g, '')}${num}`;

  const safeUsername = escapeStringRegexp(generatedUsername);
  const pattern = `^${safeUsername}$`;
  const regex = new RegExp(pattern, 'i');

  const existingUsername = await User.exists({'accountDetails.username': {$regex: regex}});

  if (existingUsername) {
    generateUsername(name, num + 1);
  } else {
    return generatedUsername;
  }
}
