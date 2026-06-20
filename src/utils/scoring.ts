import { DOMAINS, FACETS, QUESTIONS, type Domain } from '@/data/questions';

// ─── 类型定义 ───

export interface SubDimensionScores {
  [key: string]: number;
}

export interface DomainScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  subDimensions: SubDimensionScores;
}

export type PersonalityArchetype =
  | 'creative_explorer'    // 高O低C
  | 'steady_achiever'     // 低O高C
  | 'social_catalyst'     // 高E高A
  | 'quiet_strategist'    // 低E低N
  | 'empathic_healer'     // 高A高N
  | 'resilient_leader'    // 高E高C低N
  | 'free_spirit'         // 高O低C低A
  | 'reliable_guardian'   // 高C高A低O
  | 'intense_innovator'   // 高O高N
  | 'balanced_adaptor';   // 无极端维度

export interface ArchetypeResult {
  archetype: PersonalityArchetype;
  name: string;
  tagline: string;
  description: string;
  strengths: string[];
  watchouts: string[];
}

export interface CareerMatch {
  title: string;
  category: string;
  matchScore: number;
  reason: string;
}

export interface RelationshipDynamics {
  style: string;
  description: string;
  bestMatch: string[];
  challengeMatch: string[];
  tips: string[];
}

export interface FacetProfile {
  facet: string;
  name: string;
  score: number;
  level: 'very_low' | 'low' | 'average' | 'high' | 'very_high';
  interpretation: string;
}

export interface PersonalityModel {
  scores: DomainScores;
  archetype: ArchetypeResult;
  facetProfiles: FacetProfile[];
  careerMatches: CareerMatch[];
  relationshipDynamics: RelationshipDynamics;
  dominantTraits: string[];
  growthEdge: string;
}

// ─── BFI-2 常模数据（基于 Soto & John 2017 的大样本均值与标准差近似值） ───

const DOMAIN_NORMS: Record<Domain, { mean: number; sd: number }> = {
  O: { mean: 3.70, sd: 0.65 },
  C: { mean: 3.60, sd: 0.60 },
  E: { mean: 3.30, sd: 0.70 },
  A: { mean: 3.70, sd: 0.55 },
  N: { mean: 2.90, sd: 0.70 },
};

const FACET_NORMS: Record<string, { mean: number; sd: number }> = {
  aesthetic:     { mean: 3.50, sd: 0.80 },
  curiosity:     { mean: 3.80, sd: 0.70 },
  imagination:   { mean: 3.70, sd: 0.75 },
  organization:  { mean: 3.50, sd: 0.70 },
  productiveness:{ mean: 3.60, sd: 0.65 },
  responsibility:{ mean: 3.80, sd: 0.55 },
  sociability:   { mean: 3.20, sd: 0.75 },
  assertiveness: { mean: 3.10, sd: 0.70 },
  energy:        { mean: 3.40, sd: 0.65 },
  compassion:    { mean: 3.80, sd: 0.60 },
  respectfulness:{ mean: 3.90, sd: 0.50 },
  trust:         { mean: 3.50, sd: 0.65 },
  anxiety:       { mean: 2.80, sd: 0.75 },
  depression:    { mean: 2.60, sd: 0.70 },
  volatility:    { mean: 2.70, sd: 0.70 },
};

// ─── 正态分布 CDF（Abramowitz & Stegun 近似） ───

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1.0 / (1.0 + p * Math.abs(x));
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1.0 + sign * y);
}

/** 将原始均值转换为百分位分数 (0-100) */
function toPercentile(rawMean: number, norm: { mean: number; sd: number }): number {
  const z = (rawMean - norm.mean) / norm.sd;
  return Math.round(normalCDF(z) * 100);
}

// ─── 核心评分 ───

const DOMAIN_KEYS: Record<Domain, keyof Omit<DomainScores, 'subDimensions'>> = {
  O: 'openness',
  C: 'conscientiousness',
  E: 'extraversion',
  A: 'agreeableness',
  N: 'neuroticism',
};

export function rawScore(answer: number, reverse: boolean): number {
  return reverse ? 6 - answer : answer;
}

