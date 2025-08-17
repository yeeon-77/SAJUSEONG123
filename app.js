// API 키를 여기에 입력하세요
const OPENAI_API_KEY = 'your-openai-api-key-here';

const form = document.getElementById('sajuForm');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const errorMessage = document.getElementById('errorMessage');
const analyzeBtn = document.getElementById('analyzeBtn');
const timeUnknownCheckbox = document.getElementById('timeUnknown');
const timeSelect = document.getElementById('timeSelect');
const partnerTimeUnknownCheckbox = document.getElementById('partnerTimeUnknown');
const partnerTimeSelect = document.getElementById('partnerTimeSelect');
const dayInput = document.getElementById('day');
const monthSelect = document.getElementById('month');

const heavenlyStems = ['갑','을','병','정','무','기','경','신','임','계'];
const earthlyBranches = ['자','축','인','묘','진','사','오','미','신','유','술','해'];

// 로컬 스토리지에서 사용자 정보 불러오기
function loadUserInfo() {
  const savedUser = localStorage.getItem('sajuUser');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    document.getElementById('name').value = user.name || '';
    document.getElementById('gender').value = user.gender || '';
    document.getElementById('year').value = user.year || '';
    document.getElementById('month').value = user.month || '';
    document.getElementById('day').value = user.day || '';
    if (user.hour) {
      document.getElementById('hour').value = user.hour;
    } else {
      timeUnknownCheckbox.checked = true;
      timeSelect.style.display = 'none';
    }
    
    // 저장된 정보가 있으면 다른 탭들 활성화
    updateTabsBasedOnUserInfo(user);
  }
}

// 사용자 정보에 따라 탭 상태 업데이트
function updateTabsBasedOnUserInfo(user) {
  if (user && user.name && user.gender && user.year && user.month && user.day) {
    // 연애운 탭 활성화
    const loveFortuneNotice = document.getElementById('loveFortuneNotice');
    if (loveFortuneNotice) {
      loveFortuneNotice.innerHTML = `<p>💖 ${user.name}님의 연애운을 확인해보세요!</p>`;
    }
    
    // 궁합 탭 활성화
    const compatibilityNotice = document.getElementById('compatibilityNotice');
    if (compatibilityNotice) {
      compatibilityNotice.innerHTML = `<p>💕 ${user.name}님의 궁합을 분석해보세요!</p>`;
    }
    
    // 프리미엄 탭 활성화
    const premiumNotice = document.getElementById('premiumNotice');
    if (premiumNotice) {
      premiumNotice.innerHTML = `<p>✨ ${user.name}님을 위한 프리미엄 연애 분석!</p>`;
    }
    
    // 연애운 분석 버튼들 표시
    document.getElementById('dailyAnalyzeBtn').style.display = 'block';
    document.getElementById('monthlyAnalyzeBtn').style.display = 'block';
    document.getElementById('yearlyAnalyzeBtn').style.display = 'block';
    
    // 프리미엄 분석 버튼들 표시 (결제 후에만)
    if (localStorage.getItem('premiumPaid') === 'true') {
      document.getElementById('futureAnalyzeBtn').style.display = 'block';
      document.getElementById('thinkingAnalyzeBtn').style.display = 'block';
      document.getElementById('marriageAnalyzeBtn').style.display = 'block';
      document.getElementById('strategyAnalyzeBtn').style.display = 'block';
      document.getElementById('soulmateAnalyzeBtn').style.display = 'block';
      document.getElementById('timingAnalyzeBtn').style.display = 'block';
    }
    
    // 마음 읽기 버튼들 활성화
    document.querySelectorAll('.mind-btn').forEach(btn => {
      btn.disabled = false;
    });
  }
}

// 사용자 정보 저장
function saveUserInfo(name, gender, year, month, day, hour) {
  const userInfo = { name, gender, year, month, day, hour };
  localStorage.setItem('sajuUser', JSON.stringify(userInfo));
  updateTabsBasedOnUserInfo(userInfo);
}

// 태어난 시간 모름 체크박스 이벤트
timeUnknownCheckbox.addEventListener('change', function() {
  if (this.checked) {
    timeSelect.style.display = 'none';
    document.getElementById('hour').value = '';
  } else {
    timeSelect.style.display = 'block';
  }
});

partnerTimeUnknownCheckbox.addEventListener('change', function() {
  if (this.checked) {
    partnerTimeSelect.style.display = 'none';
    document.getElementById('partnerHour').value = '';
  } else {
    partnerTimeSelect.style.display = 'block';
  }
});

// 월별 일수 제한
monthSelect.addEventListener('change', updateDayLimit);
function updateDayLimit() {
  const month = parseInt(monthSelect.value);
  const year = parseInt(document.getElementById('year').value);
  
  if (month) {
    let maxDay = 31;
    if ([4, 6, 9, 11].includes(month)) {
      maxDay = 30;
    } else if (month === 2) {
      maxDay = isLeapYear(year) ? 29 : 28;
    }
    dayInput.max = maxDay;
    
    if (parseInt(dayInput.value) > maxDay) {
      dayInput.value = maxDay;
    }
  }
}

function isLeapYear(year) {
  return year && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
}

function mod(n, m){ 
  return ((n % m) + m) % m; 
}

function calculateSaju(year, month, day, hour = null){
  const yearStem = heavenlyStems[mod(year - 4, 10)];
  const yearBranch = earthlyBranches[mod(year - 4, 12)];
  const monthStem = heavenlyStems[mod(month - 1, 10)];
  const monthBranch = earthlyBranches[mod(month - 1, 12)];
  const dayStem = heavenlyStems[mod(day, 10)];
  const dayBranch = earthlyBranches[mod(day, 12)];

  let timeStem = '-';
  let timeBranch = '-';
  
  if (hour !== null) {
    const hourIndex = Math.floor(mod(hour + 1, 24) / 2);
    timeBranch = earthlyBranches[hourIndex];
    timeStem = heavenlyStems[hourIndex % 10];
  }

  return { 
    year: yearStem + yearBranch, 
    month: monthStem + monthBranch, 
    day: dayStem + dayBranch, 
    time: hour !== null ? timeStem + timeBranch : '시간미상'
  };
}

async function callOpenAI(prompt, systemMessage = '당신은 전문적인 사주 분석가입니다.') {
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      } else {
        throw new Error('API 호출 실패');
      }
    } catch (error) {
      console.error('OpenAI API 오류:', error);
      return null;
    }
  }
  return null;
}

