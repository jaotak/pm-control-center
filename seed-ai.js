const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("ai_secret_1234", 10)
  
  // Create or update the AI user
  const aiUser = await prisma.user.upsert({
    where: { email: "ai@control.center" },
    update: {},
    create: {
      name: "AI Assistant",
      email: "ai@control.center",
      password: hashedPassword,
      role: "AI",
      isActive: true,
      isApproved: true,
      department: "System",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=ai"
    }
  })
  
  console.log("AI User created or already exists:", aiUser.email, "ID:", aiUser.id)
}

main().finally(() => prisma.$disconnect())