export function calculateScores(answers: Record<number, number>): DomainScores {
  const domainTotals: Record<Domain, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const domainCounts: Record<Domain, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const facetTotals: Record<string, number> = {};
  const facetCounts: Record<string, number> = {};

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (answer === undefined) continue;
    const score = rawScore(answer, q.reverse);
    domainTotals[q.domain] += score;
    domainCounts[q.domain] += 1;
    facetTotals[q.facet] = (facetTotals[q.facet] || 0) + score;
    facetCounts[q.facet] = (facetCounts[q.facet] || 1) + 1;
  }

  const scores: DomainScores = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0,
    subDimensions: {},
  };

  for (const domain of Object.keys(DOMAINS) as Domain[]) {
    const count = domainCounts[domain] || 1;
    const rawMean = domainTotals[domain] / count;
    scores[DOMAIN_KEYS[domain]] = toPercentile(rawMean, DOMAIN_NORMS[domain]);
  }

  for (const facetKey of Object.keys(facetTotals)) {
    const count = facetCounts[facetKey] || 1;
    const rawMean = facetTotals[facetKey] / count;
    const norm = FACET_NORMS[facetKey] || { mean: 3.0, sd: 0.7 };
    scores.subDimensions[facetKey] = toPercentile(rawMean, norm);
  }

  return scores;
}

export function getDomainScore(scores: DomainScores, domain: Domain): number {
  return scores[DOMAIN_KEYS[domain]];
}

export function getFacetScore(scores: DomainScores, facetKey: string): number {
  return scores.subDimensions[facetKey] || 0;
}

export function isComplete(answers: Record<number, number>): boolean {
  return QUESTIONS.every((q) => answers[q.id] !== undefined);
}

export function getAnsweredCount(answers: Record<number, number>): number {
  return QUESTIONS.filter((q) => answers[q.id] !== undefined).length;
}

// ─── 人格画像建模 ───

function getLevel(score: number): 'very_low' | 'low' | 'average' | 'high' | 'very_high' {
  if (score <= 15) return 'very_low';
  if (score <= 35) return 'low';
  if (score <= 65) return 'average';
  if (score <= 85) return 'high';
  return 'very_high';
}

function isHigh(score: number): boolean { return score > 60; }
function isLow(score: number): boolean { return score < 40; }