// 내사주 분석
async function analyzeBasicPersonality(name, gender, saju) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const prompt = `${name}님(${genderText})의 기본 성격을 사주로 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

다음 항목으로 분석해주세요:
1. 기본 성격과 기질
2. 장점과 강점
3. 단점과 주의할 점
4. 대인관계 스타일
5. 성격 개선 방향`;

  const result = await callOpenAI(prompt, '당신은 전문적인 사주 성격 분석가입니다.');
  
  return result || `🌟 **${name}님의 기본 성격 분석**

**💫 기본 성격과 기질**
${saju.day}일주를 가진 ${name}님은 따뜻하고 배려심이 많은 성격입니다. 감정이 풍부하고 직관력이 뛰어나며, 주변 사람들에게 안정감을 주는 타입입니다.

**✨ 장점과 강점**
- 뛰어난 공감 능력과 소통 실력
- 책임감이 강하고 신뢰할 수 있는 성격
- 창의적이고 예술적 감각이 뛰어남
- 어려운 상황에서도 긍정적 마인드 유지

**⚠️ 단점과 주의할 점**
- 때로는 너무 감정적으로 판단하는 경향
- 완벽주의 성향으로 스트레스를 받기 쉬움
- 타인의 시선을 지나치게 의식하는 면

**👥 대인관계 스타일**
진실하고 따뜻한 관계를 선호하며, 깊이 있는 우정을 중시합니다. 리더십보다는 조화로운 분위기 조성에 탁월합니다.

**🎯 성격 개선 방향**
자신의 감정을 객관적으로 바라보는 연습과 함께, 때로는 과감한 결단력을 기르는 것이 도움이 될 것입니다.`;
}

async function analyzeCareer(name, gender, saju) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const prompt = `${name}님(${genderText})의 직업운을 사주로 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

다음 항목으로 분석해주세요:
1. 적성에 맞는 직업 분야
2. 직장에서의 성공 가능성
3. 창업 vs 직장생활 적합성
4. 승진 및 발전 시기
5. 직업 성공을 위한 조언`;

  const result = await callOpenAI(prompt, '당신은 전문적인 직업운 분석가입니다.');
  
  return result || `💼 **${name}님의 직업운 분석**

**🎯 적성에 맞는 직업 분야**
창의성과 소통 능력을 활용할 수 있는 분야가 적합합니다. 교육, 상담, 마케팅, 디자인, 문화예술 분야에서 두각을 나타낼 것입니다.

**📈 직장에서의 성공 가능성**
팀워크를 중시하고 조화로운 분위기를 만드는 능력으로 동료들의 신뢰를 얻을 것입니다. 중간 관리직에서 특히 능력을 발휘할 것입니다.

**🏢 창업 vs 직장생활 적합성**
안정적인 직장생활이 더 적합하지만, 창의적인 분야에서의 창업도 성공 가능성이 있습니다.

**⏰ 승진 및 발전 시기**
30대 중반과 40대 초반이 직업적 발전의 황금기가 될 것입니다.

**💡 직업 성공을 위한 조언**
꾸준한 자기계발과 인맥 관리가 성공의 열쇠입니다.`;
}

// 연애운 분석
async function analyzeLoveFortune(name, gender, saju, type = 'daily') {
  const genderText = gender === 'male' ? '남성' : '여성';
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  let prompt = '';
  
  switch(type) {
    case 'daily':
      prompt = `${name}님(${genderText})의 오늘 연애운을 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

오늘(${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일)의 연애운을 다음 항목으로 분석해주세요:
1. 오늘의 연애 운세 점수 (100점 만점)
2. 새로운 만남의 가능성
3. 기존 연인과의 관계
4. 고백하기 좋은 시간대
5. 피해야 할 행동
6. 연애운 상승 팁`;
      break;
      
    case 'monthly':
      prompt = `${name}님(${genderText})의 이번 달(${currentYear}년 ${currentMonth}월) 연애운을 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

이번 달의 연애운을 다음 항목으로 분석해주세요:
1. 이달의 전체적인 연애운
2. 연애운이 좋은 날짜들
3. 새로운 인연을 만날 가능성
4. 기존 관계의 발전 방향
5. 주의해야 할 시기
6. 이달의 연애 조언`;
      break;
      
    case 'yearly':
      prompt = `${name}님(${genderText})의 올해(${currentYear}년) 연애운을 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

올해의 연애운을 다음 항목으로 분석해주세요:
1. 올해 전체적인 연애운 흐름
2. 연애운이 좋은 계절/월
3. 결혼 가능성 및 시기
4. 이별 위험 시기
5. 새로운 사랑의 시작 시기
6. 올해 연애 성공 전략`;
      break;
  }

  const result = await callOpenAI(prompt, '당신은 전문적인 연애 사주 분석가입니다.');
  
  if (result) return result;
  
  // 데모 분석
  const demoResponses = {
    daily: `💖 **${name}님의 오늘 연애운**

**✨ 오늘의 연애 운세 점수: 85점**
${saju.day}일주를 가진 ${name}님, 오늘은 연애운이 상당히 좋은 날입니다!

**💕 새로운 만남의 가능성**
오후 2시~6시 사이에 특별한 인연을 만날 가능성이 높습니다.

**💑 기존 연인과의 관계**
소통이 원활한 하루입니다. 진솔한 대화를 나누면 관계가 한층 깊어질 것입니다.

**🕐 고백하기 좋은 시간대**
저녁 7시~9시가 고백하기에 가장 좋은 시간입니다.

**⚠️ 피해야 할 행동**
과도한 질투나 의심은 금물입니다.

**🌟 연애운 상승 팁**
분홍색이나 연한 파란색 옷을 입으면 매력이 더욱 빛날 것입니다!`,

    monthly: `🌙 **${name}님의 이달 연애운**

**💖 이달의 전체적인 연애운**
${saju.month}월주의 영향으로 이번 달은 감정적으로 풍요로운 시기입니다.

**📅 연애운이 좋은 날짜들**
${today.getDate() + 3}일, ${today.getDate() + 10}일, ${today.getDate() + 17}일이 특히 좋습니다.

**✨ 새로운 인연을 만날 가능성**
이달 중순 이후 새로운 인연이 찾아올 가능성이 높습니다.`,

    yearly: `⭐ **${name}님의 올해 연애운**

**🌟 올해 전체적인 연애운 흐름**
${saju.year}년주의 기운으로 올해는 연애에 있어 변화와 성장의 해입니다.

**🌸 연애운이 좋은 계절/월**
봄(3-5월)과 가을(9-11월)이 특히 좋습니다.

**💒 결혼 가능성 및 시기**
하반기에 결혼으로 이어질 수 있는 진지한 만남이 있을 것입니다.`
  };
  
  return demoResponses[type] || '분석 결과를 불러오는 중입니다...';
}

