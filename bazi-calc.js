/**
 * 八字排盘 · 客户端计算引擎
 * Ba Zi Calculator — Client-side
 * 参考日期: 2024-01-01 = 甲子日 (cycle index 0)
 */
const BaziCalc = (() => {
  const STEMS  = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const ELEMENTS = {
    '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土',
    '庚':'金','辛':'金','壬':'水','癸':'水',
    '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
    '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
  };
  const HIDDEN_STEMS = {
    '子':['癸'], '丑':['己','癸','辛'], '寅':['甲','丙','戊'],
    '卯':['乙'], '辰':['戊','乙','癸'], '巳':['丙','庚','戊'],
    '午':['丁','己'], '未':['己','丁','乙'], '申':['庚','壬','戊'],
    '酉':['辛'], '戌':['戊','辛','丁'], '亥':['壬','甲']
  };
  const ZODIAC = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  const NAYIN = [
    '海中金','炉中火','大林木','路旁土','剑锋金','山头火',
    '涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土',
    '霹雳火','松柏木','流年水','砂石金','山下火','平地木',
    '壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金',
    '桑柘木','大溪水','沙中土','天上火','石榴木','大海水'
  ];
  const TWELVE_STAGES = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
  const TWELVE_STAGE_START = {
    '甲':0,'乙':6,'丙':5,'丁':4,'戊':5,'己':6,'庚':2,'辛':1,'壬':8,'癸':7
  };

  // 十二节: 小寒 立春 惊蛰 清明 立夏 芒种 小暑 立秋 白露 寒露 立冬 大雪 (每月起始)
  // [month, day] — 近似值，精度足够排月柱
  const SOLAR_TERM_DATES = [
    [1,6],[2,4],[3,6],[4,5],[5,6],[6,6],
    [7,7],[8,8],[9,8],[10,8],[11,7],[12,7]
  ];
  // 对应的月支 (按节序: 丑寅卯辰巳午未申酉戌亥子)
  const TERM_BRANCHES = ['丑','寅','卯','辰','巳','午','未','申','酉','戌','亥','子'];

  function getMonthBranch(month, day) {
    // 从最后一个节往前找，找到第一个 <= (month,day) 的节
    for (let i = 11; i >= 0; i--) {
      const [tm, td] = SOLAR_TERM_DATES[i];
      if (month > tm || (month === tm && day >= td)) {
        return { branch: TERM_BRANCHES[i], termIdx: i };
      }
    }
    return { branch: '丑', termIdx: 0 }; // 默认小寒之前 = 丑月
  }

  function yearPillar(year) {
    const n = year - 4;
    const s = STEMS[n % 10];
    const b = BRANCHES[n % 12];
    const ni = (n % 60 + 60) % 60;
    const ns = ni % 30; // 纳音每30一轮
    const nayinIdx = Math.floor(ns / 2);
    return { stem: s, branch: b, stemIdx: n%10, branchIdx: n%12,
      zodiac: ZODIAC[n%12], nayin: NAYIN[nayinIdx] };
  }

  function monthPillar(yearStemIdx, month, day) {
    const { branch, termIdx } = getMonthBranch(month, day);
    const branchIdx = BRANCHES.indexOf(branch);
    // 月干: 从寅月开始排。甲己→丙寅, 乙庚→戊寅, 丙辛→庚寅, 丁壬→壬寅, 戊癸→甲寅
    const headStems = [2,4,6,8,0]; // 丙=2, 戊=4, 庚=6, 壬=8, 甲=0 (for 甲己=0, 乙庚=1, etc.)
    const yHead = yearStemIdx % 5; // 0=甲己, 1=乙庚, 2=丙辛, 3=丁壬, 4=戊癸
    // termIdx 0=小寒(丑月), 8=寒露(戌月), 9=立冬(亥月), etc.
    // 寅月 = termIdx 1, so month index from 寅 = termIdx - 1 (with wrap)
    const idxFromYin = (termIdx - 1 + 12) % 12;
    const stemIdx = (headStems[yHead] + idxFromYin) % 10;
    return {
      stem: STEMS[stemIdx], branch,
      stemIdx, branchIdx,
      nayin: NAYIN[Math.floor((((stemIdx % 5) * 12 + branchIdx) % 30) / 2)]
    };
  }

  function dayPillar(year, month, day) {
    // 2024-01-01 = 甲子 (cycle 0)
    const ref = new Date(2024, 0, 1);
    const target = new Date(year, month - 1, day);
    const diff = Math.round((target - ref) / 86400000);
    const ci = ((diff % 60) + 60) % 60;
    const si = ci % 10;
    const bi = ci % 12;
    const ns = ci % 30;
    const nayinIdx = Math.floor(ns / 2);
    return {
      stem: STEMS[si], branch: BRANCHES[bi],
      stemIdx: si, branchIdx: bi,
      nayin: NAYIN[nayinIdx]
    };
  }

  function hourPillar(dayStemIdx, hour) {
    // 23-1=子(0), 1-3=丑(1), ... 21-23=亥(11)
    const bi = Math.floor(((hour + 1) % 24) / 2);
    // 时干规则: 甲己还加甲
    const headMap = [0,2,4,6,8];
    const si = (headMap[dayStemIdx % 5] + bi) % 10;
    return { stem: STEMS[si], branch: BRANCHES[bi], stemIdx: si, branchIdx: bi };
  }

  function getTenGods(dayStemIdx, pillarStemIdx) {
    const diff = (pillarStemIdx - dayStemIdx + 10) % 10;
    const sameEle = ELEMENTS[STEMS[dayStemIdx]] === ELEMENTS[STEMS[pillarStemIdx]];
    // 生克关系: 0=同, 1=我生, 2=我克, 3=克我, 4=生我
    const relMap = [
      [0,1,2,3,4],  // 木 vs 木火土金水
      [4,0,1,2,3],  // 火 vs 木火土金水
      [3,4,0,1,2],  // 土 vs 木火土金水
      [2,3,4,0,1],  // 金 vs 木火土金水
      [1,2,3,4,0]   // 水 vs 木火土金水
    ];
    const dayEleIdx = ['木','火','土','金','水'].indexOf(ELEMENTS[STEMS[dayStemIdx]]);
    const pilEleIdx = ['木','火','土','金','水'].indexOf(ELEMENTS[STEMS[pillarStemIdx]]);
    const rel = relMap[dayEleIdx][pilEleIdx];
    const yinYang = (diff % 2 === 0) ? '阳' : '阴';
    const godMap = {
      0: ['比肩','劫财'], 1: ['食神','伤官'], 2: ['偏财','正财'],
      3: ['七杀','正官'], 4: ['偏印','正印']
    };
    return godMap[rel][sameEle ? 0 : 1];
  }

  function getStage(dayStem, branchIdx) {
    const start = TWELVE_STAGE_START[dayStem];
    let idx = (branchIdx - start + 12) % 12;
    return TWELVE_STAGES[idx];
  }

  function countElements(pillars) {
    const counts = { '木':0,'火':0,'土':0,'金':0,'水':0 };
    pillars.forEach(p => {
      counts[ELEMENTS[p.stem]] = (counts[ELEMENTS[p.stem]] || 0) + 1;
      counts[ELEMENTS[p.branch]] = (counts[ELEMENTS[p.branch]] || 0) + 1;
    });
    return counts;
  }

  function calcDayun(gender, yearStemIdx, yearBranchIdx, monthBranchIdx) {
    // 阳男阴女顺排，阴男阳女排
    const yangStems = [0,2,4,6,8]; // 甲丙戊庚壬
    const isYang = yangStems.includes(yearStemIdx % 10);
    const forward = (gender === 1 && isYang) || (gender === 0 && !isYang);
    const startAge = 3; // Simplified
    const dayuns = [];
    for (let i = 0; i < 10; i++) {
      const offset = forward ? i : -i;
      const si = ((monthBranchIdx + 1) % 12 + offset + 12) % 12;
      const bi = ((si + 6) % 12 + 12) % 12;
      dayuns.push({
        stem: STEMS[si], branch: BRANCHES[bi],
        age: startAge + i * 10,
        range: `${startAge + i*10}–${startAge + (i+1)*10 - 1}`
      });
    }
    return dayuns;
  }

  function calculate(params) {
    const { year, month, day, hour, gender } = params; // gender: 0=女, 1=男
    const yp = yearPillar(year);
    const mp = monthPillar(yp.stemIdx, month, day);
    const dp = dayPillar(year, month, day);
    const hp = hourPillar(dp.stemIdx, hour);

    const pillars = [
      { label:'年柱', ...yp, tenGod: getTenGods(dp.stemIdx, yp.stemIdx), stage: getStage(dp.stem, yp.branchIdx), hidden: HIDDEN_STEMS[yp.branch] },
      { label:'月柱', ...mp, tenGod: getTenGods(dp.stemIdx, mp.stemIdx), stage: getStage(dp.stem, mp.branchIdx), hidden: HIDDEN_STEMS[mp.branch] },
      { label:'日柱', ...dp, tenGod: '日主', stage: getStage(dp.stem, dp.branchIdx), hidden: HIDDEN_STEMS[dp.branch], isDay: true },
      { label:'时柱', ...hp, tenGod: getTenGods(dp.stemIdx, hp.stemIdx), stage: getStage(dp.stem, hp.branchIdx), hidden: HIDDEN_STEMS[hp.branch] }
    ];

    const elements = countElements(pillars);
    const dayun = calcDayun(gender, yp.stemIdx, yp.branchIdx, mp.branchIdx);
    const zodiac = ZODIAC[yp.branchIdx];

    // 喜用神判断: 看日主五行被扶/被克泄耗的比例
    const dayEle = ELEMENTS[dp.stem];
    const shengWoMap = { '木':'水','火':'木','土':'火','金':'土','水':'金' };
    const woShengMap = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
    const keWoMap   = { '木':'金','火':'水','土':'木','金':'火','水':'土' };
    const shengWo = shengWoMap[dayEle];   // 生我
    const woSheng = woShengMap[dayEle];   // 我生
    const keWo = keWoMap[dayEle];         // 克我
    const support = (elements[shengWo]||0) + (elements[dayEle]||0);
    const drain   = (elements[woSheng]||0) + (elements[keWo]||0) + (elements[dayEle==='木'?'金':dayEle==='火'?'水':dayEle==='土'?'木':dayEle==='金'?'火':'土']||0);
    // 简化版: 克泄耗都算 drain (我克 + 克我 + 我生)
    const weakenElements = new Set([
      woShengMap[dayEle],           // 我生 (泄)
      keWoMap[dayEle],              // 克我 (杀)
      dayEle==='木'?'金':dayEle==='火'?'水':dayEle==='土'?'木':dayEle==='金'?'火':'土'  // 我克 (耗)
    ]);
    const drainTotal = [...weakenElements].reduce((s,e) => s + (elements[e]||0), 0);
    const isWeak = support < drainTotal;
    const shengWo2 = { '木':'水','火':'木','土':'火','金':'土','水':'金' };
    const favorable = isWeak ? [shengWo2[dayEle], dayEle] : ['土','金','水']; // generalized
    const unfavorable = isWeak
      ? ['木','火','土','金','水'].filter(e => e !== shengWo2[dayEle] && e !== dayEle).slice(0,3)
      : ['木','火'].filter(e => e !== dayEle);

    return {
      pillars, elements, dayun, zodiac,
      dayMaster: dp.stem, dayMasterEle: dayEle,
      dayStemIdx: dp.stemIdx, dayBranchIdx: dp.branchIdx,
      yearStemIdx: yp.stemIdx, yearBranchIdx: yp.branchIdx,
      monthBranchIdx: mp.branchIdx,
      favorable, unfavorable, isWeak,
      gender, birth: { year, month, day, hour }
    };
  }

  return { calculate, STEMS, BRANCHES, ELEMENTS, HIDDEN_STEMS, ZODIAC, getTenGods };
})();

if (typeof module !== 'undefined') module.exports = BaziCalc;
