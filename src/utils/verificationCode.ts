/**
 * @desc 인증번호 발급
 */
const getRandomCode = async () => {
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += Math.floor(Math.random() * 10);
  }

  return randomCode;
};

export { getRandomCode };
