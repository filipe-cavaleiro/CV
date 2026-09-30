// Gera o valor para ADMIN_PASSWORD_HASH (scrypt + salt aleatório). Usa ":" como separador
// porque o Next expande "$" em ficheiros .env.
// Uso: npm run hash-password -- "a-tua-password"
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Uso: npm run hash-password -- "password-com-pelo-menos-10-caracteres"');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
console.log(`scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`);
