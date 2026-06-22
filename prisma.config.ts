import { defineConfig } from '@prisma/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Prisma 7 evaluates this file before loading .env, so we parse it manually
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#\s][^=]*)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      let value = match[2].trim();
      // Strip surrounding quotes
      if (/^["'].*["']$/.test(value)) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env not found — fall through; env vars may already be set in shell
  }
}

loadEnvFile();

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL
  },
  migrations: {
    url: process.env.DATABASE_URL as string,
  },
});