const ARCHETYPE_MAP: Record<PersonalityArchetype, Omit<ArchetypeResult, 'archetype'>> = {
  creative_explorer: {
    name: '创意探索者',
    tagline: '天马行空，自由生长',
    description: '你拥有丰富的想象力和对新鲜事物的强烈渴望，思维跳跃而富有创造性。你不喜欢被条条框框束缚，更愿意在开放的空间中探索可能性。你的挑战在于将创意落地——灵感很多，但持续执行需要额外的策略支持。',
    strengths: ['创意思维', '适应变化', '视野开阔', '好奇心驱动'],
    watchouts: ['容易分心', '计划执行困难', '可能忽视细节'],
  },
  steady_achiever: {
    name: '稳健成就者',
    tagline: '脚踏实地，步步为营',
    description: '你务实、自律、目标明确，擅长将计划转化为成果。你偏好稳定和可预测的环境，在执行层面表现出色。你的挑战在于跳出舒适区——有时需要拥抱不确定性，尝试非常规的解决方案。',
    strengths: ['执行力强', '可靠稳定', '注重细节', '目标导向'],
    watchouts: ['可能过于保守', '对变化适应较慢', '创造性思维有待激活'],
  },
  social_catalyst: {
    name: '社交催化剂',
    tagline: '连接人群，温暖驱动',
    description: '你外向且富有同理心，善于在人际间建立连接和营造氛围。你在团队中是天然的润滑剂，能让不同的人协作起来。你的挑战在于平衡付出与自我需求——过度关注他人可能让你忽略自己的边界。',
    strengths: ['人际连接', '团队凝聚', '情绪感染力', '冲突调解'],
    watchouts: ['过度迁就他人', '回避必要冲突', '社交疲劳'],
  },
  quiet_strategist: {
    name: '沉静策略家',
    tagline: '深思熟虑，精准出击',
    description: '你内敛而情绪稳定，擅长在安静中深入思考，做出冷静的判断。你不急于表达，但一旦开口往往切中要害。你的挑战在于提高可见度——你的能力需要被更多人看到，适度自我推广不是虚荣。',
    strengths: ['深度思考', '情绪稳定', '独立判断', '专注力强'],
    watchouts: ['可能被忽视', '社交网络有限', '需要主动表达'],
  },
  empathic_healer: {
    name: '共情疗愈者',
    tagline: '敏感心灵，深度连接',
    description: '你对他人的情感高度敏感，能够深入理解和共情他人的处境。这使你在助人领域有天然优势，但也让你更容易被他人的情绪所影响。你的挑战在于建立情绪边界——关心他人不应以牺牲自己的心理健康为代价。',
    strengths: ['深度共情', '情感洞察', '助人驱动', '直觉敏锐'],
    watchouts: ['情绪过载', '边界模糊', '自我牺牲倾向'],
  },
  resilient_leader: {
    name: '韧性领导者',
    tagline: '坚韧果敢，引领方向',
    description: '你外向、自律且情绪稳定，具备领导力的核心要素：能在压力下保持冷静，能主动推动团队前进，也能持续跟进执行。你的挑战在于倾听和包容——强势的领导风格有时会压制他人的声音。',
    strengths: ['抗压能力', '决策果断', '目标驱动', '团队引领'],
    watchouts: ['可能过于主导', '忽视他人感受', '控制倾向'],
  },
  free_spirit: {
    name: '自由灵魂',
    tagline: '不羁之心，独立前行',
    description: '你富有创造力和独立性，不喜欢被社会规范和他人期待所束缚。你追求真实和自由，有勇气走自己的路。你的挑战在于在自由与责任之间找到平衡——完全脱离规则可能让你失去重要的支持系统。',
    strengths: ['独立思考', '创新精神', '真实表达', '适应力强'],
    watchouts: ['合作困难', '承诺不稳定', '可能疏远他人'],
  },
  reliable_guardian: {
    name: '可靠守护者',
    tagline: '忠诚可靠，守护秩序',
    description: '你尽责、善良、尊重传统，是团队和家庭中最可靠的存在。你用行动而非言语表达关心，始终如一地履行责任。你的挑战在于接受变化和不确定性——世界不会总是按规则运行，灵活应对是一种力量。',
    strengths: ['忠诚可靠', '责任心强', '关心他人', '维护秩序'],
    watchouts: ['抗拒变化', '过度自我牺牲', '可能过于保守'],
  },
  intense_innovator: {
    name: '炽烈创新者',
    tagline: '燃烧灵感，敏感驱动',
    description: '你同时拥有高开放性和高情绪敏感性，这意味着你的创造力往往伴随着强烈的情感体验。许多艺术家和改革者属于这一类型。你的挑战在于情绪管理——将敏感转化为创作动力，而非让它消耗你。',
    strengths: ['创造性突破', '情感深度', '审美敏锐', '变革驱动'],
    watchouts: ['情绪波动大', '容易倦怠', '完美主义倾向'],
  },
  balanced_adaptor: {
    name: '平衡适应者',
    tagline: '灵活变通，中道而行',
    description: '你在各维度上相对均衡，没有极端倾向。这赋予你灵活适应不同环境和角色的能力——你可以在需要时外向，也可以安静独处；既能规划执行，也能即兴发挥。你的挑战在于找到独特的定位——全面是优势，但也可能缺少鲜明的辨识度。',
    strengths: ['适应力强', '视角平衡', '角色灵活', '情绪稳定'],
    watchouts: ['定位模糊', '可能随波逐流', '缺少突出优势'],
  },
};

