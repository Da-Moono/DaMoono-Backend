export interface CardData {
  title: string;
  price?: string;
  originalPrice?: string;
  discountPrice?: string;
  mainFeature?: string;
  details: Array<{ label: string; value: string }>;
}

export interface ReferenceData {
  plans: CardData[];
  subscriptions: CardData[];
  phones: CardData[];
  events: CardData[];
}

export const planData: CardData[] = [
  {
    title: '5G 슈퍼플랜',
    price: '월 95,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '5Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '200건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM' },
    ],
  },
  {
    title: '5G 스탠다드',
    price: '월 75,000원',
    mainFeature: '100GB',
    details: [
      { label: '데이터/쉐어링', value: '100GB' },
      { label: '속도제한', value: '3Mbps' },
      { label: '음성통화', value: '1000분' },
      { label: '문자메시지', value: '100건' },
      { label: '구독서비스', value: 'DISNEY+' },
    ],
  },
  {
    title: 'LTE 베이직',
    price: '월 45,000원',
    mainFeature: '50GB',
    details: [
      { label: '데이터/쉐어링', value: '50GB' },
      { label: '속도제한', value: '1Mbps' },
      { label: '음성통화', value: '500분' },
      { label: '문자메시지', value: '50건' },
      { label: '구독서비스', value: 'WAVVE, TVING' },
    ],
  },
  {
    title: '5G 프리미엄',
    price: '월 120,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '10Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '300건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM, DISNEY+' },
    ],
  },
  {
    title: 'LTE 라이트',
    price: '월 35,000원',
    mainFeature: '30GB',
    details: [
      { label: '데이터/쉐어링', value: '30GB' },
      { label: '속도제한', value: '0.5Mbps' },
      { label: '음성통화', value: '300분' },
      { label: '문자메시지', value: '30건' },
    ],
  },
  {
    title: '5G 미디엄',
    price: '월 65,000원',
    mainFeature: '80GB',
    details: [
      { label: '데이터/쉐어링', value: '80GB' },
      { label: '속도제한', value: '2Mbps' },
      { label: '음성통화', value: '800분' },
      { label: '문자메시지', value: '80건' },
      { label: '구독서비스', value: 'MILLIE' },
    ],
  },
  {
    title: 'LTE 스탠다드',
    price: '월 55,000원',
    mainFeature: '60GB',
    details: [
      { label: '데이터/쉐어링', value: '60GB' },
      { label: '속도제한', value: '1.5Mbps' },
      { label: '음성통화', value: '600분' },
      { label: '문자메시지', value: '60건' },
      { label: '구독서비스', value: 'TVING' },
    ],
  },
  {
    title: '5G 울트라',
    price: '월 150,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '15Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '500건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM, DISNEY+, WAVVE, TVING' },
    ],
  },
  {
    title: '5G 스마트',
    price: '월 85,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '4Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '150건' },
      { label: '구독서비스', value: 'YOUTUBE_PREMIUM, WAVVE' },
      { label: '뱃지', value: '인기' },
    ],
  },
  {
    title: 'LTE 프리미엄',
    price: '월 60,000원',
    mainFeature: '70GB',
    details: [
      { label: '데이터/쉐어링', value: '70GB' },
      { label: '속도제한', value: '1.2Mbps' },
      { label: '음성통화', value: '700분' },
      { label: '문자메시지', value: '70건' },
      { label: '구독서비스', value: 'TVING' },
    ],
  },
  {
    title: '5G 스타터',
    price: '월 55,000원',
    mainFeature: '40GB',
    details: [
      { label: '데이터/쉐어링', value: '40GB' },
      { label: '속도제한', value: '1.5Mbps' },
      { label: '음성통화', value: '400분' },
      { label: '문자메시지', value: '40건' },
      { label: '뱃지', value: '신규' },
    ],
  },
  {
    title: 'LTE 플러스',
    price: '월 50,000원',
    mainFeature: '55GB',
    details: [
      { label: '데이터/쉐어링', value: '55GB' },
      { label: '속도제한', value: '1Mbps' },
      { label: '음성통화', value: '550분' },
      { label: '문자메시지', value: '55건' },
      { label: '구독서비스', value: 'WAVVE' },
    ],
  },
  {
    title: '5G 엔터테인먼트',
    price: '월 110,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '8Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '400건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM, DISNEY+, TVING' },
      { label: '뱃지', value: '추천' },
    ],
  },
  {
    title: 'LTE 이코노미',
    price: '월 30,000원',
    mainFeature: '25GB',
    details: [
      { label: '데이터/쉐어링', value: '25GB' },
      { label: '속도제한', value: '0.3Mbps' },
      { label: '음성통화', value: '250분' },
      { label: '문자메시지', value: '25건' },
      { label: '뱃지', value: '저렴' },
    ],
  },
  {
    title: '5G 비즈니스',
    price: '월 130,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '12Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '600건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM, DISNEY+, WAVVE, TVING, MILLIE' },
      { label: '뱃지', value: '프리미엄' },
    ],
  },
  {
    title: 'LTE 미디엄',
    price: '월 48,000원',
    mainFeature: '45GB',
    details: [
      { label: '데이터/쉐어링', value: '45GB' },
      { label: '속도제한', value: '0.8Mbps' },
      { label: '음성통화', value: '450분' },
      { label: '문자메시지', value: '45건' },
    ],
  },
  {
    title: '5G 게이밍',
    price: '월 100,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '7Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '350건' },
      { label: '구독서비스', value: 'YOUTUBE_PREMIUM' },
      { label: '뱃지', value: '특화' },
    ],
  },
  {
    title: 'LTE 스마트',
    price: '월 42,000원',
    mainFeature: '40GB',
    details: [
      { label: '데이터/쉐어링', value: '40GB' },
      { label: '속도제한', value: '0.7Mbps' },
      { label: '음성통화', value: '400분' },
      { label: '문자메시지', value: '40건' },
      { label: '구독서비스', value: 'WAVVE' },
    ],
  },
  {
    title: '5G 패밀리',
    price: '월 140,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '9Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '450건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM, DISNEY+, WAVVE' },
      { label: '뱃지', value: '가족' },
    ],
  },
  {
    title: 'LTE 베이직 플러스',
    price: '월 38,000원',
    mainFeature: '35GB',
    details: [
      { label: '데이터/쉐어링', value: '35GB' },
      { label: '속도제한', value: '0.5Mbps' },
      { label: '음성통화', value: '350분' },
      { label: '문자메시지', value: '35건' },
    ],
  },
  {
    title: '5G 프로',
    price: '월 125,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '11Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '550건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM, DISNEY+, TVING' },
      { label: '뱃지', value: '프로' },
    ],
  },
  {
    title: 'LTE 컴팩트',
    price: '월 32,000원',
    mainFeature: '28GB',
    details: [
      { label: '데이터/쉐어링', value: '28GB' },
      { label: '속도제한', value: '0.4Mbps' },
      { label: '음성통화', value: '280분' },
      { label: '문자메시지', value: '28건' },
      { label: '뱃지', value: '경제' },
    ],
  },
  {
    title: '5G 엔터프라이즈',
    price: '월 160,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '20Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '1000건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM, DISNEY+, WAVVE, TVING, MILLIE' },
      { label: '뱃지', value: '최고급' },
    ],
  },
  {
    title: 'LTE 프리미엄 플러스',
    price: '월 65,000원',
    mainFeature: '80GB',
    details: [
      { label: '데이터/쉐어링', value: '80GB' },
      { label: '속도제한', value: '2Mbps' },
      { label: '음성통화', value: '800분' },
      { label: '문자메시지', value: '80건' },
      { label: '구독서비스', value: 'TVING, WAVVE' },
    ],
  },
  {
    title: '5G 스트리밍',
    price: '월 90,000원',
    mainFeature: '무제한',
    details: [
      { label: '데이터/쉐어링', value: '무제한' },
      { label: '속도제한', value: '6Mbps' },
      { label: '음성통화', value: '무제한' },
      { label: '문자메시지', value: '300건' },
      { label: '구독서비스', value: 'NETFLIX, YOUTUBE_PREMIUM, DISNEY+' },
      { label: '뱃지', value: '스트리밍' },
    ],
  },
  {
    title: 'LTE 스탠다드 플러스',
    price: '월 58,000원',
    mainFeature: '65GB',
    details: [
      { label: '데이터/쉐어링', value: '65GB' },
      { label: '속도제한', value: '1.8Mbps' },
      { label: '음성통화', value: '650분' },
      { label: '문자메시지', value: '65건' },
      { label: '구독서비스', value: 'TVING' },
    ],
  },
  {
    title: '5G 라이트',
    price: '월 60,000원',
    mainFeature: '50GB',
    details: [
      { label: '데이터/쉐어링', value: '50GB' },
      { label: '속도제한', value: '2.5Mbps' },
      { label: '음성통화', value: '500분' },
      { label: '문자메시지', value: '50건' },
      { label: '구독서비스', value: 'YOUTUBE_PREMIUM' },
      { label: '뱃지', value: '신규' },
    ],
  },
  {
    title: 'LTE 이코노미 플러스',
    price: '월 40,000원',
    mainFeature: '38GB',
    details: [
      { label: '데이터/쉐어링', value: '38GB' },
      { label: '속도제한', value: '0.6Mbps' },
      { label: '음성통화', value: '380분' },
      { label: '문자메시지', value: '38건' },
      { label: '뱃지', value: '저렴' },
    ],
  },
];

export const subscriptionData: CardData[] = [
  {
    title: '넷플릭스 프리미엄',
    price: '월 17,000원',
    details: [
      { label: '화질', value: '4K' },
      { label: '동시 시청', value: '4명' },
      { label: '광고', value: '없음' },
      { label: '혜택', value: '최고 화질의 영화와 드라마를 광고 없이 시청' },
      { label: '뱃지', value: '인기, 추천' },
    ],
  },
  {
    title: '유튜브 프리미엄',
    price: '월 13,900원',
    details: [
      { label: '광고', value: '없음' },
      { label: '백그라운드 재생', value: '지원' },
      { label: '오프라인 저장', value: '지원' },
      { label: '혜택', value: '유튜브를 광고 없이, 백그라운드에서도 즐기세요' },
      { label: '뱃지', value: '인기' },
    ],
  },
  {
    title: '디즈니+',
    price: '월 9,900원',
    details: [
      { label: '화질', value: '4K' },
      { label: '다운로드', value: '지원' },
      { label: '혜택', value: '디즈니, 마블, 스타워즈를 한 곳에서' },
    ],
  },
  {
    title: '스포티파이',
    price: '월 10,900원',
    details: [
      { label: '광고', value: '없음' },
      { label: '오프라인 재생', value: '지원' },
      { label: '음질', value: '고음질' },
      { label: '혜택', value: '전 세계 음악을 광고 없이' },
      { label: '뱃지', value: '인기' },
    ],
  },
  {
    title: '밀리의 서재',
    price: '월 9,900원',
    details: [
      { label: '독서', value: '무제한' },
      { label: '오디오북', value: '지원' },
      { label: '혜택', value: '책 한 달에 10권 이상 읽는 사람들을 위한' },
    ],
  },
  {
    title: '뉴스스탠드',
    price: '월 4,900원',
    details: [
      { label: '뉴스', value: '다양한 뉴스' },
      { label: '오프라인 읽기', value: '지원' },
      { label: '요약 기능', value: '지원' },
      { label: '혜택', value: '세상의 모든 뉴스를 한 곳에서' },
    ],
  },
  {
    title: '쿠팡플레이',
    price: '월 4,990원',
    details: [
      { label: '시청', value: '무제한' },
      { label: '혜택', value: '쿠팡 와우 회원을 위한 스트리밍 서비스' },
      { label: '뱃지', value: '특가' },
    ],
  },
  {
    title: '애플 뮤직',
    price: '월 11,000원',
    details: [
      { label: '광고', value: '없음' },
      { label: '공간 음향', value: '지원' },
      { label: '라이브 라디오', value: '지원' },
      { label: '혜택', value: 'Apple 기기와 완벽하게 연동되는 음악 서비스' },
    ],
  },
  {
    title: '유튜브 프리미엄 + 추가혜택(택1)',
    price: '월 13,900원',
    details: [
      { label: '유튜브 프리미엄', value: '포함' },
      { label: '추가 라이프 혜택', value: '선택 가능' },
      { label: '뱃지', value: 'BEST' },
    ],
  },
  {
    title: '더블 스트리밍 연간권',
    price: '월 18,900원',
    originalPrice: '연 226,800원',
    details: [
      { label: '넷플릭스', value: '포함' },
      { label: '유튜브 프리미엄', value: '포함' },
      { label: '혜택', value: '국내 유일 월 18,900원!' },
      { label: '뱃지', value: '특가' },
    ],
  },
  {
    title: '티빙 월정액 이용권',
    price: '월 4,950원',
    details: [
      { label: '티빙 오리지널', value: '포함' },
      { label: '방송/영화/해외시리즈', value: '포함' },
      { label: '뱃지', value: '할인' },
    ],
  },
  {
    title: '유튜브 프리미엄 + 이모티콘플러스 구독팩',
    price: '월 14,900원',
    details: [
      { label: '유튜브 프리미엄', value: '포함' },
      { label: '카카오 이모티콘', value: '무제한' },
    ],
  },
  {
    title: '넷플릭스 월정액',
    price: '월 7,000원',
    details: [
      { label: '시청', value: '무제한' },
      { label: '혜택', value: '영화와 시리즈를 무제한으로 즐겨보세요!' },
      { label: '뱃지', value: '할인' },
    ],
  },
  {
    title: '디즈니 + 추가혜택(택1)',
    price: '월 9,900원',
    details: [
      { label: '디즈니+', value: '포함' },
      { label: '추가 라이프 혜택', value: '선택 가능' },
      { label: '뱃지', value: 'U+ 모바일 전용' },
    ],
  },
  {
    title: '디즈니+월정액 이용권',
    price: '월 9,405원',
    details: [
      { label: '스트리밍', value: '지원' },
      { label: '혜택', value: '내가 좋아하는 이야기가 모두 여기에!' },
      { label: '뱃지', value: '할인' },
    ],
  },
  {
    title: '유튜브 프리미엄 + 배달의민족 구독팩',
    price: '월 17,900원',
    details: [
      { label: '유튜브 프리미엄', value: '포함' },
      { label: '배달의민족 5,000원 교환권', value: '매월 제공' },
    ],
  },
  {
    title: '지니뮤직 마음껏듣기 월정액',
    price: '월 7,900원',
    details: [
      { label: '무제한 스트리밍', value: '지원' },
      { label: '데이터', value: '무료' },
      { label: '혜택', value: '데이터 걱정없는 무제한 나만의 음악 요정 지니' },
      { label: '뱃지', value: 'U+ 모바일 전용' },
    ],
  },
  {
    title: '지니뮤직 + 추가혜택(택1)',
    price: '월 8,400원',
    details: [
      { label: '지니뮤직', value: '포함' },
      { label: '추가 라이프 혜택', value: '선택 가능' },
      { label: '뱃지', value: 'U+ 모바일 전용' },
    ],
  },
  {
    title: '유튜브 프리미엄 + 스타벅스 구독팩',
    price: '월 17,900원',
    details: [
      { label: '유튜브 프리미엄', value: '포함' },
      { label: '스타벅스 5,000원 모바일카드', value: '매월 제공' },
    ],
  },
  {
    title: '유튜브 프리미엄 + CGV 구독팩',
    price: '월 15,900원',
    details: [
      { label: '유튜브 프리미엄', value: '포함' },
      { label: 'CGV 영화 1+1', value: '지원' },
      { label: '혜택', value: '유튜브는 광고없이 프리미엄 영화는 1+1 스마트하게!' },
      { label: '뱃지', value: 'U+ 모바일 전용' },
    ],
  },
];

