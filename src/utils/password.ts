import { PasswordDTO } from '@interfaces/common/passwordInfo';
import CryptoJS from 'crypto-js';

/**
 *
 * @param pwd
 * @param originSalt
 * @param originIv
 * @desc 패스워드 암호화
 * @returns {PasswordDTO}
 */
const pwdEncrpyt = (pwd: string, originSalt?: string, originIv?: string) => {
  const salt = originSalt || CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
  const iv = originIv || CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);

  const iterations = 10000;

  const key512Bits1000Iterations = CryptoJS.PBKDF2('12341234', CryptoJS.enc.Hex.parse(salt), {
    keySize: 512 / 32,
    iterations
  });

  const encrypted = CryptoJS.AES.encrypt(pwd, key512Bits1000Iterations, {
    iv: CryptoJS.enc.Hex.parse(iv)
  });

  return {
    encryptedPwd: encrypted.toString(),
    salt,
    iv
  };
};

/**
 *
 * @param inputPwd
 * @param savedPwd
 * @desc 패스워드 확인
 * @returns {boolean}
 */
const checkIdPwdVaild = (inputPwd: string, savedPwd: PasswordDTO) => {
  const { iv, salt, encryptedPwd } = savedPwd;
  const { encryptedPwd: inputEncryptedPwd } = pwdEncrpyt(inputPwd, salt, iv);

  if (encryptedPwd !== inputEncryptedPwd) {
    return false;
  }

  return true;
};

export { pwdEncrpyt };
