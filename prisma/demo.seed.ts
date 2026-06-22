import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#\s][^=]*)=(.*)$/)
      if (!match) continue
      const key = match[1].trim()
      let value = match[2].trim()
      // Strip surrounding quotes
      if (/^["'].*["']$/.test(value)) value = value.slice(1, -1)
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env not found — fall through; env vars may already be set in shell
  }
}

loadEnvFile()

console.log('DATABASE_URL:', process.env.DATABASE_URL)

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const demoEmail = 'demo@example.com'
  const demoPassword = 'demopassword'

  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail }
  })

  if (existingUser) {
    console.log('Demo user already exists')
    return
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(demoPassword, 10)

  // Create the user
  await prisma.user.create({
    data: {
      email: demoEmail,
      name: 'Demo User',
      password: hashedPassword,
      // Note: we are not setting emailVerified, phone, image, etc. They can be null.
    }
  })

  console.log('Demo user created')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })