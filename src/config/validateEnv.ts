export function validateEnv() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 오류: OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
    console.error('📝 backend/.env 파일을 확인해주세요.');
    process.exit(1);
  }
}
