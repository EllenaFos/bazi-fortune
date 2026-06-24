/**
 * 八字命盘网站 · UI 控制器
 * Main UI Controller
 */
let currentBazi = null;
let currentSection = 'form';

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  // 尝试从 localStorage 恢复
  const saved = localStorage.getItem('bazi_data');
  if (saved) {
    try {
      currentBazi = JSON.parse(saved);
      renderBazi();
      renderDailyFortune();
      showSection('bazi');
      return;
    } catch(e) {}
  }
  showSection('form');
});

// ====== FORM HANDLER ======
function handleSubmit(e) {
  e.preventDefault();
  const dateVal = document.getElementById('birth-date').value;
  const hourVal = parseInt(document.getElementById('birth-hour').value);
  const gender = parseInt(document.querySelector('input[name="gender"]:checked').value);

  if (!dateVal) return;

  const [y, m, d] = dateVal.split('-').map(Number);
  currentBazi = BaziCalc.calculate({ year: y, month: m, day: d, hour: hourVal, gender });

  // Save
  localStorage.setItem('bazi_data', JSON.stringify(currentBazi));
  renderBazi();
  renderDailyFortune();
  showSection('bazi');
}

// ====== SECTION SWITCHER ======
function showSection(name) {
  currentSection = name;
  ['form','bazi','weekly','about'].forEach(s => {
    document.getElementById('section-' + s).style.display = (s === name) ? 'block' : 'none';
  });
  // Update nav active
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.remove('active');
    if ((name === 'form' || name === 'bazi') && (href === 'index.html' || href === '#' && a.textContent === '命盘')) {
      if (name === 'bazi' || name === 'form') a.classList.add('active');
    }
    if (name === 'weekly' && a.textContent === '周报') a.classList.add('active');
    if (name === 'about' && a.textContent === '说明') a.classList.add('active');
  });
  if (name === 'bazi' || name === 'form') {
    document.querySelector('.nav-links a:first-child').classList.add('active');
  }
  if (name === 'weekly') {
    document.querySelector('.nav-links a:nth-child(2)').classList.add('active');
    renderWeekly();
  }
  if (name === 'about') {
    document.querySelector('.nav-links a:last-child').classList.add('active');
  }
}

