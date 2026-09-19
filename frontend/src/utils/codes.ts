const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generate a random 6-character join code (no ambiguous chars). */
export function generateJoinCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  }
  return code;
}

const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generate a random 12-character public token for QR codes. */
export function generatePublicToken(length = 12): string {
  let t = "";
  for (let i = 0; i < length; i++) {
    t += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)];
  }
  return t;
}
