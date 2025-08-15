// API 키를 여기에 입력하세요
const OPENAI_API_KEY = 'your-openai-api-key-here';

const form = document.getElementById('sajuForm');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const errorMessage = document.getElementById('errorMessage');
const analyzeBtn = document.getElementById('analyzeBtn');

const heavenlyStems = ['갑','을','병','정','무','기','경','신','임','계'];
const earthlyBranches = ['자','축','인','묘','진','사','오','미','신','유','술','해'];

function mod(n, m){ return ((n % m) + m) % m; }

function calculateSaju(year, month, day, hour){
  const yearStem = heavenlyStems[mod(year - 4, 10)];
  const yearBranch = earthlyBranches[mod(year - 4, 12)];
  const monthStem = heavenlyStems[mod(month - 1, 10)];
  const monthBranch = earthlyBranches[mod(month - 1, 12)];
  const dayStem = heavenlyStems[mod(day, 10)];
  const dayBranch = earthlyBranches[mod(day, 12)];

  const hourIndex = Math.floor(mod(hour + 1, 24) / 2);
  const timeBranch = earthlyBranches[hourIndex];
  const timeStem = heavenlyStems[hourIndex % 10];

  return { year: yearStem + yearBranch, month: monthStem + monthBranch, day: dayStem + dayBranch, time: timeStem + timeBranch };
}

async function analyzeSaju(gender, year, month, day, hour){
  const saju = calculateSaju(year, month, day, hour);
  try{
    const response = await fetch('/api/analyze-saju', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gender, year, month, day, hour, saju, apiKey: OPENAI_API_KEY })
    });
    if (response.ok){
      const result = await response.json();
      return result;
    }
  }catch(e){}
  // fallback demo (shouldn't happen on Pages)
  return { saju, analysis: generateDemoAnalysis(gender, saju, year) };
}

function generateDemoAnalysis(gender, saju, year){
  const genderText = gender === 'male' ? '남성' : '여성';
  return `🌟 **${genderText} / ${saju.year} ${saju.month} ${saju.day} ${saju.time}** 사주 분석\n\n`+
  `**✨ 기본 성격과 성향**\n${saju.day}일주를 가진 분은 적응력이 좋고 추진력이 있습니다.\n\n`+
  `**🎯 타고난 재능과 능력**\n직관과 통찰이 돋보이며, 대인관계에서 강점을 보입니다.\n\n`+
  `**🌅 인생의 전반적 흐름**\n${Math.floor((year + 20) / 10) * 10}년대에 전환점이 예상됩니다.\n\n`+
  `**💼 직업/재물운**\n안정적 저축과 분산 투자가 유리합니다.\n\n`+
  `**💕 연애/결혼운**\n가치관의 일치가 핵심입니다.\n\n`+
  `**🏥 건강운**\n스트레스 관리에 유의하세요.\n\n`+
  `**⚠️ 주의/조언**\n완벽주의를 내려놓고 리듬을 조절하세요.\n\n*※ 데모 버전입니다.*`;
}

function showError(msg){
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
  setTimeout(()=> errorMessage.style.display = 'none', 5000);
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const gender = document.getElementById('gender').value;
  const year = parseInt(document.getElementById('year').value, 10);
  const month = parseInt(document.getElementById('month').value, 10);
  const day = parseInt(document.getElementById('day').value, 10);
  const hour = parseInt(document.getElementById('hour').value, 10);

  if(!gender || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(hour)){
    showError('생년월일시 정보를 모두 정확히 입력해주세요.');
    return;
  }

  analyzeBtn.disabled = true;
  loading.style.display = 'block';
  resultSection.style.display = 'none';
  errorMessage.style.display = 'none';

  try{
    const result = await analyzeSaju(gender, year, month, day, hour);
    document.getElementById('yearPillar').textContent = result.saju.year;
    document.getElementById('monthPillar').textContent = result.saju.month;
    document.getElementById('dayPillar').textContent = result.saju.day;
    document.getElementById('timePillar').textContent = result.saju.time;
    document.getElementById('analysisContent').innerHTML = result.analysis.replace(/\n/g, '<br>');
    loading.style.display = 'none';
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
  }catch(err){
    loading.style.display = 'none';
    showError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }finally{
    analyzeBtn.disabled = false;
  }
});

