interface PasswordDTO {
  encryptedPwd: string;
  iv: string;
  salt: string;
}

export { PasswordDTO };