// 궁합 분석
async function analyzeCompatibility(user, partner) {
  const userSaju = calculateSaju(user.year, user.month, user.day, user.hour);
  const partnerSaju = calculateSaju(partner.year, partner.month, partner.day, partner.hour);
  
  const prompt = `${user.name}님(${user.gender === 'male' ? '남성' : '여성'})과 ${partner.name}님(${partner.gender === 'male' ? '남성' : '여성'})의 궁합을 분석해주세요.

${user.name}님 사주: 년주(${userSaju.year}) 월주(${userSaju.month}) 일주(${userSaju.day}) 시주(${userSaju.time})
${partner.name}님 사주: 년주(${partnerSaju.year}) 월주(${partnerSaju.month}) 일주(${partnerSaju.day}) 시주(${partnerSaju.time})

다음 항목으로 궁합을 분석해주세요:
1. 전체적인 궁합 점수 (100점 만점)
2. 성격적 궁합
3. 연애 스타일 궁합
4. 결혼 궁합
5. 서로 보완해주는 점
6. 주의해야 할 점
7. 관계 발전을 위한 조언`;

  const result = await callOpenAI(prompt, '당신은 전문적인 궁합 분석가입니다.');
  
  return result || `💕 **${user.name}님과 ${partner.name}님의 궁합 분석**

**💯 전체적인 궁합 점수: 82점**

**👫 성격적 궁합**
두 분은 서로 다른 매력을 가지고 있어 상호 보완적인 관계를 만들 수 있습니다.

**💖 연애 스타일 궁합**
${user.name}님의 따뜻한 성격과 ${partner.name}님의 진중함이 잘 어울립니다.

**💒 결혼 궁합**
장기적으로 안정적인 관계를 유지할 수 있는 좋은 궁합입니다.

**🌟 서로 보완해주는 점**
${user.name}님은 ${partner.name}님에게 활력을, ${partner.name}님은 ${user.name}님에게 안정감을 줄 수 있습니다.

**⚠️ 주의해야 할 점**
가끔 의사소통에서 오해가 생길 수 있으니 충분한 대화가 필요합니다.

**💝 관계 발전을 위한 조언**
서로의 차이점을 인정하고 존중하는 마음이 중요합니다.`;
}

// 마음 읽기 분석
async function analyzeMindReading(name, gender, saju, type) {
  const genderText = gender === 'male' ? '남성' : '여성';
  let prompt = '';
  
  switch(type) {
    case 'thinking':
      prompt = `${name}님(${genderText})이 좋아하는 사람이 ${name}님을 생각하고 있는지 사주로 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})`;
      break;
    case 'feelings':
      prompt = `${name}님(${genderText})이 좋아하는 사람의 속마음을 사주로 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})`;
      break;
    case 'future':
      prompt = `${name}님(${genderText})과 좋아하는 사람의 미래를 사주로 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})`;
      break;
    case 'contact':
      prompt = `${name}님(${genderText})에게 좋아하는 사람으로부터 연락이 올지 사주로 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})`;
      break;
  }

  const result = await callOpenAI(prompt, '당신은 마음을 읽는 전문가입니다. 사주를 바탕으로 상대방의 마음을 따뜻하고 희망적으로 분석해주세요.');
  
  if (result) return result;
  
  const responses = {
    thinking: `💭 **그 사람이 ${name}님을 생각하고 있을까요?**

네, 그 사람도 ${name}님을 자주 생각하고 있습니다! 
특히 조용한 시간에 ${name}님과의 추억을 떠올리며 미소 짓고 있을 거예요.`,
    
    feelings: `💝 **그 사람의 속마음**

그 사람은 ${name}님에 대해 특별한 감정을 가지고 있습니다.
아직 표현하지 못하고 있지만, ${name}님과 함께 있을 때 편안함과 행복을 느끼고 있어요.`,
    
    future: `🔮 **${name}님과 그 사람의 미래**

두 분의 미래는 밝습니다! 
서로에 대한 이해가 깊어지면서 더욱 가까워질 것이고,
진실한 사랑으로 발전할 가능성이 매우 높습니다.`,

    contact: `📱 **연락이 올까요?**

곧 좋은 소식이 있을 것입니다!
${name}님을 그리워하는 마음이 커져서 먼저 연락을 취할 가능성이 높습니다.
조금만 더 기다려보세요.`
  };
  
  return responses[type] || '분석 중입니다...';
}

// 프리미엄 분석 함수들
async function analyzeFuture(name, gender, saju) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const prompt = `${name}님(${genderText})이 좋아하는 사람과의 미래를 상세히 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

다음 항목을 1000자 이상으로 상세하게 분석해주세요:
1. 그 사람과의 관계 발전 가능성과 단계별 과정
2. 언제쯤 관계가 진전될지 구체적인 시기
3. 두 사람이 함께했을 때의 모습과 일상
4. 극복해야 할 장애물과 해결 방법
5. 장기적인 관계 유지 가능성
6. 결혼까지 이어질 가능성과 시기
7. 구체적인 행동 지침과 조언

연애를 고민하는 사람의 마음을 이해하고 진심어린 조언을 해주세요.`;

  const result = await callOpenAI(prompt, '당신은 30년 경력의 전문 연애 상담사이자 사주 전문가입니다. 연애로 고민하는 사람들에게 따뜻하고 구체적인 조언을 해주세요.');
  
  return result || `💕 **${name}님과 그 사람의 미래**

${name}님의 사주를 깊이 분석한 결과, 그 사람과의 미래는 매우 밝고 희망적입니다. ${saju.day}일주를 가진 ${name}님은 진실한 사랑을 추구하는 성향이 강하며, 이는 상대방에게도 깊은 감동을 줄 것입니다.

**🌟 관계 발전 단계**
현재 두 분의 관계는 서로에 대한 호감이 싹트는 단계입니다. 앞으로 3-6개월 내에 더욱 가까워질 기회가 많이 생길 것이며, 특히 가을철(9-11월)에 결정적인 순간이 찾아올 것입니다. ${name}님의 따뜻하고 배려심 많은 성격이 상대방의 마음을 서서히 녹일 것입니다.

**💖 함께하는 일상의 모습**
두 분이 연인이 되면 매우 조화로운 관계를 만들어갈 것입니다. ${name}님은 상대방에게 안정감과 따뜻함을 주고, 상대방은 ${name}님에게 새로운 자극과 성장의 기회를 제공할 것입니다. 함께 카페에서 대화를 나누거나, 산책을 하며 소소한 행복을 나누는 모습이 자주 보입니다.

**⚠️ 극복해야 할 과제**
${name}님은 때때로 자신의 감정을 표현하는 것을 어려워할 수 있습니다. 하지만 이는 충분히 극복 가능한 부분입니다. 상대방과의 소통에서 더욱 솔직해지고, 자신의 마음을 진실하게 전달하는 연습이 필요합니다.

**💒 결혼 가능성**
두 분의 궁합을 볼 때, 결혼으로 이어질 가능성이 매우 높습니다. 특히 2-3년 후 결혼에 대한 구체적인 이야기가 나올 것이며, 서로의 가족들도 두 분의 관계를 축복할 것입니다.

**💡 구체적인 행동 지침**
1. 상대방과의 대화에서 더욱 적극적으로 참여하세요
2. 작은 선물이나 관심 표현을 통해 마음을 전달하세요
3. 함께할 수 있는 활동을 제안해보세요
4. 자신의 진정한 모습을 보여주는 것을 두려워하지 마세요

${name}님의 진실한 마음은 반드시 상대방에게 전달될 것입니다. 조급해하지 마시고 자연스럽게 관계를 발전시켜 나가세요.`;
}

