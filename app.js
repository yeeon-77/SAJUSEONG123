// API 키를 여기에 입력하세요
const OPENAI_API_KEY = 'your-openai-api-key-here';

const form = document.getElementById('sajuForm');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const errorMessage = document.getElementById('errorMessage');
const analyzeBtn = document.getElementById('analyzeBtn');
const timeUnknownCheckbox = document.getElementById('timeUnknown');
const timeSelect = document.getElementById('timeSelect');
const dayInput = document.getElementById('day');
const monthSelect = document.getElementById('month');

const heavenlyStems = ['갑','을','병','정','무','기','경','신','임','계'];
const earthlyBranches = ['자','축','인','묘','진','사','오','미','신','유','술','해'];

// 로컬 스토리지에서 사용자 정보 불러오기
function loadUserInfo() {
  const savedUser = localStorage.getItem('loveFortuneUser');
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
  }
}

// 사용자 정보 저장
function saveUserInfo(name, gender, year, month, day, hour) {
  const userInfo = { name, gender, year, month, day, hour };
  localStorage.setItem('loveFortuneUser', JSON.stringify(userInfo));
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
    
    // 현재 입력된 일이 최대값을 초과하면 조정
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

async function analyzeLoveFortune(name, gender, year, month, day, hour, type = 'daily') {
  const saju = calculateSaju(year, month, day, hour);
  
  let prompt = '';
  const genderText = gender === 'male' ? '남성' : '여성';
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  switch(type) {
    case 'daily':
      prompt = `${name}님(${genderText})의 오늘 연애운을 분석해주세요.
생년월일시: ${year}년 ${month}월 ${day}일 ${hour ? hour + '시' : '시간미상'}
사주: 년주(${saju.year}) 월주(${saju.month}) 일주(${saju.day}) 시주(${saju.time})

오늘(${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일)의 연애운을 다음 항목으로 분석해주세요:
1. 오늘의 연애 운세 점수 (100점 만점)
2. 새로운 만남의 가능성
3. 기존 연인과의 관계
4. 고백하기 좋은 시간대
5. 피해야 할 행동
6. 연애운 상승 팁

따뜻하고 희망적인 톤으로 작성해주세요.`;
      break;
      
    case 'monthly':
      prompt = `${name}님(${genderText})의 이번 달(${currentYear}년 ${currentMonth}월) 연애운을 분석해주세요.
생년월일시: ${year}년 ${month}월 ${day}일 ${hour ? hour + '시' : '시간미상'}
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
생년월일시: ${year}년 ${month}월 ${day}일 ${hour ? hour + '시' : '시간미상'}
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
            {
              role: 'system',
              content: '당신은 전문적인 연애 사주 분석가입니다. 한국의 전통 사주학에 기반하여 연애운을 정확하고 따뜻하게 분석해주세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return { saju, analysis: data.choices[0].message.content };
      } else {
        throw new Error('API 호출 실패');
      }
    } catch (error) {
      console.error('OpenAI API 오류:', error);
      return { saju, analysis: generateDemoAnalysis(name, gender, saju, type) };
    }
  }
  
  return { saju, analysis: generateDemoAnalysis(name, gender, saju, type) };
}

function generateDemoAnalysis(name, gender, saju, type) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const today = new Date();
  
  switch(type) {
    case 'daily':
      return `💖 **${name}님의 오늘 연애운**

**✨ 오늘의 연애 운세 점수: 85점**
${saju.day}일주를 가진 ${name}님, 오늘은 연애운이 상당히 좋은 날입니다!

**💕 새로운 만남의 가능성**
오후 2시~6시 사이에 특별한 인연을 만날 가능성이 높습니다. 카페나 서점 같은 조용한 공간에서 좋은 만남이 기대됩니다.

**💑 기존 연인과의 관계**
소통이 원활한 하루입니다. 진솔한 대화를 나누면 관계가 한층 깊어질 것입니다.

**🕐 고백하기 좋은 시간대**
저녁 7시~9시가 고백하기에 가장 좋은 시간입니다.

**⚠️ 피해야 할 행동**
과도한 질투나 의심은 금물입니다. 상대방을 믿고 기다리는 마음이 중요해요.

**🌟 연애운 상승 팁**
분홍색이나 연한 파란색 옷을 입으면 매력이 더욱 빛날 것입니다!`;

    case 'monthly':
      return `🌙 **${name}님의 이달 연애운**

**💖 이달의 전체적인 연애운**
${saju.month}월주의 영향으로 이번 달은 감정적으로 풍요로운 시기입니다. 연애에 적극적으로 나서기 좋은 때입니다.

**📅 연애운이 좋은 날짜들**
${today.getDate() + 3}일, ${today.getDate() + 10}일, ${today.getDate() + 17}일이 특히 좋습니다.

**✨ 새로운 인연을 만날 가능성**
이달 중순 이후 새로운 인연이 찾아올 가능성이 높습니다.

**💕 기존 관계의 발전 방향**
진전된 관계로 발전할 수 있는 좋은 시기입니다.

**⚠️ 주의해야 할 시기**
이달 말경에는 감정적으로 예민해질 수 있으니 주의하세요.

**💝 이달의 연애 조언**
자신감을 가지고 적극적으로 행동하세요!`;

    case 'yearly':
      return `⭐ **${name}님의 올해 연애운**

**🌟 올해 전체적인 연애운 흐름**
${saju.year}년주의 기운으로 올해는 연애에 있어 변화와 성장의 해입니다.

**🌸 연애운이 좋은 계절/월**
봄(3-5월)과 가을(9-11월)이 특히 좋습니다.

**💒 결혼 가능성 및 시기**
하반기에 결혼으로 이어질 수 있는 진지한 만남이 있을 것입니다.

**💔 이별 위험 시기**
여름철(6-8월)에는 갈등이 생길 수 있으니 주의하세요.

**💖 새로운 사랑의 시작 시기**
4월과 10월이 새로운 사랑이 시작되기 좋은 시기입니다.

**🎯 올해 연애 성공 전략**
진정성 있는 소통과 꾸준한 관심 표현이 성공의 열쇠입니다.`;

    default:
      return '분석 결과를 불러오는 중입니다...';
  }
}

async function analyzeCompatibility(user, partner) {
  const userSaju = calculateSaju(user.year, user.month, user.day, user.hour);
  const partnerSaju = calculateSaju(partner.year, partner.month, partner.day, partner.hour || null);
  
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
            {
              role: 'system',
              content: '당신은 전문적인 궁합 분석가입니다. 사주를 바탕으로 두 사람의 궁합을 정확하고 따뜻하게 분석해주세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('궁합 분석 오류:', error);
    }
  }
  
  return `💕 **${user.name}님과 ${partner.name}님의 궁합 분석**

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

async function analyzeMindReading(name, gender, saju, type) {
  let prompt = '';
  
  switch(type) {
    case 'thinking':
      prompt = `${name}님이 좋아하는 사람이 ${name}님을 생각하고 있는지 사주로 분석해주세요.`;
      break;
    case 'feelings':
      prompt = `${name}님이 좋아하는 사람의 속마음을 사주로 분석해주세요.`;
      break;
    case 'future':
      prompt = `${name}님과 좋아하는 사람의 미래를 사주로 분석해주세요.`;
      break;
  }

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
            {
              role: 'system',
              content: '당신은 마음을 읽는 전문가입니다. 사주를 바탕으로 상대방의 마음을 따뜻하고 희망적으로 분석해주세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.8
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('마음 읽기 오류:', error);
    }
  }
  
  const responses = {
    thinking: `💭 **그 사람이 ${name}님을 생각하고 있을까요?**

네, 그 사람도 ${name}님을 자주 생각하고 있습니다! 
특히 조용한 시간에 ${name}님과의 추억을 떠올리며 미소 짓고 있을 거예요.
${name}님의 따뜻한 마음이 그 사람에게도 전해지고 있습니다.`,
    
    feelings: `💝 **그 사람의 속마음**

그 사람은 ${name}님에 대해 특별한 감정을 가지고 있습니다.
아직 표현하지 못하고 있지만, ${name}님과 함께 있을 때 편안함과 행복을 느끼고 있어요.
조금 더 시간을 주시면 그 마음을 표현할 용기를 낼 것입니다.`,
    
    future: `🔮 **${name}님과 그 사람의 미래**

두 분의 미래는 밝습니다! 
서로에 대한 이해가 깊어지면서 더욱 가까워질 것이고,
진실한 사랑으로 발전할 가능성이 매우 높습니다.
인내심을 가지고 기다리시면 좋은 결과가 있을 것입니다.`
  };
  
  return responses[type] || '분석 중입니다...';
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
  
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
  
  // 궁합 분석 버튼
  document.getElementById('compatibilityBtn').addEventListener('click', async function() {
    const partnerName = document.getElementById('partnerName').value;
    const partnerGender = document.getElementById('partnerGender').value;
    const partnerYear = parseInt(document.getElementById('partnerYear').value);
    const partnerMonth = parseInt(document.getElementById('partnerMonth').value);
    const partnerDay = parseInt(document.getElementById('partnerDay').value);
    
    if (!partnerName || !partnerGender || !partnerYear || !partnerMonth || !partnerDay) {
      showError('상대방 정보를 모두 입력해주세요.');
      return;
    }
    
    const savedUser = JSON.parse(localStorage.getItem('loveFortuneUser'));
    if (!savedUser) {
      showError('먼저 본인의 정보를 입력해주세요.');
      return;
    }
    
    this.disabled = true;
    this.textContent = '분석 중...';
    
    try {
      const partner = { name: partnerName, gender: partnerGender, year: partnerYear, month: partnerMonth, day: partnerDay };
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
      const savedUser = JSON.parse(localStorage.getItem('loveFortuneUser'));
      
      if (!savedUser) {
        showError('먼저 본인의 정보를 입력해주세요.');
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
});

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
  resultSection.style.display = 'none';
  errorMessage.style.display = 'none';

  try {
    // 기본 분석 (일일 운세)
    const result = await analyzeLoveFortune(name, gender, year, month, day, hour, 'daily');
    
    // 사주 표시
    document.getElementById('yearPillar').textContent = result.saju.year;
    document.getElementById('monthPillar').textContent = result.saju.month;
    document.getElementById('dayPillar').textContent = result.saju.day;
    document.getElementById('timePillar').textContent = result.saju.time;
    
    // 사용자 인사말
    document.getElementById('userGreeting').textContent = `💖 ${name}님의 연애 운세 💖`;
    
    // 일일 운세 표시
    document.getElementById('dailyContent').innerHTML = result.analysis.replace(/\n/g, '<br>');
    
    // 월간, 연간 운세도 미리 로드
    const monthlyResult = await analyzeLoveFortune(name, gender, year, month, day, hour, 'monthly');
    document.getElementById('monthlyContent').innerHTML = monthlyResult.analysis.replace(/\n/g, '<br>');
    
    const yearlyResult = await analyzeLoveFortune(name, gender, year, month, day, hour, 'yearly');
    document.getElementById('yearlyContent').innerHTML = yearlyResult.analysis.replace(/\n/g, '<br>');
    
    // 로딩 숨기고 결과 표시
    loading.style.display = 'none';
    resultSection.style.display = 'block';
    
    // 결과 섹션으로 스크롤
    resultSection.scrollIntoView({ behavior: 'smooth' });
    
  } catch (err) {
    console.error('분석 오류:', err);
    loading.style.display = 'none';
    showError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    analyzeBtn.disabled = false;
  }
});