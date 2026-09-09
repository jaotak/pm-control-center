const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const room = await prisma.chatRoom.findFirst()
  const user = await prisma.user.findFirst()
  if (!room || !user) return console.log("Missing data")

  try {
    const message = await prisma.chatMessage.create({
        data: {
            chatRoomId: room.id,
            senderId: user.id,
            body: "test",
            attachmentUrl: "/test.png",
            attachmentName: "test.png",
            attachmentType: "image/png",
            attachmentSize: 1234,
        }
    })
    console.log("Success:", message.id)
  } catch (e) {
    console.error("Error:", e.message)
  }
}

main().finally(() => prisma.$disconnect())
