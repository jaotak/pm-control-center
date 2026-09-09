const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("admin1234", 10)
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@control.center",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      isApproved: true,
      department: "Management"
    }
  })
  console.log("Admin created:", admin.email)
}

main().finally(() => prisma.$disconnect())
