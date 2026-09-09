const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ take: 2 })
  if (users.length < 2) {
    console.log("Not enough users to test")
    return
  }
  
  try {
    const newRoom = await prisma.chatRoom.create({
        data: {
            type: "direct",
            members: {
                create: [
                    { userId: users[0].id },
                    { userId: users[1].id },
                ],
            },
        },
    });
    console.log("Success:", newRoom.id)
  } catch (e) {
    console.error("Error creating room:", e)
  }
}

main().finally(() => prisma.$disconnect())