async function analyzeThinking(name, gender, saju) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const prompt = `${name}님(${genderText})이 좋아하는 사람의 진짜 마음과 생각을 깊이 있게 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

다음 항목을 1000자 이상으로 상세하게 분석해주세요:
1. 그 사람이 나를 어떻게 생각하고 있는지
2. 나에 대한 그 사람의 감정 변화 과정
3. 그 사람이 표현하지 못하는 속마음
4. 나와 함께 있을 때 그 사람의 기분
5. 그 사람이 나에게 바라는 것
6. 앞으로 그 사람의 마음이 어떻게 변할지
7. 그 사람의 마음을 더 얻기 위한 방법

연애로 고민하는 마음을 이해하고 희망적이면서도 현실적인 조언을 해주세요.`;

  const result = await callOpenAI(prompt, '당신은 사람의 마음을 깊이 이해하는 전문 상담사입니다. 연애로 고민하는 사람에게 따뜻하고 구체적인 조언을 해주세요.');
  
  return result || `💭 **그 사람의 진짜 마음**

${name}님을 향한 그 사람의 마음을 깊이 들여다본 결과, 생각보다 훨씬 긍정적인 감정을 가지고 있습니다. ${saju.month}월주의 기운으로 볼 때, 그 사람은 ${name}님에 대해 특별한 관심과 호감을 느끼고 있습니다.

**💖 현재 그 사람의 마음**
그 사람은 ${name}님을 단순한 지인 이상으로 생각하고 있습니다. ${name}님과 대화할 때면 평소보다 더 신경을 쓰게 되고, ${name}님의 작은 행동 하나하나에도 관심을 기울이고 있습니다. 특히 ${name}님의 따뜻하고 배려심 많은 모습에 깊은 인상을 받았으며, 이런 성격이 자신에게 안정감을 준다고 느끼고 있습니다.

**🌱 감정 변화의 과정**
처음에는 단순한 호감 정도였지만, 시간이 지날수록 ${name}님에 대한 감정이 깊어지고 있습니다. 최근 들어서는 ${name}님과 더 많은 시간을 보내고 싶다는 생각을 자주 하고 있으며, ${name}님이 없는 자리에서도 자연스럽게 ${name}님 이야기가 나오곤 합니다.

**🤐 표현하지 못하는 속마음**
그 사람은 ${name}님에게 더 다가가고 싶어하지만, 혹시 자신의 마음이 부담스러울까 봐 조심스러워하고 있습니다. 내심으로는 ${name}님과 단둘이 시간을 보내고 싶어하며, 더 깊은 대화를 나누고 싶어합니다. 또한 ${name}님의 일상이나 취미에 대해서도 더 자세히 알고 싶어합니다.

**😊 함께 있을 때의 기분**
${name}님과 함께 있을 때 그 사람은 매우 편안하고 행복한 기분을 느낍니다. 평소 다른 사람들과 있을 때보다 더 자연스러운 모습을 보이게 되며, 웃음도 더 많아집니다. ${name}님의 존재 자체가 그 사람에게는 힐링이 되고 있습니다.

**💝 그 사람이 바라는 것**
그 사람은 ${name}님이 자신에게 더 마음을 열어주기를 바라고 있습니다. 더 자주 연락하고, 더 많은 이야기를 나누며, 서로의 진솔한 모습을 보여주고 싶어합니다. 또한 ${name}님이 자신을 특별하게 생각해주기를 은밀히 바라고 있습니다.

**🔮 앞으로의 마음 변화**
시간이 지날수록 그 사람의 마음은 더욱 확고해질 것입니다. 특히 앞으로 2-3개월 내에 ${name}님에 대한 감정을 더 이상 숨기기 어려워할 것이며, 어떤 형태로든 자신의 마음을 표현하려고 할 것입니다.

**💡 그 사람의 마음을 얻는 방법**
1. 더 자주 먼저 연락을 취해보세요
2. 그 사람의 관심사에 대해 질문하고 경청해주세요
3. 작은 고민이나 일상을 공유하며 거리를 좁혀보세요
4. 자연스럽게 둘만의 시간을 만들어보세요

그 사람은 이미 ${name}님에게 마음을 열고 있습니다. 조금만 더 용기를 내어 다가가신다면 분명 좋은 결과가 있을 것입니다.`;
}

