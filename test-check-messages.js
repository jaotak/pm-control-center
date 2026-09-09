const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const messages = await prisma.chatMessage.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  console.log(JSON.stringify(messages, null, 2))
}

main().finally(() => prisma.$disconnect())