function identifyArchetype(scores: DomainScores): ArchetypeResult {
  const O = scores.openness;
  const C = scores.conscientiousness;
  const E = scores.extraversion;
  const A = scores.agreeableness;
  const N = scores.neuroticism;

  let archetype: PersonalityArchetype = 'balanced_adaptor';

  // 优先匹配更具体的组合模式
  if (isHigh(O) && isLow(C) && isLow(A)) archetype = 'free_spirit';
  else if (isHigh(O) && isHigh(N)) archetype = 'intense_innovator';
  else if (isHigh(E) && isHigh(C) && isLow(N)) archetype = 'resilient_leader';
  else if (isHigh(E) && isHigh(A)) archetype = 'social_catalyst';
  else if (isHigh(A) && isHigh(N)) archetype = 'empathic_healer';
  else if (isHigh(O) && isLow(C)) archetype = 'creative_explorer';
  else if (isLow(O) && isHigh(C)) archetype = 'steady_achiever';
  else if (isLow(E) && isLow(N)) archetype = 'quiet_strategist';
  else if (isHigh(C) && isHigh(A) && isLow(O)) archetype = 'reliable_guardian';
  else if (isHigh(O) || isHigh(C) || isHigh(E) || isHigh(A) || isHigh(N)) {
    // 有突出维度但无明确组合模式，选最突出的维度组合
    const max = Math.max(O, C, E, A, N);
    if (max === O) archetype = isLow(C) ? 'creative_explorer' : 'intense_innovator';
    else if (max === C) archetype = isLow(O) ? 'steady_achiever' : 'resilient_leader';
    else if (max === E) archetype = isHigh(A) ? 'social_catalyst' : 'resilient_leader';
    else if (max === A) archetype = isHigh(N) ? 'empathic_healer' : 'reliable_guardian';
    else if (max === N) archetype = isHigh(O) ? 'intense_innovator' : 'empathic_healer';
  }

  const result = ARCHETYPE_MAP[archetype];
  return { archetype, ...result };
}

// ─── 子维度剖面分析 ───

const FACET_INTERPRETATIONS: Record<string, Record<string, string>> = {
  aesthetic: {
    very_low: '你对艺术和美感几乎没有特别的兴趣，更关注事物的功能性。',
    low: '你偶尔会欣赏美，但审美体验不是你生活的重要部分。',
    average: '你有一定的审美感受力，能在特定场合被艺术打动。',
    high: '你对美有敏锐的感知，艺术和自然之美常常让你感动。',
    very_high: '你拥有极其强烈的审美敏感度，美是你生活的核心驱动力之一。',
  },
  curiosity: {
    very_low: '你对抽象知识和新理论缺乏兴趣，偏好已知和确定的信息。',
    low: '你偶尔会好奇，但更倾向于使用已有的知识框架。',
    average: '你有适度的求知欲，会在需要时主动学习新知识。',
    high: '你对新知识充满好奇，喜欢探索复杂和深层的概念。',
    very_high: '你拥有近乎无止境的求知欲，深度思考是你最显著的特征之一。',
  },
  imagination: {
    very_low: '你非常务实，几乎不做白日梦，思维聚焦于现实。',
    low: '你偶尔会想象，但很快回到实际问题。',
    average: '你能在需要时发挥想象力，也能保持务实。',
    high: '你拥有活跃的想象力，常常能想到别人想不到的可能性。',
    very_high: '你的想象力极为丰富，几乎总在构思新的想法和可能性。',
  },
  organization: {
    very_low: '你的生活和工作环境常常混乱，很难保持条理。',
    low: '你偶尔会整理，但很难长期维持秩序。',
    average: '你有一定的条理性，能在需要时保持整洁。',
    high: '你注重秩序和整洁，环境通常井井有条。',
    very_high: '你极度注重条理，混乱的环境会让你明显不适。',
  },
  productiveness: {
    very_low: '你经常拖延，很难持续推进任务到完成。',
    low: '你在截止日期前能完成工作，但很少提前。',
    average: '你能完成大部分任务，效率时高时低。',
    high: '你高效且持续，很少拖延，能稳步推进目标。',
    very_high: '你极度高效，几乎从不拖延，持续产出是你的常态。',
  },
  responsibility: {
    very_low: '你经常忽视承诺，不太在意对他人的义务。',
    low: '你有时会食言，尤其在方便自己的时候。',
    average: '你通常会履行承诺，但偶尔会有例外。',
    high: '你非常可靠，几乎总是信守承诺。',
    very_high: '你极度重视责任，宁可牺牲自己也不辜负他人。',
  },
  sociability: {
    very_low: '你几乎不主动社交，独处是你的舒适区。',
    low: '你偏好小范围交往，大型社交场合让你疲惫。',
    average: '你能享受社交，但也需要独处时间恢复。',
    high: '你喜欢社交，在人群中感到充满能量。',
    very_high: '你是天生的社交者，几乎总在寻求人际互动。',
  },
  assertiveness: {
    very_low: '你几乎从不主动发言或主导，习惯跟随他人。',
    low: '你偶尔表达意见，但更愿意让别人做决定。',
    average: '你能在需要时表达观点，但不会主动争夺话语权。',
    high: '你乐于表达意见，能自信地主导讨论。',
    very_high: '你天生具有主导欲，几乎总是第一个发言和做决定的人。',
  },
  energy: {
    very_low: '你精力水平很低，经常感到疲倦，需要大量休息。',
    low: '你节奏较慢，偏好从容的步调。',
    average: '你有适度的精力，能在需要时加速。',
    high: '你精力充沛，喜欢快节奏和多线程活动。',
    very_high: '你几乎总是处于高能量状态，很难安静下来。',
  },
  compassion: {
    very_low: '你对他人的痛苦几乎无感，情感上较为冷漠。',
    low: '你能理解他人的感受，但不会强烈共鸣。',
    average: '你有适度的同理心，能在明显的情况下关心他人。',
    high: '你很容易感受到他人的情绪，并愿意伸出援手。',
    very_high: '你对他人的痛苦极为敏感，有时会因共情而自身受伤。',
  },
  respectfulness: {
    very_low: '你经常忽视他人的感受和观点，直言不讳到粗鲁的程度。',
    low: '你有时过于直接，可能无意中冒犯他人。',
    average: '你通常能保持礼貌，但在强烈意见时可能不够圆滑。',
    high: '你尊重他人，即使意见不同也能保持礼貌。',
    very_high: '你极度注重尊重和礼貌，几乎从不冒犯他人。',
  },
  trust: {
    very_low: '你几乎不信任任何人，总是怀疑他人的动机。',
    low: '你需要很长时间才能信任他人，倾向于怀疑。',
    average: '你持适度信任，相信他人但也保持警惕。',
    high: '你倾向于信任他人，认为大多数人本质善良。',
    very_high: '你几乎无条件信任他人，有时可能过于天真。',
  },
  anxiety: {
    very_low: '你几乎从不担忧，面对压力泰然自若。',
    low: '你很少焦虑，能在大多数情况下保持平静。',
    average: '你有适度的焦虑，能在压力下正常运作。',
    high: '你经常担忧，对压力和不确定性反应较强。',
    very_high: '你几乎总是处于焦虑状态，担忧严重影响日常生活。',
  },
  depression: {
    very_low: '你几乎从不感到低落，对生活持续满意。',
    low: '你偶尔会情绪低落，但恢复很快。',
    average: '你有正常的情绪波动，但总体积极。',
    high: '你较频繁地感到沮丧或自我怀疑。',
    very_high: '你经常深陷低落情绪，自我价值感波动剧烈。',
  },
  volatility: {
    very_low: '你的情绪极其稳定，几乎从不失控。',
    low: '你情绪平稳，很少发怒或情绪突变。',
    average: '你有正常的情绪反应，但能较快恢复。',
    high: '你情绪起伏较大，容易因小事而烦躁或激动。',
    very_high: '你情绪波动剧烈，可能在短时间内经历极端情绪变化。',
  },
};

