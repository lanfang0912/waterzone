/**
 * 產生 bcrypt hash，填入 .env.local 的 ADMIN_PASSWORD_HASH
 *
 * 使用方式：
 *   node scripts/hash-password.mjs yourpassword
 */

import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("請提供密碼：node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\n✅ 複製以下內容到 .env.local：\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