async function analyzeMarriage(name, gender, saju) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const prompt = `${name}님(${genderText})의 결혼운과 결혼상대의 특징을 상세히 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

다음 항목을 1000자 이상으로 상세하게 분석해주세요:
1. 언제쯤 결혼하게 될지 구체적인 시기
2. 결혼상대의 외모, 성격, 직업 등 상세한 특징
3. 어떤 경로로 만나게 될지
4. 결혼 생활의 모습과 특징
5. 결혼 후 변화될 점들
6. 주의해야 할 점과 조언
7. 결혼을 앞당기거나 좋은 상대를 만나는 방법

결혼을 꿈꾸는 마음을 이해하고 구체적이고 희망적인 조언을 해주세요.`;

  const result = await callOpenAI(prompt, '당신은 결혼 전문 상담사이자 사주 전문가입니다. 결혼을 꿈꾸는 사람에게 구체적이고 따뜻한 조언을 해주세요.');
  
  return result || `💒 **${name}님의 결혼운과 이상형**

${name}님의 사주를 종합적으로 분석한 결과, 결혼운이 매우 좋으며 행복한 결혼 생활을 할 수 있는 팔자입니다. ${saju.day}일주의 특성상 가정을 중시하고 배우자를 소중히 여기는 성향이 강해 안정적인 결혼 생활을 영위할 것입니다.

**⏰ 결혼 시기**
${name}님의 결혼 적령기는 만 28-32세 사이로 보입니다. 특히 29세와 31세에 결혼과 관련된 중요한 만남이나 결정이 있을 가능성이 높습니다. 계절로는 봄(3-5월)이나 가을(9-11월)에 결혼식을 올릴 가능성이 높으며, 이 시기에 결혼하면 더욱 행복한 결혼 생활을 할 수 있을 것입니다.

**👤 결혼상대의 특징**
${name}님의 결혼상대는 다음과 같은 특징을 가질 것입니다:

외모: 키는 평균 이상이며, 단정하고 깔끔한 인상을 가진 분입니다. 눈이 인상적이고 미소가 따뜻한 분으로, 첫인상부터 호감을 줄 것입니다.

성격: 성실하고 책임감이 강하며, ${name}님과 비슷하게 가정을 중시하는 가치관을 가지고 있습니다. 유머 감각이 있어 ${name}님을 자주 웃게 만들 것이며, 결정적인 순간에는 든든한 지원군이 되어줄 것입니다.

직업: 안정적인 직업을 가진 분으로, 교육, 의료, 공무원, 또는 전문직에 종사할 가능성이 높습니다. 경제적으로도 안정되어 있어 ${name}님과 함께 계획적인 미래를 설계할 수 있을 것입니다.

**💕 만남의 경로**
결혼상대와는 지인의 소개나 직장, 취미 활동을 통해 만날 가능성이 높습니다. 특히 교육이나 문화와 관련된 장소에서 만날 확률이 높으며, 첫 만남에서부터 서로에게 특별한 감정을 느낄 것입니다.

**🏠 결혼 생활의 모습**
${name}님의 결혼 생활은 매우 화목하고 안정적일 것입니다. 부부간의 소통이 원활하고 서로를 존중하는 관계를 유지할 것입니다. 아이들과도 좋은 관계를 맺을 것이며, 가족 모두가 행복한 가정을 만들어갈 것입니다.

**🌟 결혼 후 변화**
결혼 후 ${name}님은 더욱 성숙해지고 안정감을 얻을 것입니다. 배우자의 영향으로 새로운 취미나 관심사를 갖게 될 수도 있으며, 사회적으로도 더욱 활발해질 것입니다.

**⚠️ 주의사항과 조언**
완벽한 상대를 찾으려 하기보다는 서로 보완할 수 있는 관계를 만드는 것이 중요합니다. 또한 결혼 전 충분한 대화를 통해 가치관을 확인하는 것이 필요합니다.

**💡 좋은 인연을 만나는 방법**
1. 자기계발에 힘써 매력적인 사람이 되세요
2. 다양한 모임이나 활동에 적극적으로 참여하세요
3. 주변 사람들에게 좋은 사람이 있으면 소개해달라고 부탁하세요
4. 너무 조급해하지 말고 자연스러운 만남을 기다리세요

${name}님의 결혼운은 정말 좋습니다. 조금만 더 기다리시면 분명 운명의 상대를 만나게 될 것입니다.`;
}

async function analyzeStrategy(name, gender, saju) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const prompt = `${name}님(${genderText})을 위한 맞춤형 연애 성공 전략을 구체적으로 제시해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

다음 항목을 1000자 이상으로 상세하게 분석해주세요:
1. 개인의 연애 스타일과 장단점 분석
2. 어떤 타입의 이성에게 어필할 수 있는지
3. 연애에서 성공하기 위한 구체적인 전략
4. 피해야 할 연애 패턴과 실수들
5. 매력을 높이는 방법들
6. 상황별 대처 방법 (첫 만남, 데이트, 고백 등)
7. 장기적인 관계 유지 비결

실용적이고 구체적인 조언으로 연애 성공을 도와주세요.`;

  const result = await callOpenAI(prompt, '당신은 연애 코치이자 사주 전문가입니다. 실용적이고 구체적인 연애 조언을 해주세요.');
  
  return result || `🎯 **${name}님만의 연애 성공 전략**

${name}님의 사주를 바탕으로 맞춤형 연애 전략을 제시해드리겠습니다. ${saju.day}일주의 특성을 최대한 활용하면 분명 연애에서 성공할 수 있을 것입니다.

**💖 ${name}님의 연애 스타일 분석**
${name}님은 진실하고 깊이 있는 사랑을 추구하는 타입입니다. 겉으로 드러내지는 않지만 내면에 뜨거운 열정을 가지고 있으며, 한 번 사랑하면 깊고 오래가는 사랑을 합니다. 상대방을 배려하고 이해하려는 마음이 강해 안정적인 관계를 만드는 데 뛰어납니다.

장점: 진실성, 배려심, 깊이 있는 사랑, 안정감 제공
단점: 소극적 표현, 완벽주의 성향, 상처받기 쉬운 마음

**👥 어필 가능한 이성 타입**
${name}님에게 매력을 느낄 이성의 특징:
- 진실하고 성실한 사람을 좋아하는 타입
- 안정적인 관계를 원하는 사람
- 깊이 있는 대화를 즐기는 지적인 타입
- 가정적이고 따뜻한 사람을 선호하는 타입

**🎯 구체적인 연애 성공 전략**

1단계 - 첫인상 만들기:
${name}님의 자연스러운 미소와 따뜻한 눈빛을 적극 활용하세요. 과도한 꾸밈보다는 깔끔하고 단정한 스타일이 더 매력적으로 보일 것입니다.

2단계 - 관심 끌기:
직접적인 어필보다는 상대방의 이야기에 진심으로 귀 기울이는 모습을 보여주세요. ${name}님의 공감 능력과 이해심이 상대방에게 깊은 인상을 줄 것입니다.

3단계 - 관계 발전시키기:
작은 관심과 배려를 꾸준히 표현하세요. 상대방이 힘들어할 때 옆에서 든든한 지지자가 되어주는 것이 ${name}님의 가장 큰 무기입니다.

**⚠️ 피해야 할 연애 패턴**
1. 너무 완벽한 상대를 찾으려 하지 마세요
2. 자신의 감정을 너무 숨기지 마세요
3. 상대방의 모든 것을 맞춰주려 하지 마세요
4. 거절당할 것을 미리 걱정하지 마세요

**✨ 매력 향상 방법**
- 자신만의 취미나 특기를 개발하세요
- 긍정적인 마인드를 유지하세요
- 건강한 생활 습관으로 자연스러운 매력을 발산하세요
- 다양한 경험을 통해 대화 소재를 늘리세요

**📋 상황별 대처법**

첫 만남: 자연스럽고 편안한 분위기를 만드세요. 상대방이 긴장하지 않도록 따뜻한 미소와 부드러운 목소리로 대화하세요.

데이트: 상대방의 취향을 고려한 장소를 선택하고, 함께 즐길 수 있는 활동을 제안하세요. 무리하지 말고 자연스럽게 행동하는 것이 중요합니다.

고백: ${name}님의 진실한 마음을 솔직하게 전달하세요. 화려한 이벤트보다는 조용하고 의미 있는 장소에서 진심을 담아 고백하는 것이 좋습니다.

**💝 장기적 관계 유지 비결**
1. 꾸준한 소통과 관심 표현
2. 서로의 개인 시간과 공간 존중
3. 작은 기념일들을 챙기는 세심함
4. 갈등 상황에서의 현명한 대처
5. 함께 성장하려는 노력

${name}님의 진실한 마음과 따뜻한 성격은 분명 누군가에게 큰 감동을 줄 것입니다. 자신감을 가지고 적극적으로 다가가세요!`;
}