function scrollToDaily() {
  showSection('bazi');
  setTimeout(() => {
    document.getElementById('daily-fortune-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// ====== RENDER BAZI ======
function renderBazi() {
  const b = currentBazi;
  if (!b) return;

  // Meta
  document.getElementById('bazi-title').textContent = '八字命盘解析';
  const pText = b.pillars.map(p => p.stem + p.branch).join(' · ');
  document.getElementById('bazi-pillars-text').textContent = pText;
  document.getElementById('bazi-meta').textContent =
    `公历 ${b.birth.year}年${b.birth.month}月${b.birth.day}日 · ${b.gender ? '男' : '女'}命 · 生肖${b.zodiac} · 日主${b.dayMaster}(${b.dayMasterEle})`;

  // Pillars
  const grid = document.getElementById('bazi-grid');
  grid.innerHTML = b.pillars.map(p => `
    <div class="pillar${p.isDay ? ' day' : ''}">
      <div class="pillar-label">${p.label}</div>
      <div class="pillar-stem">${p.stem}</div>
      <div class="pillar-branch">${p.branch}</div>
      <div><span class="pillar-tag">${p.tenGod}</span></div>
      <div class="pillar-meta">${p.nayin || ''} · ${p.stage || ''}</div>
      <div class="hidden-stems">藏干：${(p.hidden||[]).join('')}</div>
    </div>
  `).join('');

  // Elements
  const els = document.getElementById('elements-grid');
  els.innerHTML = ['木','火','土','金','水'].map(e => `
    <div class="element-cell">
      <div class="el-name">${e}</div>
      <div class="el-count el-${e === '木' ? 'wood' : e === '火' ? 'fire' : e === '土' ? 'earth' : e === '金' ? 'metal' : 'water'}">${b.elements[e]}</div>
    </div>
  `).join('');

  // Pattern
  const favText = b.favorable.join('、');
  const unfavText = b.unfavorable.join('、');
  const weakText = b.isWeak ? '身偏弱' : '身偏旺';
  const nature = FortuneGen.DAY_MASTER_TIPS[b.dayMaster]?.nature || '';
  document.getElementById('pattern-card').innerHTML = `
    <h3>
      <span class="pattern-badge">日主${b.dayMaster}${b.dayMasterEle}</span>
      <span class="pattern-badge">${weakText}</span>
    </h3>
    <p>${b.dayMaster}${b.dayMasterEle}日主 — ${nature}。五行分布：木${b.elements['木']} 火${b.elements['火']} 土${b.elements['土']} 金${b.elements['金']} 水${b.elements['水']}。</p>
    <div class="lead">喜用：<strong style="color:#6b9a5c">${favText}</strong> ｜ 忌：<strong style="color:var(--red)">${unfavText}</strong></div>
    <p style="color:var(--gold);margin-top:12px;">📜 命理是参考，不是定数。了解自己的五行偏性，顺势而为即可。</p>
  `;

  // Interactions
  const ints = [];
  const p = b.pillars;
  // Check for 天干合
  for (let i=0;i<p.length;i++) {
    for (let j=i+1;j<p.length;j++) {
      const s1 = BaziCalc.STEMS.indexOf(p[i].stem);
      const s2 = BaziCalc.STEMS.indexOf(p[j].stem);
      const hePairs = [[0,5],[1,6],[2,7],[3,8],[4,9]];
      for (const [a,b] of hePairs) {
        if ((s1===a && s2===b) || (s1===b && s2===a)) {
          ints.push(`<div class="interaction-item he"><span class="ilabel">天干合</span> ${p[i].stem}${p[j].stem}合 — ${p[i].label}与${p[j].label}相合</div>`);
        }
      }
    }
  }
  // Check for 6合/6冲
  for (let i=0;i<p.length;i++) {
    for (let j=i+1;j<p.length;j++) {
      if (FortuneGen.analyzeDayInteraction && p[i].branch === LIU_HE_CHONG_check(p[j].branch, 'he')) {
        ints.push(`<div class="interaction-item he"><span class="ilabel">地支合</span> ${p[i].branch}${p[j].branch}六合 — ${p[i].label}与${p[j].label}</div>`);
      }
    }
  }
  function LIU_HE_CHONG_check(br, type) {
    const he = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};
    const chong = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
    return type === 'he' ? he[br] : chong[br];
  }
  // Add basic interactions
  for (let i=0;i<p.length;i++) {
    for (let j=i+1;j<p.length;j++) {
      if (LIU_HE_CHONG_check(p[i].branch, 'he') === p[j].branch) {
        ints.push(`<div class="interaction-item he"><span class="ilabel">六合</span> ${p[i].branch}${p[j].branch}六合 — ${p[i].label}与${p[j].label}</div>`);
      }
      if (LIU_HE_CHONG_check(p[i].branch, 'chong') === p[j].branch) {
        ints.push(`<div class="interaction-item chong"><span class="ilabel">六冲</span> ${p[i].branch}${p[j].branch}相冲 — ${p[i].label}与${p[j].label}</div>`);
      }
    }
  }
  document.getElementById('interactions').innerHTML = ints.length > 0 ? ints.join('') : '<div class="interaction-item">无特殊刑冲合会</div>';

  // Dayun
  const dg = document.getElementById('dayun-grid');
  dg.innerHTML = b.dayun.map((dy, i) => {
    const isCurrent = i === 1; // Simplified: second dayun is current for this demo
    return `<div class="dayun-cell${isCurrent ? ' current' : ''}">
      <div class="dy-pillar">${dy.stem}${dy.branch}</div>
      <div>${dy.range}岁</div>
    </div>`;
  }).join('');
}

// ====== RENDER DAILY FORTUNE ======
function renderDailyFortune() {
  if (!currentBazi) return;
  const today = FortuneGen.getTodayStemBranch();
  const analysis = FortuneGen.analyzeDayInteraction(currentBazi, today);
  const advice = FortuneGen.generateAdvice(currentBazi, analysis);

  const scoreStars = '★'.repeat(analysis.score) + '☆'.repeat(5 - analysis.score);
  const moodColors = { '极佳':'var(--green)','较佳':'var(--blue)','一般':'var(--gold)','稍低':'var(--purple)','注意':'var(--red)' };
  const moodColor = moodColors[analysis.mood] || 'var(--gold)';

  document.getElementById('daily-fortune-content').innerHTML = `
    <div class="week-summary">
      <h3 style="display:flex;justify-content:space-between;align-items:center;">
        <span>📅 ${today.date} 星期${today.weekday}</span>
        <span style="color:${moodColor};font-size:18px;">${scoreStars} <small>${analysis.mood}</small></span>
      </h3>
      <p style="color:var(--ink-soft);">今日干支：<strong style="color:var(--gold-bright)">${today.stem}${today.branch}</strong>
        （${today.stem}${analysis.dayElement}）· 十神：${analysis.tenGod}
        ${analysis.isFav ? '<span style="color:var(--green)">● 喜神</span>' : analysis.isUnfav ? '<span style="color:var(--red)">● 忌神</span>' : ''}
        ${analysis.chongDay ? '<span style="color:var(--red)">● 日支逢冲</span>' : ''}
        ${analysis.heDay ? '<span style="color:var(--green)">● 六合吉日</span>' : ''}
      </p>
    </div>

    <div class="suggestion-cards">
      ${advice.tips.map(t => `
        <div class="sug-card">
          <div class="sug-icon">${t.icon}</div>
          <h4>${t.category}</h4>
          <p>${t.text}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// ====== RENDER WEEKLY ======
function renderWeekly() {
  if (!currentBazi) return;
  const days = FortuneGen.getNextDays(7);
  const weekly = FortuneGen.generateWeeklySummary(currentBazi, days);

  document.getElementById('weekly-date-range').textContent =
    `${weekly.weekStart} — ${weekly.weekEnd}`;

  const moodColors = { '极佳':'#6b9a5c','较佳':'#4a7a9c','一般':'#d4af6e','稍低':'#8a6aa8','注意':'#c44a3c' };

  document.getElementById('weekly-content').innerHTML = `
    <div class="week-summary">
      <h3>📊 本周总览</h3>
      <p>平均运势：${'★'.repeat(Math.round(weekly.avgScore))}☆${'☆'.repeat(5-Math.round(weekly.avgScore))} · 最佳日：${
        weekly.bestDay ? `<strong style="color:var(--green)">${weekly.bestDay.date}（${weekly.bestDay.stem}${weekly.bestDay.branch}日）</strong>` : '—'
      } · 需注意：${
        weekly.worstDay ? `<strong style="color:var(--red)">${weekly.worstDay.date}（${weekly.worstDay.stem}${weekly.worstDay.branch}日）</strong>` : '—'
      }</p>
    </div>

    <div class="section">
      <div class="section-title">每日速览 <small>7-DAY PREVIEW</small></div>
      <div class="day-cards seven">
        ${weekly.days.map(({ day, analysis }) => `
          <div class="day-card">
            <div class="dc-date">${day.date}</div>
            <div class="dc-weekday">周${day.weekday}</div>
            <div class="dc-pillar">${day.stem}${day.branch}</div>
            <div class="dc-ten">${analysis.tenGod}${analysis.chongDay ? ' ⚡冲' : analysis.heDay ? ' 💫合' : ''}</div>
            <div class="dc-score ${analysis.score >= 4 ? 'great' : analysis.score >= 3 ? 'good' : analysis.score >= 2 ? 'fair' : 'caution'}">
              ${'★'.repeat(analysis.score)}${'☆'.repeat(5 - analysis.score)}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">本周行动建议 <small>WEEKLY TIPS</small></div>
      <div class="suggestion-cards">
        <div class="sug-card">
          <div class="sug-icon">📚</div>
          <h4>学业 / 工作重点</h4>
          <p>本周最佳日：${weekly.bestDay ? weekly.bestDay.date : '—'}——适合处理重要事务、做关键决策。${weekly.worstDay ? weekly.worstDay.date + '建议低调行事，避免冲动。' : ''}</p>
        </div>
        <div class="sug-card">
          <div class="sug-icon">🧘</div>
          <h4>情绪与健康</h4>
          <p>${currentBazi.isWeak ? '身弱喜补，' : ''}多接触${currentBazi.favorable.join('、')}元素的事物：穿对应颜色、朝向对应方位活动，有助于提升能量。</p>
        </div>
        <div class="sug-card">
          <div class="sug-icon">⭐</div>
          <h4>出行建议</h4>
          <p>${currentBazi.favorable[0] === '木' ? '东/东南' : currentBazi.favorable[0] === '火' ? '南' : currentBazi.favorable[0] === '土' ? '中/西南' : currentBazi.favorable[0] === '金' ? '西/西北' : '北'}方为幸运方位。出行优先选择此方向，可提升运势。</p>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">逐日出行建议 <small>DAILY TRAVEL</small></div>
      ${weekly.days.map(({ day, analysis }) => {
        const advice = FortuneGen.generateAdvice(currentBazi, analysis);
        const travelTip = advice.tips.find(t => t.category === '出行') || advice.tips[1];
        return `
        <div class="card" style="margin-bottom:10px;">
          <h3>
            <span style="color:${moodColors[analysis.mood]}">${'★'.repeat(analysis.score)}${'☆'.repeat(5-analysis.score)}</span>
            ${day.date} 周${day.weekday} · ${day.stem}${day.branch}日
          </h3>
          <p>${travelTip ? travelTip.text : '平稳之日，按计划出行即可。'}</p>
        </div>`;
      }).join('')}
    </div>
  `;
}
