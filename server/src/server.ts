import { app } from "./app";
import { prisma } from "../config/db";
import { env } from "../config/env";

const server = app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);