export const phoneData: CardData[] = [
  {
    title: 'iPhone 15 Pro Max',
    price: '1,550,000원',
    details: [
      { label: '용량', value: '256GB' },
      { label: '디자인', value: '티타늄' },
      { label: '칩셋', value: 'A17 Pro' },
    ],
  },
  {
    title: 'Galaxy S24 Ultra',
    price: '1,698,400원',
    details: [
      { label: '용량', value: '512GB' },
      { label: '특징', value: 'S펜 내장' },
      { label: 'AI', value: 'Galaxy AI' },
    ],
  },
  {
    title: 'iPhone 15',
    price: '1,250,000원',
    details: [
      { label: '용량', value: '128GB' },
      { label: '디스플레이', value: '6.1인치' },
      { label: '칩셋', value: 'A16 Bionic' },
    ],
  },
  {
    title: 'Galaxy S24',
    price: '1,155,000원',
    details: [
      { label: '용량', value: '256GB' },
      { label: '디스플레이', value: '6.2인치' },
      { label: 'AI', value: 'Galaxy AI' },
    ],
  },
];

export const eventData: CardData[] = [
  {
    title: '신규가입 웰컴 혜택',
    price: '최대 30만원',
    details: [
      { label: '요금 할인', value: '3개월' },
      { label: '사은품', value: '무선이어폰' },
      { label: '데이터', value: '+10GB' },
    ],
  },
  {
    title: '가족 결합 할인',
    price: '최대 50만원',
    details: [
      { label: '할인', value: '월 2만원' },
      { label: '기간', value: '24개월' },
      { label: '대상', value: '2인 이상' },
    ],
  },
];