async function analyzeSoulmate(name, gender, saju) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const prompt = `${name}님(${genderText})의 운명의 상대와 만날 시기를 상세히 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

다음 항목을 1000자 이상으로 상세하게 분석해주세요:
1. 운명의 상대의 구체적인 특징 (외모, 성격, 가치관)
2. 언제, 어디서, 어떻게 만나게 될지
3. 첫 만남의 상황과 느낌
4. 운명의 상대임을 알 수 있는 신호들
5. 그 사람과의 관계 발전 과정
6. 운명의 만남을 앞당기는 방법
7. 놓치지 않기 위한 주의사항

운명적 사랑을 꿈꾸는 마음을 이해하고 희망적이고 구체적인 조언을 해주세요.`;

  const result = await callOpenAI(prompt, '당신은 운명적 사랑의 전문가입니다. 운명의 상대를 꿈꾸는 사람에게 희망적이고 구체적인 조언을 해주세요.');
  
  return result || `💎 **${name}님의 운명의 상대**

${name}님의 사주에는 특별한 인연의 기운이 강하게 나타나 있습니다. ${saju.year}년주와 ${saju.day}일주의 조합을 볼 때, 분명히 운명적인 만남이 기다리고 있습니다.

**👤 운명의 상대 특징**

외모: 키는 ${name}님보다 약간 크며, 깔끔하고 지적인 인상을 가진 분입니다. 눈이 맑고 인상이 온화하며, 미소 지을 때 특히 매력적입니다. 패션 센스가 좋고 단정한 스타일을 선호합니다.

성격: 차분하고 사려깊은 성격으로, ${name}님과 비슷한 가치관을 가지고 있습니다. 유머 감각이 있어 ${name}님을 자주 웃게 만들 것이며, 어려운 상황에서도 침착하게 대처하는 능력이 있습니다. 가족을 소중히 여기고 미래에 대한 계획이 뚜렷한 분입니다.

가치관: 진실성과 성실함을 중요하게 생각하며, ${name}님처럼 깊이 있는 관계를 추구합니다. 물질적인 것보다는 정신적인 풍요로움을 더 중시하는 타입입니다.

**📍 만남의 시기와 장소**
운명의 상대와는 앞으로 18-24개월 내에 만나게 될 것입니다. 특히 봄(3-5월)이나 가을(9-11월)에 만날 가능성이 높으며, 다음과 같은 장소에서 만날 확률이 높습니다:
- 교육 관련 장소 (도서관, 강의실, 세미나)
- 문화 공간 (미술관, 박물관, 공연장)
- 지인의 소개팅이나 모임
- 취미 활동 관련 장소

**💫 첫 만남의 상황**
첫 만남은 매우 자연스럽고 편안한 분위기에서 이루어질 것입니다. 서로 눈이 마주치는 순간 특별한 느낌을 받을 것이며, 대화가 자연스럽게 이어져 시간 가는 줄 모를 것입니다. ${name}님은 그 순간 '이 사람이 특별하다'는 직감을 받을 것입니다.

**🔮 운명의 상대임을 알 수 있는 신호**
1. 첫 만남부터 대화가 자연스럽게 이어짐
2. 서로의 가치관이나 취향이 놀랍도록 비슷함
3. 함께 있을 때 시간이 빨리 지나감
4. 상대방 생각이 자주 남
5. 꿈에서 그 사람이 나타남
6. 우연한 만남이 자주 생김
7. 주변 사람들이 잘 어울린다고 말함

**💕 관계 발전 과정**
첫 만남 후 2-3주 내에 다시 만날 기회가 생길 것이며, 그때부터 본격적인 관계가 시작될 것입니다. 3개월 정도 지나면 서로에 대한 감정을 확신하게 되고, 6개월 후에는 진지한 교제를 시작할 것입니다. 1년 후에는 결혼에 대한 이야기가 나올 것입니다.

**⚡ 운명의 만남을 앞당기는 방법**
1. 다양한 문화 활동에 참여하세요
2. 새로운 취미나 관심사를 개발하세요
3. 지인들의 모임에 적극적으로 참여하세요
4. 자기계발에 힘써 매력적인 사람이 되세요
5. 긍정적인 마음가짐을 유지하세요
6. 직감을 믿고 용기 있게 행동하세요

**⚠️ 놓치지 않기 위한 주의사항**
1. 첫인상만으로 판단하지 마세요
2. 너무 완벽한 사람을 찾으려 하지 마세요
3. 기회가 왔을 때 주저하지 마세요
4. 상대방의 진심을 알아보는 눈을 기르세요
5. 자신의 직감을 믿으세요

**🌟 특별한 조언**
${name}님의 운명의 상대는 이미 ${name}님 주변 어딘가에 있을 수도 있습니다. 새로운 만남에만 집중하지 말고, 기존에 알고 있던 사람들 중에서도 다시 한 번 살펴보세요. 때로는 가장 가까운 곳에 운명이 숨어있기도 합니다.

${name}님의 진실한 마음과 따뜻한 성격은 분명 운명의 상대에게 큰 감동을 줄 것입니다. 조급해하지 마시고 자연스럽게 기다리세요. 운명은 가장 완벽한 타이밍에 찾아올 것입니다.`;
}

