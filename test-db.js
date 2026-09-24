const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst();
  if (user) {
    console.log(user.email, user.password.substring(0, 30));
  } else {
    console.log("No users found");
  }
}
main().finally(() => prisma.$disconnect());