function buildFacetProfiles(scores: DomainScores): FacetProfile[] {
  const profiles: FacetProfile[] = [];
  const domainOrder: Domain[] = ['O', 'C', 'E', 'A', 'N'];

  for (const domain of domainOrder) {
    for (const facet of FACETS[domain]) {
      const score = getFacetScore(scores, facet.key);
      const level = getLevel(score);
      const interpretations = FACET_INTERPRETATIONS[facet.key];
      const interpretation = interpretations?.[level] || `${facet.name}得分处于${level === 'average' ? '中等' : level === 'high' || level === 'very_high' ? '较高' : '较低'}水平。`;
      profiles.push({ facet: facet.key, name: facet.name, score, level, interpretation });
    }
  }

  return profiles;
}

// ─── 职业匹配引擎 ───

interface CareerProfile {
  title: string;
  category: string;
  ideal: Record<Domain, number>; // 理想百分位中位数
  tolerance: Record<Domain, number>; // 容差范围
  reason: string;
}

const CAREER_PROFILES: CareerProfile[] = [
  { title: '产品经理', category: '商业', ideal: { O: 70, C: 60, E: 65, A: 55, N: 35 }, tolerance: { O: 25, C: 20, E: 25, A: 25, N: 20 }, reason: '需要创意思维与执行力的平衡，以及跨部门沟通能力' },
  { title: 'UX 设计师', category: '设计', ideal: { O: 80, C: 55, E: 45, A: 65, N: 40 }, tolerance: { O: 20, C: 25, E: 25, A: 20, N: 25 }, reason: '高开放性驱动创新设计，同理心帮助理解用户需求' },
  { title: '软件工程师', category: '技术', ideal: { O: 60, C: 70, E: 35, A: 50, N: 30 }, tolerance: { O: 25, C: 20, E: 25, A: 25, N: 25 }, reason: '需要逻辑严谨和持续专注，独立工作能力比社交更重要' },
  { title: '数据科学家', category: '技术', ideal: { O: 65, C: 70, E: 30, A: 45, N: 25 }, tolerance: { O: 25, C: 20, E: 25, A: 25, N: 25 }, reason: '求知欲与严谨并重，独立深度分析是核心' },
  { title: '创业者', category: '商业', ideal: { O: 70, C: 60, E: 70, A: 40, N: 35 }, tolerance: { O: 20, C: 25, E: 20, A: 25, N: 25 }, reason: '需要创新、果断和抗压能力，低宜人性有助于艰难决策' },
  { title: '心理咨询师', category: '助人', ideal: { O: 60, C: 60, E: 55, A: 80, N: 45 }, tolerance: { O: 25, C: 20, E: 25, A: 15, N: 25 }, reason: '高同理心是核心，情绪敏感度帮助理解来访者' },
  { title: '教师/培训师', category: '教育', ideal: { O: 60, C: 65, E: 70, A: 70, N: 35 }, tolerance: { O: 25, C: 20, E: 20, A: 20, N: 20 }, reason: '表达力与耐心并重，需要持续的组织和输出' },
  { title: '销售总监', category: '商业', ideal: { O: 50, C: 65, E: 80, A: 55, N: 35 }, tolerance: { O: 25, C: 20, E: 15, A: 25, N: 20 }, reason: '高外向性和抗压能力是关键，目标导向驱动业绩' },
  { title: '科研人员', category: '学术', ideal: { O: 80, C: 75, E: 30, A: 50, N: 30 }, tolerance: { O: 15, C: 15, E: 25, A: 25, N: 25 }, reason: '深度好奇心与严谨方法论的结合，独立工作为主' },
  { title: '艺术家/设计师', category: '创意', ideal: { O: 85, C: 40, E: 45, A: 50, N: 50 }, tolerance: { O: 15, C: 25, E: 30, A: 25, N: 30 }, reason: '极高的开放性是创作核心，情绪敏感度可转化为创作动力' },
  { title: '项目经理', category: '管理', ideal: { O: 45, C: 80, E: 60, A: 60, N: 30 }, tolerance: { O: 25, C: 15, E: 20, A: 20, N: 20 }, reason: '高尽责性确保项目推进，沟通协调能力连接团队' },
  { title: '人力资源', category: '管理', ideal: { O: 50, C: 60, E: 65, A: 75, N: 35 }, tolerance: { O: 25, C: 20, E: 20, A: 15, N: 20 }, reason: '高宜人性与外向性帮助处理人际关系，条理性支持流程管理' },
  { title: '律师', category: '专业', ideal: { O: 50, C: 75, E: 55, A: 35, N: 35 }, tolerance: { O: 25, C: 15, E: 25, A: 20, N: 25 }, reason: '严谨的逻辑与低宜人性有助于对抗性辩论，尽责性确保准备充分' },
  { title: '医生', category: '医疗', ideal: { O: 55, C: 80, E: 50, A: 70, N: 25 }, tolerance: { O: 25, C: 15, E: 25, A: 20, N: 20 }, reason: '高尽责性确保诊断准确，同理心帮助患者沟通，情绪稳定应对压力' },
  { title: '内容创作者', category: '创意', ideal: { O: 75, C: 50, E: 55, A: 50, N: 45 }, tolerance: { O: 20, C: 25, E: 25, A: 25, N: 25 }, reason: '开放性驱动创意输出，适度外向性帮助内容传播' },
  { title: '财务分析师', category: '金融', ideal: { O: 40, C: 80, E: 35, A: 45, N: 25 }, tolerance: { O: 25, C: 15, E: 25, A: 25, N: 20 }, reason: '高尽责性与低神经质确保精确和冷静，独立分析为主' },
];