async function analyzeTiming(name, gender, saju) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const prompt = `${name}님(${genderText})의 연애 관련 중요한 타이밍들을 상세히 분석해주세요.
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

다음 항목을 1000자 이상으로 상세하게 분석해주세요:
1. 고백하기 좋은 시기와 방법
2. 프로포즈 최적 타이밍
3. 연애운이 상승하는 시기들
4. 피해야 할 위험한 시기들
5. 중요한 결정을 내리기 좋은 때
6. 관계 회복이나 화해의 타이밍
7. 월별, 계절별 연애 전략

타이밍의 중요성을 이해하고 구체적이고 실용적인 조언을 해주세요.`;

  const result = await callOpenAI(prompt, '당신은 타이밍의 전문가입니다. 연애에서 중요한 순간들의 최적 타이밍을 알려주세요.');
  
  return result || `🔮 **${name}님의 연애 타이밍 가이드**

${name}님의 사주를 바탕으로 연애에서 중요한 타이밍들을 분석해드리겠습니다. ${saju.time}시주의 기운을 보면, 타이밍을 잘 맞추면 연애에서 큰 성공을 거둘 수 있을 것입니다.

**💖 고백하기 좋은 시기**
${name}님에게 가장 좋은 고백 타이밍은 다음과 같습니다:

시기: 매월 보름달 전후 3일 (음력 13일-17일)이 가장 좋으며, 특히 봄(3-5월)과 가을(9-11월)이 최적입니다.

시간대: 오후 7시-9시 사이가 가장 좋습니다. 이 시간대에는 ${name}님의 매력이 가장 빛나며, 상대방도 감정적으로 열려있을 가능성이 높습니다.

방법: 화려한 이벤트보다는 조용하고 의미 있는 장소에서 진심을 담아 고백하는 것이 좋습니다. 산책로나 카페 같은 편안한 공간이 적합합니다.

**💍 프로포즈 최적 타이밍**
결혼 프로포즈는 교제 시작 후 2-3년 사이가 가장 적합합니다. 구체적으로는:
- 계절: 봄(4-5월) 또는 가을(10-11월)
- 날짜: 두 사람에게 의미 있는 기념일이나 상대방 생일 전후
- 시간: 일몰 시간대 (오후 6-7시)가 가장 로맨틱합니다

**📈 연애운 상승 시기**
${name}님의 연애운이 특히 좋은 시기들:

2024년: 4월, 7월, 10월, 12월
2025년: 3월, 6월, 9월, 11월

이 시기에는 새로운 만남의 기회가 많아지고, 기존 관계도 한 단계 발전할 가능성이 높습니다. 적극적으로 사회 활동에 참여하고 새로운 사람들을 만나보세요.

**⚠️ 주의해야 할 시기**
다음 시기에는 연애 관련 중요한 결정을 피하는 것이 좋습니다:
- 매월 초승달 전후 (음력 1일-3일)
- 여름 장마철 (6월 말-7월 초)
- 연말연시 (12월 말-1월 초)

이 시기에는 감정이 불안정해지기 쉽고, 오해나 갈등이 생길 가능성이 높습니다.

**🎯 중요한 결정의 타이밍**
연애에서 중요한 결정(사귀기, 동거, 결혼 등)을 내릴 때는:
- 보름달이 뜨는 날 전후 3일
- 두 사람 모두 컨디션이 좋은 날
- 충분한 대화를 나눈 후
- 주변의 축복을 받을 수 있는 상황

**💔 관계 회복의 타이밍**
만약 갈등이나 오해가 생겼다면:
- 감정이 가라앉은 후 3-7일 뒤
- 상대방의 생일이나 기념일을 활용
- 조용하고 편안한 환경에서
- 진심어린 사과와 함께

**📅 월별 연애 전략**

1-2월: 새해 계획과 함께 연애 목표 설정, 자기계발에 집중
3-5월: 새로운 만남의 계절, 적극적인 사회 활동
6-8월: 기존 관계 깊이 있게 발전시키기, 여행이나 추억 만들기
9-11월: 진지한 관계로 발전, 미래에 대한 대화
12월: 한 해 정리하며 관계 점검, 새해 계획 함께 세우기

**🌟 계절별 특별 전략**

봄: 새로운 시작의 에너지를 활용해 적극적으로 다가가세요
여름: 활동적인 데이트로 추억을 많이 만드세요
가을: 깊이 있는 대화와 진지한 관계 발전에 집중하세요
겨울: 따뜻한 실내 데이트로 친밀감을 높이세요

**💡 타이밍 활용 팁**
1. 상대방의 컨디션과 기분도 함께 고려하세요
2. 무리하게 타이밍을 맞추려 하지 마세요
3. 자연스러운 흐름을 존중하세요
4. 직감도 중요한 타이밍 신호입니다
5. 준비가 되었을 때가 가장 좋은 타이밍입니다

${name}님의 진실한 마음과 좋은 타이밍이 만나면 분명 원하는 결과를 얻을 수 있을 것입니다. 조급해하지 마시고 최적의 순간을 기다려보세요!`;
}
function showError(msg){
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

// 탭 기능
document.addEventListener('DOMContentLoaded', function() {
  loadUserInfo();
  
  // 프리미엄 결제 상태 확인
  if (localStorage.getItem('premiumPaid') === 'true') {
    document.getElementById('premiumPayment').style.display = 'none';
    document.getElementById('premiumContent').style.display = 'block';
    document.getElementById('premiumContent').classList.add('active');
  }
  
  // 메인 탭 기능
  const mainTabBtns = document.querySelectorAll('.main-tab-btn');
  const mainTabContents = document.querySelectorAll('.main-tab-content');
  
  mainTabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      mainTabBtns.forEach(b => b.classList.remove('active'));
      mainTabContents.forEach(c => c.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
      
      // 사주 기둥과 인사말은 내사주 탭에서만 표시
      const sajuPillars = document.getElementById('sajuPillars');
      const userGreeting = document.getElementById('userGreeting');
      
      if (targetTab === 'mysaju') {
        // 내사주 탭에서는 저장된 정보가 있으면 사주 기둥 표시
        const savedUser = localStorage.getItem('sajuUser');
        if (savedUser) {
          sajuPillars.style.display = 'grid';
          userGreeting.style.display = 'block';
        }
      } else {
        // 다른 탭에서는 사주 기둥과 인사말 숨김
        sajuPillars.style.display = 'none';
        userGreeting.style.display = 'none';
      }
    });
  });
  
  // 서브 탭 기능
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('sub-tab-btn')) {
      const targetSubTab = e.target.dataset.subtab;
      const parentTab = e.target.closest('.main-tab-content');
      
      parentTab.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
      parentTab.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
      
      e.target.classList.add('active');
      document.getElementById(targetSubTab).classList.add('active');
    }
  });
  
  // 궁합 분석 버튼
  document.getElementById('compatibilityBtn').addEventListener('click', async function() {
    const partnerName = document.getElementById('partnerName').value;
    const partnerGender = document.getElementById('partnerGender').value;
    const partnerYear = parseInt(document.getElementById('partnerYear').value);
    const partnerMonth = parseInt(document.getElementById('partnerMonth').value);
    const partnerDay = parseInt(document.getElementById('partnerDay').value);
    const partnerHour = partnerTimeUnknownCheckbox.checked ? null : parseInt(document.getElementById('partnerHour').value);
    
    if (!partnerName || !partnerGender || !partnerYear || !partnerMonth || !partnerDay) {
      showError('상대방 정보를 모두 입력해주세요.');
      return;
    }
    
    const savedUser = JSON.parse(localStorage.getItem('sajuUser'));
    if (!savedUser) {
      showError('먼저 본인의 정보를 입력해주세요.');
      return;
    }
    
    this.disabled = true;
    this.textContent = '분석 중...';
    
    try {
      const partner = { name: partnerName, gender: partnerGender, year: partnerYear, month: partnerMonth, day: partnerDay, hour: partnerHour };
      const result = await analyzeCompatibility(savedUser, partner);
      document.getElementById('compatibilityContent').innerHTML = result.replace(/\n/g, '<br>');
    } catch (error) {
      showError('궁합 분석 중 오류가 발생했습니다.');
    } finally {
      this.disabled = false;
      this.textContent = '💕 궁합 분석하기';
    }
  });
  
  // 마음 읽기 버튼들
  document.querySelectorAll('.mind-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const type = this.dataset.type;
      const savedUser = JSON.parse(localStorage.getItem('sajuUser'));
      
      if (!savedUser) {
        showError('먼저 "내사주" 탭에서 개인 정보를 입력해주세요.');
        return;
      }
      
      this.disabled = true;
      const originalText = this.textContent;
      this.textContent = '분석 중...';
      
      try {
        const saju = calculateSaju(savedUser.year, savedUser.month, savedUser.day, savedUser.hour);
        const result = await analyzeMindReading(savedUser.name, savedUser.gender, saju, type);
        document.getElementById('mindContent').innerHTML = result.replace(/\n/g, '<br>');
      } catch (error) {
        showError('마음 읽기 분석 중 오류가 발생했습니다.');
      } finally {
        this.disabled = false;
        this.textContent = originalText;
      }
    });
  });
  
  // 연애운 분석 버튼들
  document.getElementById('dailyAnalyzeBtn').addEventListener('click', async function() {
    await analyzeLoveFortuneByType('daily', this, 'dailyContent');
  });
  
  document.getElementById('monthlyAnalyzeBtn').addEventListener('click', async function() {
    await analyzeLoveFortuneByType('monthly', this, 'monthlyContent');
  });
  
  document.getElementById('yearlyAnalyzeBtn').addEventListener('click', async function() {
    await analyzeLoveFortuneByType('yearly', this, 'yearlyContent');
  });
  
  // 프리미엄 결제 버튼
  document.getElementById('premiumPayBtn').addEventListener('click', function() {
    // 실제로는 결제 시스템과 연동
    if (confirm('프리미엄 서비스를 결제하시겠습니까? (₩19,900)')) {
      localStorage.setItem('premiumPaid', 'true');
      document.getElementById('premiumPayment').style.display = 'none';
      document.getElementById('premiumContent').style.display = 'block';
      document.getElementById('premiumContent').classList.add('active');
      
      // 사용자 정보가 있으면 버튼들 활성화
      const savedUser = localStorage.getItem('sajuUser');
      if (savedUser) {
        updateTabsBasedOnUserInfo(JSON.parse(savedUser));
      }
      
      alert('프리미엄 서비스가 활성화되었습니다! 이제 모든 고급 분석을 이용하실 수 있습니다.');
    }
  });
  
  // 프리미엄 분석 버튼들
  document.getElementById('futureAnalyzeBtn').addEventListener('click', async function() {
    await analyzePremiumContent('future', this, 'futureContent', analyzeFuture);
  });
  
  document.getElementById('thinkingAnalyzeBtn').addEventListener('click', async function() {
    await analyzePremiumContent('thinking', this, 'thinkingContent', analyzeThinking);
  });
  
  document.getElementById('marriageAnalyzeBtn').addEventListener('click', async function() {
    await analyzePremiumContent('marriage', this, 'marriageContent', analyzeMarriage);
  });
  
  document.getElementById('strategyAnalyzeBtn').addEventListener('click', async function() {
    await analyzePremiumContent('strategy', this, 'strategyContent', analyzeStrategy);
  });
  
  document.getElementById('soulmateAnalyzeBtn').addEventListener('click', async function() {
    await analyzePremiumContent('soulmate', this, 'soulmateContent', analyzeSoulmate);
  });
  
  document.getElementById('timingAnalyzeBtn').addEventListener('click', async function() {
    await analyzePremiumContent('timing', this, 'timingContent', analyzeTiming);
  });
});

