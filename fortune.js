/**
 * 每日运势与出行建议生成器
 * Daily Fortune & Travel Advice Generator
 */
const FortuneGen = (() => {
  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const ELEMENTS = BaziCalc.ELEMENTS;

  // 日干喜忌速查表
  const DAY_MASTER_TIPS = {
    '甲': { like:'水木', avoid:'金土', nature:'参天大树，喜阳光雨露' },
    '乙': { like:'水木', avoid:'金土', nature:'藤萝花草，喜依附生长' },
    '丙': { like:'木火', avoid:'水金', nature:'太阳之火，喜光明普照' },
    '丁': { like:'木火', avoid:'水土', nature:'烛光星火，喜持续添油' },
    '戊': { like:'火土', avoid:'木水', nature:'城墙厚土，喜稳重坚固' },
    '己': { like:'火土', avoid:'木水', nature:'田园之土，喜滋养培育' },
    '庚': { like:'土金', avoid:'火木', nature:'刀斧之金，喜锤炼成器' },
    '辛': { like:'土金', avoid:'火木', nature:'珠玉之金，喜精雕细琢' },
    '壬': { like:'金水', avoid:'土木', nature:'江河之水，喜奔流不息' },
    '癸': { like:'金水', avoid:'土木', nature:'雨露之水，喜润物无声' }
  };

  // 6合: 子丑 寅亥 卯戌 辰酉 巳申 午未
  const LIU_HE = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' };
  // 6冲: 子午 丑未 寅申 卯酉 辰戌 巳亥
  const LIU_CHONG = { '子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳' };

  function getTodayStemBranch() {
    const ref = new Date(2024, 0, 1);
    const today = new Date();
    const diff = Math.round((today - ref) / 86400000);
    const ci = ((diff % 60) + 60) % 60;
    return {
      stem: STEMS[ci % 10], branch: BRANCHES[ci % 12],
      stemIdx: ci % 10, branchIdx: ci % 12,
      date: `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`,
      weekday: ['日','一','二','三','四','五','六'][today.getDay()]
    };
  }

  function getNextDays(count) {
    const days = [];
    const ref = new Date(2024, 0, 1);
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const diff = Math.round((d - ref) / 86400000);
      const ci = ((diff % 60) + 60) % 60;
      days.push({
        stem: STEMS[ci % 10], branch: BRANCHES[ci % 12],
        stemIdx: ci % 10, branchIdx: ci % 12,
        date: `${d.getMonth()+1}/${d.getDate()}`,
        fullDate: `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`,
        weekday: ['日','一','二','三','四','五','六'][d.getDay()]
      });
    }
    return days;
  }

  function analyzeDayInteraction(bazi, dayInfo) {
    const ds = dayInfo.stem;
    const db = dayInfo.branch;
    const dm = bazi.dayMaster;
    const dms = bazi.dayStemIdx;
    const dmb = bazi.dayBranchIdx;
    const dayEle = ELEMENTS[ds];
    const dmEle = bazi.dayMasterEle;

    // 日干与当日天干的关系
    const tenGod = BaziCalc.getTenGods(dms, dayInfo.stemIdx);
    // 日支与当日地支的关系
    const chong = LIU_CHONG[bazi.pillars[2].branch] === db;
    const he = LIU_HE[bazi.pillars[2].branch] === db;
    const chongNian = LIU_CHONG[bazi.pillars[0].branch] === db;

    // 喜忌判断
    const isFav = bazi.favorable.includes(dayEle);
    const isUnfav = bazi.unfavorable.includes(dayEle);

    let score = 3;
    let mood = '一般';

    if (isFav && !chong) { score = 4; mood = '较佳'; }
    if (isFav && he) { score = 5; mood = '极佳'; }
    if (isUnfav && chong) { score = 1; mood = '注意'; }
    if (isUnfav) { score = Math.max(1, score - 1); mood = '稍低'; }
    if (chongNian) { score = Math.max(1, score - 1); }
    if (tenGod.includes('印') && isFav) { score = Math.min(5, score + 1); mood = '较佳'; }

    return {
      dayStem: ds, dayBranch: db, dayElement: dayEle,
      tenGod, isFav, isUnfav,
      chongDay: chong, heDay: he, chongYear: chongNian,
      score, mood
    };
  }

  function generateAdvice(bazi, analysis) {
    const tips = [];
    const dm = bazi.dayMaster;
    const base = DAY_MASTER_TIPS[dm];

    // 出行方向
    const dirMap = { '木':'东/东南','火':'南','土':'中/西南','金':'西/西北','水':'北' };
    const favDirs = bazi.favorable.map(e => dirMap[e]).filter(Boolean);
    const avoidDir = analysis.isUnfav ? dirMap[analysis.dayElement] : null;

    // 今日建议
    if (analysis.score >= 4) {
      tips.push({
        category: '运势',
        icon: '🌟',
        text: `今天${analysis.dayStem}${analysis.dayBranch}日是难得的顺遂之日，${analysis.tenGod}为喜，适合推进重要事务。`
      });
      tips.push({
        category: '出行',
        icon: '🚗',
        text: `宜向${favDirs[0] || '东'}方出行，事半功倍。适合外出社交、短途旅行。`
      });
    } else if (analysis.score >= 3) {
      tips.push({
        category: '运势',
        icon: '☀️',
        text: `今天${analysis.dayStem}${analysis.dayBranch}日平稳，${analysis.tenGod}入命，宜按部就班推进日常事务。`
      });
      tips.push({
        category: '出行',
        icon: '🚶',
        text: `出行无大碍，${favDirs[0] ? '偏向' + favDirs[0] + '方活动更佳' : '随心而行即可'}。注意交通安全。`
      });
    } else {
      tips.push({
        category: '运势',
        icon: '🌧️',
        text: `今天${analysis.dayStem}${analysis.dayBranch}日${analysis.tenGod}为忌${
          analysis.chongDay ? '，且日支逢冲' : ''
        }，宜低调行事，避免冲动决策。`
      });
      tips.push({
        category: '出行',
        icon: '⚠️',
        text: `出行宜谨慎，${avoidDir ? '避免向' + avoidDir + '方远行' : '减少不必要的奔波'}。适合在家充电、复盘总结。`
      });
    }

    if (analysis.chongYear) {
      tips.push({
        category: '提醒',
        icon: '🔔',
        text: '今日与年柱相冲，注意与长辈沟通、或涉及房屋/合同事宜宜多留个心眼。'
      });
    }

    if (analysis.heDay) {
      tips.push({
        category: '桃花',
        icon: '💫',
        text: '今日日支与命局六合，人际关系融洽，桃花运或贵人运较旺。'
      });
    }

    // 能量建议
    const eleColors = { '木':'绿色/青色','火':'红色/紫色','土':'黄色/棕色','金':'白色/银色','水':'蓝色/黑色' };
    tips.push({
      category: '穿搭',
      icon: '👗',
      text: `今日幸运色：${
        bazi.favorable.map(e => eleColors[e]).join('、')
      }。穿搭中加入这些颜色有助于提升气场。`
    });

    return {
      tips,
      favDirections: favDirs,
      avoidDirection: avoidDir,
      luckyColors: bazi.favorable.map(e => eleColors[e])
    };
  }

  function generateWeeklySummary(bazi, days) {
    let bestDay = null, worstDay = null;
    let bestScore = 0, worstScore = 6;

    const dailyAnalysis = days.map(d => {
      const analysis = analyzeDayInteraction(bazi, d);
      if (analysis.score > bestScore) { bestScore = analysis.score; bestDay = { ...d, ...analysis }; }
      if (analysis.score < worstScore) { worstScore = analysis.score; worstDay = { ...d, ...analysis }; }
      return { day: d, analysis };
    });

    return {
      days: dailyAnalysis,
      bestDay,
      worstDay,
      avgScore: Math.round(dailyAnalysis.reduce((s, d) => s + d.analysis.score, 0) / dailyAnalysis.length * 10) / 10,
      weekStart: days[0]?.fullDate || '',
      weekEnd: days[days.length-1]?.fullDate || ''
    };
  }

  return {
    getTodayStemBranch,
    getNextDays,
    analyzeDayInteraction,
    generateAdvice,
    generateWeeklySummary,
    DAY_MASTER_TIPS
  };
})();

if (typeof module !== 'undefined') module.exports = FortuneGen;
