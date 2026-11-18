/**
 * Creates an Admin account from the command line. In production, sign-up through the site is closed
 * even before the first account exists, so this is how the owner's account is made:
 *
 *   docker compose -f docker-compose.prod.yml exec api node dist/create-admin you@example.com
 *
 * The password is asked for without echoing it, or read from ADMIN_PASSWORD when there's no terminal.
 */
import * as bcrypt from 'bcrypt';
import { isEmail } from 'class-validator';
import { createInterface } from 'readline';
import { DataSource } from 'typeorm';
import { AuditEvent } from './audit/audit-event.entity';
import { databaseConfig } from './config/database.config';
import { User } from './users/user.entity';

export const ADMIN_PASSWORD_MIN = 8;
/** bcrypt only uses the first 72 bytes, so longer passwords are refused rather than silently cut. */
export const ADMIN_PASSWORD_MAX_BYTES = 72;

/** What's wrong with the email and password, if anything. */
export function adminInputProblems(email: string | undefined, password: string): string[] {
  const problems: string[] = [];
  if (!email || !isEmail(email)) problems.push('Give a valid email address.');
  if (password.length < ADMIN_PASSWORD_MIN) problems.push(`The password must be at least ${ADMIN_PASSWORD_MIN} characters.`);
  if (Buffer.byteLength(password) > ADMIN_PASSWORD_MAX_BYTES) problems.push(`The password must be at most ${ADMIN_PASSWORD_MAX_BYTES} bytes.`);
  return problems;
}

/**
 * Asks for the password twice on the terminal without showing what's typed. One reader serves both
 * questions, so input typed or pasted ahead of the second question isn't lost.
 */
async function promptPassword(): Promise<[string, string]> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = rl as unknown as { _writeToOutput: (s: string) => void };
  const write = out._writeToOutput.bind(rl);
  let question = '';
  // Print the questions and line breaks, but swallow the echo of typed characters.
  out._writeToOutput = (s: string) => {
    if (s.startsWith(question) || s === '\r\n' || s === '\n') write(s);
  };
  const ask = (q: string) =>
    new Promise<string>((resolve) => {
      question = q;
      rl.question(q, resolve);
    });
  try {
    return [await ask('Password: '), await ask('Same password again: ')];
  } finally {
    rl.close();
  }
}

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (!process.stdin.isTTY) {
    throw new Error('No terminal to ask for the password. Run with a terminal, or set ADMIN_PASSWORD.');
  }
  const [password, again] = await promptPassword();
  if (password !== again) throw new Error('The passwords did not match.');
  return password;
}

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {
    /* no .env file: use the real environment */
  }

  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Usage: node dist/create-admin <email>');
  const password = await readPassword();
  const problems = adminInputProblems(email, password);
  if (problems.length) throw new Error(problems.join('\n'));

  const db = new DataSource(databaseConfig());
  await db.initialize();
  try {
    const users = db.getRepository(User);
    if (await users.exists({ where: { email } })) {
      throw new Error(`An account for ${email} already exists. Change its password in Admin → Account.`);
    }
    const user = await users.save(users.create({ email, passwordHash: await bcrypt.hash(password, 10) }));
    await db.getRepository(AuditEvent).save({ action: 'auth.register', userId: user.id, email, detail: { via: 'command line' } });
    console.log(`Created the Admin account for ${email}. Sign in at /admin.`);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  main().catch((err: Error) => {
    console.error(err.message);
    process.exit(1);
  });
}