// 프리미엄 컨텐츠 분석 함수
async function analyzePremiumContent(type, button, contentId, analyzeFunction) {
  const savedUser = JSON.parse(localStorage.getItem('sajuUser'));
  
  if (!savedUser) {
    showError('먼저 "내사주" 탭에서 개인 정보를 입력해주세요.');
    return;
  }
  
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = '분석 중...';
  
  try {
    const saju = calculateSaju(savedUser.year, savedUser.month, savedUser.day, savedUser.hour);
    const result = await analyzeFunction(savedUser.name, savedUser.gender, saju);
    document.getElementById(contentId).innerHTML = result.replace(/\n/g, '<br>');
  } catch (error) {
    showError('분석 중 오류가 발생했습니다.');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

// 연애운 분석 함수
async function analyzeLoveFortuneDirectly(type, button, contentId) {
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = '분석 중...';
  
  try {
    // 기본 사주 정보로 분석 (개인 정보 입력 불필요)
    const defaultSaju = { year: '갑자', month: '정축', day: '무인', time: '계해' };
    const result = await analyzeLoveFortune('회원', 'female', defaultSaju, type);
    document.getElementById(contentId).innerHTML = result.replace(/\n/g, '<br>');
  } catch (error) {
    showError('연애운 분석 중 오류가 발생했습니다.');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const gender = document.getElementById('gender').value;
  const year = parseInt(document.getElementById('year').value, 10);
  const month = parseInt(document.getElementById('month').value, 10);
  const day = parseInt(document.getElementById('day').value, 10);
  const hour = timeUnknownCheckbox.checked ? null : parseInt(document.getElementById('hour').value, 10);

  if (!name || !gender || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    showError('모든 정보를 정확히 입력해주세요.');
    return;
  }
  
  if (!timeUnknownCheckbox.checked && Number.isNaN(hour)) {
    showError('태어난 시간을 선택하거나 "시간을 모름"을 체크해주세요.');
    return;
  }

  // 사용자 정보 저장
  saveUserInfo(name, gender, year, month, day, hour);

  analyzeBtn.disabled = true;
  loading.style.display = 'block';
  errorMessage.style.display = 'none';

  try {
    const saju = calculateSaju(year, month, day, hour);
    
    // 사주 표시 (내사주 탭에서만)
    document.getElementById('sajuPillars').style.display = 'grid';
    document.getElementById('yearPillar').textContent = saju.year;
    document.getElementById('monthPillar').textContent = saju.month;
    document.getElementById('dayPillar').textContent = saju.day;
    document.getElementById('timePillar').textContent = saju.time;
    
    // 사용자 인사말
    document.getElementById('userGreeting').style.display = 'block';
    document.getElementById('userGreeting').textContent = `💖 ${name}님의 사주 분석 💖`;
    
    // 내사주 분석 실행
    const basicResult = await analyzeBasicPersonality(name, gender, saju);
    document.getElementById('basicContent').innerHTML = basicResult.replace(/\n/g, '<br>');
    
    const careerResult = await analyzeCareer(name, gender, saju);
    document.getElementById('careerContent').innerHTML = careerResult.replace(/\n/g, '<br>');
    
    // 로딩 숨기고 결과 표시
    loading.style.display = 'none';
    
  } catch (err) {
    console.error('분석 오류:', err);
    loading.style.display = 'none';
    showError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    analyzeBtn.disabled = false;
  }
});