function calculateCareerMatches(scores: DomainScores): CareerMatch[] {
  const domainList: Domain[] = ['O', 'C', 'E', 'A', 'N'];
  const userScores: Record<Domain, number> = {
    O: scores.openness,
    C: scores.conscientiousness,
    E: scores.extraversion,
    A: scores.agreeableness,
    N: scores.neuroticism,
  };

  const matches = CAREER_PROFILES.map((career) => {
    let totalFit = 0;
    for (const d of domainList) {
      const diff = Math.abs(userScores[d] - career.ideal[d]);
      const tolerance = career.tolerance[d];
      // 在容差范围内得满分，超出则线性衰减
      const fit = diff <= tolerance ? 1 : Math.max(0, 1 - (diff - tolerance) / 30);
      totalFit += fit;
    }
    const matchScore = Math.round((totalFit / 5) * 100);
    return { title: career.title, category: career.category, matchScore, reason: career.reason };
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
}

// ─── 人际关系动力学 ───

function buildRelationshipDynamics(scores: DomainScores): RelationshipDynamics {
  const O = scores.openness;
  const C = scores.conscientiousness;
  const E = scores.extraversion;
  const A = scores.agreeableness;
  const N = scores.neuroticism;

  let style = '';
  let description = '';
  let bestMatch: string[] = [];
  let challengeMatch: string[] = [];
  let tips: string[] = [];

  if (isHigh(E) && isHigh(A)) {
    style = '温暖连接型';
    description = '你在关系中主动且体贴，善于营造亲密氛围，让伴侣感到被重视和照顾。';
    bestMatch = ['沉静策略家（互补你的外向）', '韧性领导者（匹配你的能量）'];
    challengeMatch = ['自由灵魂（可能让你觉得不可靠）', '炽烈创新者（情绪波动可能消耗你）'];
    tips = ['注意不要过度付出而忽略自身需求', '学会在关心他人的同时维护自己的边界', '接受不是所有人都能像你一样表达情感'];
  } else if (isHigh(E) && isLow(A)) {
    style = '强势主导型';
    description = '你在关系中直接且有主见，喜欢掌控节奏，不回避冲突。';
    bestMatch = ['可靠守护者（包容你的强势）', '共情疗愈者（软化你的棱角）'];
    challengeMatch = ['韧性领导者（两个强势可能碰撞）', '自由灵魂（都不愿妥协）'];
    tips = ['练习倾听——不是每次对话都需要赢', '在表达意见前先确认对方的感受', '偶尔放手让伴侣做决定'];
  } else if (isLow(E) && isHigh(A)) {
    style = '默默守护型';
    description = '你用行动而非言语表达爱，安静但可靠，是关系中的稳定力量。';
    bestMatch = ['社交催化剂（帮你拓展社交圈）', '韧性领导者（欣赏你的可靠）'];
    challengeMatch = ['自由灵魂（可能让你不安）', '创意探索者（生活节奏差异大）'];
    tips = ['尝试用言语表达你的感受，不要只靠行动', '主动提出你的需求，不要总是迁就对方', '独处是你的充电方式，让伴侣理解这一点'];
  } else if (isLow(E) && isLow(A)) {
    style = '独立自主型';
    description = '你在关系中保持高度独立，重视个人空间和自主权，不轻易妥协。';
    bestMatch = ['创意探索者（尊重彼此空间）', '沉静策略家（低维护的默契）'];
    challengeMatch = ['社交催化剂（需求差异太大）', '可靠守护者（可能觉得你不够在乎）'];
    tips = ['独立不等于冷漠，定期表达你的在乎', '学会在关键时刻做出妥协', '让伴侣知道你的独处不是逃避'];
  } else if (isHigh(N)) {
    style = '深度感受型';
    description = '你在关系中情感浓烈，对伴侣的言行高度敏感，容易因小事而受伤或感动。';
    bestMatch = ['可靠守护者（提供安全感）', '沉静策略家（情绪稳定缓冲）'];
    challengeMatch = ['自由灵魂（不可预测让你焦虑）', '强势主导型（可能忽视你的感受）'];
    tips = ['在情绪上头时暂停反应，给自己冷静的时间', '区分"对方做了什么"和"我感受到了什么"', '建立情绪调节工具箱：运动、书写、呼吸练习'];
  } else {
    style = '灵活适应型';
    description = '你在关系中相对灵活，能适应不同类型的伴侣，没有极端的需求或回避模式。';
    bestMatch = ['大多数类型（你的适应性是优势）', '与你价值观一致的任何类型'];
    challengeMatch = ['极端类型可能挑战你的耐心', '需要深度情感连接的类型可能觉得你不够投入'];
    tips = ['灵活性是优势，但也要有自己的底线', '主动表达你的偏好，不要总是随对方', '在关键问题上明确立场'];
  }

  return { style, description, bestMatch, challengeMatch, tips };
}

// ─── 主导特质与成长边缘 ───

function identifyDominantTraits(scores: DomainScores, facetProfiles: FacetProfile[]): string[] {
  const traits: { name: string; score: number }[] = [];

  // 维度层面
  const domainOrder: Domain[] = ['O', 'C', 'E', 'A', 'N'];
  const domainNames: Record<Domain, string> = { O: '开放性', C: '尽责性', E: '外向性', A: '宜人性', N: '情绪敏感' };
  for (const d of domainOrder) {
    const score = getDomainScore(scores, d);
    if (score > 65 || score < 35) {
      const prefix = score > 65 ? '高' : '低';
      traits.push({ name: `${prefix}${domainNames[d]}`, score: Math.abs(score - 50) });
    }
  }

  // 子维度层面——最突出的
  const extremeFacets = facetProfiles
    .filter((f) => f.level === 'very_high' || f.level === 'very_low')
    .map((f) => ({
      name: f.level === 'very_high' ? `极强${f.name}` : `极弱${f.name}`,
      score: Math.abs(f.score - 50),
    }));
  traits.push(...extremeFacets);

  return traits
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((t) => t.name);
}

function identifyGrowthEdge(scores: DomainScores, facetProfiles: FacetProfile[]): string {
  // 找到最低的子维度作为成长边缘
  const sorted = [...facetProfiles].sort((a, b) => a.score - b.score);
  const lowest = sorted[0];
  const domainMap: Record<string, Domain> = {};
  for (const d of ['O', 'C', 'E', 'A', 'N'] as Domain[]) {
    for (const f of FACETS[d]) {
      domainMap[f.key] = d;
    }
  }

  const growthMap: Record<string, string> = {
    aesthetic: '尝试每月参观一次展览或在日常中留意美的瞬间，培养审美感受力',
    curiosity: '每周花30分钟阅读一个你完全不了解的领域的文章，拓展认知边界',
    imagination: '练习头脑风暴或创意写作，即使不完美也允许自己天马行空',
    organization: '从一个小区域开始（如桌面），每天花5分钟保持整洁，逐步扩大',
    productiveness: '使用番茄工作法，从25分钟专注开始，逐步延长专注时间',
    responsibility: '从最小的承诺开始，每做到一个就记录下来，积累可靠感',
    sociability: '每周主动发起一次简短的社交互动，哪怕只是和同事聊5分钟',
    assertiveness: '在低风险场景中练习表达意见，如点餐时明确说出偏好',
    energy: '通过规律运动提升基础精力水平，从每天10分钟步行开始',
    compassion: '练习"复述倾听"——在对话中先复述对方的意思，再表达自己',
    respectfulness: '在意见不合时先说"我理解你的角度"，再表达不同意见',
    trust: '从小事开始给予信任，观察结果，逐步积累信任经验',
    anxiety: '建立"担忧时间"——每天限定15分钟专门处理焦虑，其余时间搁置',
    depression: '每天记录3件积极的小事，哪怕很微小，重建对生活的正向感知',
    volatility: '练习"6秒暂停"——情绪上头时深呼吸6秒再回应',
  };

  return growthMap[lowest.facet] || `你的${lowest.name}是当前最需要发展的领域，建议有针对性地练习和提升`;
}

// ─── 主入口：完整人格建模 ───

export function buildPersonalityModel(scores: DomainScores): PersonalityModel {
  const facetProfiles = buildFacetProfiles(scores);
  const archetype = identifyArchetype(scores);
  const careerMatches = calculateCareerMatches(scores);
  const relationshipDynamics = buildRelationshipDynamics(scores);
  const dominantTraits = identifyDominantTraits(scores, facetProfiles);
  const growthEdge = identifyGrowthEdge(scores, facetProfiles);

  return {
    scores,
    archetype,
    facetProfiles,
    careerMatches,
    relationshipDynamics,
    dominantTraits,
    growthEdge,
  };
}