// Structured reference data for backend consumption
export const referenceData: ReferenceData = {
  plans: planData,
  subscriptions: subscriptionData,
  phones: phoneData,
  events: eventData,
};

/**
 * Serializes reference data into a text format suitable for LangChain prompts.
 * This function converts the structured data into a human-readable format that
 * can be included in AI prompts for context-aware recommendations.
 *
 * @param category - Optional category to serialize ('plan', 'subscription', 'phone', 'event')
 *                   If not provided, all categories will be serialized
 * @returns A formatted string representation of the reference data
 */
export function getReferenceDataAsText(
  category?: 'plan' | 'subscription' | 'phone' | 'event',
): string {
  const formatCardData = (card: CardData): string => {
    const lines: string[] = [`- ${card.title}`];

    if (card.price) {
      lines.push(`  가격: ${card.price}`);
    }
    if (card.originalPrice) {
      lines.push(`  정가: ${card.originalPrice}`);
    }
    if (card.discountPrice) {
      lines.push(`  할인가: ${card.discountPrice}`);
    }
    if (card.mainFeature) {
      lines.push(`  데이터: ${card.mainFeature}`);
    }

    if (card.details && card.details.length > 0) {
      lines.push('  상세 정보:');
      card.details.forEach((detail) => {
        lines.push(`    - ${detail.label}: ${detail.value}`);
      });
    }

    return lines.join('\n');
  };

  const sections: string[] = [];

  if (!category || category === 'plan') {
    sections.push('## 요금제 (Plans)\n');
    sections.push(planData.map(formatCardData).join('\n\n'));
  }

  if (!category || category === 'subscription') {
    sections.push('\n## 구독 서비스 (Subscriptions)\n');
    sections.push(subscriptionData.map(formatCardData).join('\n\n'));
  }

  if (!category || category === 'phone') {
    sections.push('\n## 휴대폰 (Phones)\n');
    sections.push(phoneData.map(formatCardData).join('\n\n'));
  }

  if (!category || category === 'event') {
    sections.push('\n## 이벤트 (Events)\n');
    sections.push(eventData.map(formatCardData).join('\n\n'));
  }

  return sections.join('\n');
}
