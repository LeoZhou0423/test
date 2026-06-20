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
  celebrityMatches: CelebrityMatch[];
  emotionalProfile: EmotionalProfile;
  cognitiveStyle: CognitiveStyle;
  stressResponse: StressResponse;
  decisionStyle: DecisionStyle;
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

// ─── 名人匹配引擎 ───

export interface CelebrityMatch {
  name: string;
  title: string;       // 身份标签
  field: string;       // 领域
  similarity: number;  // 相似度 0-100
  reason: string;      // 相似原因
  quote: string;       // 名言
}

interface CelebrityProfile {
  name: string;
  title: string;
  field: string;
  profile: Record<Domain, number>; // 估计的百分位
  quote: string;
}

// 基于公开人格研究、传记分析和专家评估的估计值
const CELEBRITY_PROFILES: CelebrityProfile[] = [
  { name: '爱因斯坦', title: '理论物理学家', field: '科学', profile: { O: 95, C: 70, E: 25, A: 45, N: 40 }, quote: '想象力比知识更重要' },
  { name: '达芬奇', title: '文艺复兴全才', field: '艺术/科学', profile: { O: 98, C: 55, E: 35, A: 50, N: 45 }, quote: '学习永不厌倦' },
  { name: '乔布斯', title: '科技企业家', field: '科技', profile: { O: 85, C: 65, E: 75, A: 25, N: 55 }, quote: '保持饥饿，保持愚蠢' },
  { name: '居里夫人', title: '物理/化学家', field: '科学', profile: { O: 80, C: 90, E: 20, A: 60, N: 35 }, quote: '生活中没有什么可怕的东西，只有需要理解的东西' },
  { name: '甘地', title: '非暴力抗争领袖', field: '政治', profile: { O: 65, C: 75, E: 55, A: 95, N: 30 }, quote: '成为你想在世界上看到的改变' },
  { name: '奥普拉', title: '媒体女王', field: '媒体', profile: { O: 70, C: 70, E: 90, A: 80, N: 45 }, quote: '把你受伤的经历变成智慧' },
  { name: '马斯克', title: '科技企业家', field: '科技', profile: { O: 90, C: 75, E: 70, A: 30, N: 60 }, quote: '当某件事足够重要，你就去做它，即使胜算不大' },
  { name: '梵高', title: '后印象派画家', field: '艺术', profile: { O: 95, C: 40, E: 25, A: 55, N: 85 }, quote: '我梦想着绘画，然后我画下了我的梦' },
  { name: '曼德拉', title: '反种族隔离领袖', field: '政治', profile: { O: 60, C: 80, E: 65, A: 85, N: 25 }, quote: '勇敢不是没有恐惧，而是战胜恐惧' },
  { name: '贝多芬', title: '作曲家', field: '音乐', profile: { O: 90, C: 70, E: 35, A: 30, N: 75 }, quote: '我要扼住命运的咽喉' },
  { name: '特蕾莎修女', title: '人道主义者', field: '慈善', profile: { O: 45, C: 80, E: 50, A: 95, N: 40 }, quote: '我们无法做伟大的事，只能用伟大的爱做小事' },
  { name: '达尔文', title: '生物学家', field: '科学', profile: { O: 85, C: 85, E: 20, A: 65, N: 50 }, quote: '存活下来的物种不是最强壮的，也不是最聪明的，而是最能适应变化的' },
  { name: '毕加索', title: '现代艺术先驱', field: '艺术', profile: { O: 95, C: 50, E: 70, A: 25, N: 55 }, quote: '每个孩子都是艺术家，问题是如何在长大后仍保持' },
  { name: '巴菲特', title: '投资家', field: '金融', profile: { O: 50, C: 90, E: 55, A: 65, N: 20 }, quote: '别人贪婪时我恐惧，别人恐惧时我贪婪' },
  { name: '弗洛伊德', title: '精神分析创始人', field: '心理学', profile: { O: 85, C: 75, E: 40, A: 35, N: 60 }, quote: '梦是通往潜意识的皇家大道' },
  { name: '马拉拉', title: '教育活动家', field: '社会运动', profile: { O: 65, C: 80, E: 70, A: 85, N: 40 }, quote: '一个孩子、一位教师、一本书和一支笔可以改变世界' },
  { name: '图灵', title: '计算机科学之父', field: '科学', profile: { O: 90, C: 80, E: 15, A: 45, N: 55 }, quote: '有时候正是那些无人看好的人，成就了无人能及的成就' },
  { name: '可可·香奈儿', title: '时尚设计师', field: '时尚', profile: { O: 80, C: 70, E: 60, A: 25, N: 50 }, quote: '时尚易逝，风格永存' },
  { name: '霍金', title: '理论物理学家', field: '科学', profile: { O: 90, C: 75, E: 30, A: 55, N: 35 }, quote: '无论生活看起来有多糟糕，总有你能做并且成功的事' },
  { name: '林肯', title: '美国总统', field: '政治', profile: { O: 60, C: 70, E: 55, A: 75, N: 55 }, quote: '我走得很慢，但我从不后退' },
];

function matchCelebrities(scores: DomainScores): CelebrityMatch[] {
  const domainList: Domain[] = ['O', 'C', 'E', 'A', 'N'];
  const userScores: Record<Domain, number> = {
    O: scores.openness,
    C: scores.conscientiousness,
    E: scores.extraversion,
    A: scores.agreeableness,
    N: scores.neuroticism,
  };

  const matches = CELEBRITY_PROFILES.map((celeb) => {
    // 欧氏距离计算相似度
    let sumSqDiff = 0;
    let closestDomain: Domain = 'O';
    let closestDiff = Infinity;

    for (const d of domainList) {
      const diff = userScores[d] - celeb.profile[d];
      sumSqDiff += diff * diff;
      if (Math.abs(diff) < closestDiff) {
        closestDiff = Math.abs(diff);
        closestDomain = d;
      }
    }

    // 将欧氏距离转换为相似度分数 (0-100)
    // 最大可能距离 ≈ sqrt(5 * 100^2) ≈ 223.6
    const maxDist = 223.6;
    const similarity = Math.round(Math.max(0, (1 - Math.sqrt(sumSqDiff) / maxDist) * 100));

    // 生成相似原因
    const domainNames: Record<Domain, string> = { O: '开放性', C: '尽责性', E: '外向性', A: '宜人性', N: '情绪敏感性' };
    const closeTraits: string[] = [];
    for (const d of domainList) {
      if (Math.abs(userScores[d] - celeb.profile[d]) <= 15) {
        const level = userScores[d] > 60 ? '高' : userScores[d] < 40 ? '低' : '中等';
        closeTraits.push(`${level}${domainNames[d]}`);
      }
    }
    const reason = closeTraits.length > 0
      ? `你们在${closeTraits.join('、')}上高度相似`
      : `你们的人格结构有相似的轮廓模式`;

    return {
      name: celeb.name,
      title: celeb.title,
      field: celeb.field,
      similarity,
      reason,
      quote: celeb.quote,
    };
  });

  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

// ─── 情绪效价分析 ───

export interface EmotionalProfile {
  positivity: number;        // 正面情绪倾向 0-100
  negativity: number;        // 负面情绪倾向 0-100
  emotionalRange: number;    // 情绪波动幅度 0-100
  emotionalResilience: number; // 情绪恢复力 0-100
  dominantEmotion: string;   // 主导情绪基调
  emotionalPattern: string;  // 情绪模式描述
  emotionalStrengths: string[];  // 情绪优势
  emotionalChallenges: string[]; // 情绪挑战
}

function buildEmotionalProfile(scores: DomainScores, facetProfiles: FacetProfile[]): EmotionalProfile {
  const N = scores.neuroticism;
  const E = scores.extraversion;
  const A = scores.agreeableness;
  const O = scores.openness;

  // 正面情绪倾向：高E高A低N → 高正面性
  const positivity = Math.round(
    Math.min(100, Math.max(0,
      30 + (E - 50) * 0.35 + (A - 50) * 0.25 + (50 - N) * 0.4
    ))
  );

  // 负面情绪倾向：高N低E → 高负面性
  const negativity = Math.round(
    Math.min(100, Math.max(0,
      30 + (N - 50) * 0.45 + (50 - E) * 0.2 + (50 - A) * 0.1
    ))
  );

  // 情绪波动幅度：高N高O → 大波动
  const emotionalRange = Math.round(
    Math.min(100, Math.max(0,
      30 + (N - 50) * 0.35 + (O - 50) * 0.2 + Math.abs(E - 50) * 0.15
    ))
  );

  // 情绪恢复力：低N高C高E → 高恢复力
  const emotionalResilience = Math.round(
    Math.min(100, Math.max(0,
      50 + (50 - N) * 0.4 + (scores.conscientiousness - 50) * 0.2 + (E - 50) * 0.15
    ))
  );

  // 主导情绪基调
  let dominantEmotion = '';
  let emotionalPattern = '';
  const emotionalStrengths: string[] = [];
  const emotionalChallenges: string[] = [];

  if (N > 65 && E < 40) {
    dominantEmotion = '内省忧郁型';
    emotionalPattern = '你的情绪世界深沉而内敛，倾向于在内心消化情感体验。你比大多数人更容易感受到焦虑和忧伤，但这同时也赋予你深度的情感洞察力。你的情绪像深海——表面平静，内里暗流涌动。';
    emotionalStrengths.push('深度情感体验', '丰富的内在世界', '艺术感受力强');
    emotionalChallenges.push('容易陷入负面情绪循环', '情绪恢复较慢', '可能过度内化他人情绪');
  } else if (N > 65 && E > 60) {
    dominantEmotion = '激情澎湃型';
    emotionalPattern = '你同时拥有高情绪敏感性和强表达欲，这意味着你的情绪体验既强烈又外显。你可能在短时间内经历从狂喜到沮丧的剧烈波动。你的情绪像火山——能量巨大，既能创造也能破坏。';
    emotionalStrengths.push('情感表达力强', '感染力强', '热情驱动行动');
    emotionalChallenges.push('情绪波动剧烈', '可能冲动行事', '情绪消耗大');
  } else if (N < 35 && E > 60) {
    dominantEmotion = '阳光积极型';
    emotionalPattern = '你情绪稳定且外向，天生倾向于积极解读事件。你不容易被负面情绪困扰，且善于用乐观感染他人。你的情绪像晴空——明亮、开阔、令人舒适。';
    emotionalStrengths.push('天然乐观倾向', '情绪稳定', '社交能量充沛');
    emotionalChallenges.push('可能忽视负面信号', '对他人痛苦理解不足', '深度情感连接可能较浅');
  } else if (N < 35 && E < 40) {
    dominantEmotion = '沉静平和型';
    emotionalPattern = '你情绪稳定且内敛，很少大起大落。你不追求强烈的情感刺激，而是在平静中获得满足。你的情绪像湖水——表面波澜不惊，深处自有节奏。';
    emotionalStrengths.push('情绪自控力强', '不易被干扰', '冷静判断');
    emotionalChallenges.push('可能压抑真实感受', '情感表达不足', '他人可能觉得你冷漠');
  } else if (A > 65 && N > 50) {
    dominantEmotion = '共情敏感型';
    emotionalPattern = '你的情绪系统高度面向他人——你不仅感受自己的情绪，还强烈地吸收周围人的情感。这使你成为优秀的倾听者和理解者，但也让你容易情绪过载。';
    emotionalStrengths.push('深度共情能力', '情感细腻', '人际敏感度高');
    emotionalChallenges.push('情绪边界模糊', '容易被他人情绪拖累', '情感疲劳');
  } else {
    dominantEmotion = '平衡稳健型';
    emotionalPattern = '你的情绪系统相对平衡，没有极端的倾向。你能在需要时表达情感，也能在必要时克制。这种灵活性让你适应多种情境，但也可能让你缺少鲜明的情感辨识度。';
    emotionalStrengths.push('情绪灵活性', '适应力强', '理性与感性平衡');
    emotionalChallenges.push('可能缺乏情感深度', '关键时刻难以抉择', '情感表达不够鲜明');
  }

  return {
    positivity,
    negativity,
    emotionalRange,
    emotionalResilience,
    dominantEmotion,
    emotionalPattern,
    emotionalStrengths,
    emotionalChallenges,
  };
}

// ─── 认知风格分析 ───

export interface CognitiveStyle {
  thinkingMode: string;       // 思维模式名称
  description: string;        // 详细描述
  processingStyle: string;    // 信息加工方式
  creativityIndex: number;    // 创造力指数 0-100
  analyticalIndex: number;    // 分析力指数 0-100
  practicalIndex: number;     // 实践力指数 0-100
  learningStyle: string;      // 学习风格
  decisionBias: string;       // 决策偏好
}

function buildCognitiveStyle(scores: DomainScores): CognitiveStyle {
  const O = scores.openness;
  const C = scores.conscientiousness;
  const E = scores.extraversion;
  const N = scores.neuroticism;

  // 创造力指数：高O驱动，低C释放
  const creativityIndex = Math.round(
    Math.min(100, Math.max(0, 20 + O * 0.5 + (100 - C) * 0.15 + (E > 50 ? 5 : 0)))
  );

  // 分析力指数：高C高O驱动
  const analyticalIndex = Math.round(
    Math.min(100, Math.max(0, 20 + C * 0.35 + O * 0.3 + (100 - N) * 0.1))
  );

  // 实践力指数：高C驱动，高E辅助
  const practicalIndex = Math.round(
    Math.min(100, Math.max(0, 20 + C * 0.45 + E * 0.2 + (100 - O) * 0.1))
  );

  let thinkingMode = '';
  let description = '';
  let processingStyle = '';
  let learningStyle = '';
  let decisionBias = '';

  if (O > 65 && C > 65) {
    thinkingMode = '创新执行型思维';
    description = '你同时具备发散性思维和收敛性执行力——既能产生突破性想法，又能将它们系统化地落地。这是最稀有的认知组合之一，约仅占人群的10%。你的挑战在于两种模式的切换：创意阶段需要放松约束，执行阶段需要严格纪律。';
    processingStyle = '先发散后收敛：你会先广泛探索可能性，然后选择最优路径深度执行';
    learningStyle = '探索式学习：你喜欢先理解全局框架，再深入细节，善于跨领域迁移知识';
    decisionBias = '创意与可行性并重：你追求既创新又可落地的方案';
  } else if (O > 65 && C < 40) {
    thinkingMode = '发散探索型思维';
    description = '你的思维像万花筒——总能看到别人看不到的角度和可能性。你天生抗拒思维定式，喜欢挑战常规假设。你的挑战在于收敛——太多想法同时涌来时，选择和坚持变得困难。';
    processingStyle = '网状发散：你的思维跳跃性强，一个想法自然引出另一个，形成创意网络';
    learningStyle = '沉浸式学习：你追随兴趣深入，但可能跳过基础直接进入前沿';
    decisionBias = '创意优先：你倾向于选择更新颖的方案，即使它更冒险';
  } else if (O < 40 && C > 65) {
    thinkingMode = '系统分析型思维';
    description = '你的思维像精密仪器——逻辑清晰、步骤严谨、结论可靠。你擅长将复杂问题分解为可管理的模块，然后逐一攻克。你的挑战在于跳出框架——当现有方法不奏效时，你需要允许自己尝试非常规路径。';
    processingStyle = '线性收敛：你从问题出发，按步骤推导，最终得出确定结论';
    learningStyle = '结构化学习：你偏好有清晰大纲和递进关系的课程，循序渐进';
    decisionBias = '稳妥优先：你倾向于选择经过验证的方案，避免不必要的风险';
  } else if (O > 65 && N > 60) {
    thinkingMode = '直觉洞察型思维';
    description = '你的思维融合了高开放性和高敏感度——你不仅能感知微妙的模式和关联，还能将这些直觉转化为深刻见解。许多突破性发现来自这种认知风格。你的挑战在于验证——直觉虽强，但需要逻辑和证据来支撑。';
    processingStyle = '直觉驱动：你先有整体感觉，再反向寻找逻辑支撑';
    learningStyle = '体验式学习：你需要亲身感受和经历，抽象理论不如实际案例有效';
    decisionBias = '直觉优先：你相信自己的第六感，即使数据不完全支持';
  } else if (E > 60 && C > 55) {
    thinkingMode = '行动驱动型思维';
    description = '你通过行动来思考——与其在脑中反复推演，不如先做起来看效果。你的优势在于快速迭代和实战学习，你的认知在行动中不断优化。你的挑战在于反思——有时需要在行动前暂停，审视全局。';
    processingStyle = '试错迭代：你快速尝试，从反馈中学习，逐步逼近最优解';
    learningStyle = '做中学：你通过实践和实验来理解，纯理论学习效率较低';
    decisionBias = '速度优先：你偏好快速决策和行动，宁可边做边调整';
  } else {
    thinkingMode = '灵活适应型思维';
    description = '你的认知风格灵活多变，能根据情境需要切换不同的思维模式。面对创意需求时你能发散，面对执行需求时你能收敛。这种适应性是你的核心优势，但也意味着你可能缺少一种鲜明的认知标识。';
    processingStyle = '情境切换：你会根据任务性质自动调整思维方式';
    learningStyle = '混合式学习：你能适应多种学习方式，根据内容选择最有效的策略';
    decisionBias = '情境依赖：你的决策风格随情境变化，没有固定的偏好';
  }

  return {
    thinkingMode,
    description,
    processingStyle,
    creativityIndex,
    analyticalIndex,
    practicalIndex,
    learningStyle,
    decisionBias,
  };
}

// ─── 压力响应模式 ───

export interface StressResponse {
  stressType: string;         // 压力类型名称
  description: string;        // 详细描述
  stressTriggers: string[];   // 压力触发因素
  copingMechanism: string;    // 应对机制
  recoveryStyle: string;      // 恢复方式
  burnoutRisk: number;        // 倦怠风险 0-100
  resilienceFactors: string[]; // 韧性因素
  vulnerabilityFactors: string[]; // 脆弱因素
}

function buildStressResponse(scores: DomainScores): StressResponse {
  const N = scores.neuroticism;
  const C = scores.conscientiousness;
  const E = scores.extraversion;
  const A = scores.agreeableness;
  const O = scores.openness;

  // 倦怠风险：高N高C → 高风险
  const burnoutRisk = Math.round(
    Math.min(100, Math.max(0, 20 + N * 0.35 + C * 0.2 + (100 - E) * 0.15 + (A > 60 ? 10 : 0)))
  );

  let stressType = '';
  let description = '';
  const stressTriggers: string[] = [];
  let copingMechanism = '';
  let recoveryStyle = '';
  const resilienceFactors: string[] = [];
  const vulnerabilityFactors: string[] = [];

  if (N > 65 && C > 60) {
    stressType = '过度承担型';
    description = '你是那种在压力下更加拼命的人——焦虑驱动你加倍努力，而努力又不能完全消除焦虑，形成恶性循环。你的尽责性让你无法降低标准，你的情绪敏感性让你对每一个可能的失败都高度警觉。';
    stressTriggers.push('完美主义标准', '无法委托他人', '截止日期压力', '对失败的恐惧');
    copingMechanism = '你倾向于通过加倍努力来应对压力，短期内有效但长期可能导致倦怠';
    recoveryStyle = '你需要学会"足够好"的标准，刻意安排休息而非等到崩溃才停下';
    resilienceFactors.push('高执行力确保问题不会堆积', '责任心让你主动面对而非逃避');
    vulnerabilityFactors.push('焦虑-努力循环难以打破', '忽视身体信号直到过度疲劳', '难以向他人求助');
  } else if (N > 65 && C < 40) {
    stressType = '焦虑瘫痪型';
    description = '压力来临时，你的情绪反应强烈但行动力下降——你清楚地感受到焦虑，却难以启动有效的应对行为。拖延不是懒惰，而是焦虑导致的行动冻结。';
    stressTriggers.push('不确定性', '缺乏清晰结构', '社交评价', '多重任务并行');
    copingMechanism = '你倾向于回避或拖延压力源，短期内减轻焦虑但长期使问题恶化';
    recoveryStyle = '将大任务拆解为极小的步骤（5分钟即可完成），用微行动打破焦虑冻结';
    resilienceFactors.push('高敏感度让你及早察觉问题', '创造力可能提供非常规解决方案');
    vulnerabilityFactors.push('回避行为使问题积累', '焦虑与拖延形成恶性循环', '缺乏结构加剧失控感');
  } else if (N < 35 && C > 65) {
    stressType = '稳健抗压型';
    description = '你天生情绪稳定，加上高尽责性，使你成为压力环境中的定海神针。你不容易被情绪干扰判断，且总能制定出系统的应对方案。但你的盲区在于——你可能低估了压力对他人和自己的隐性影响。';
    stressTriggers.push('他人不靠谱的行为', '计划被打乱', '低效的流程', '不公平的待遇');
    copingMechanism = '你通过制定计划和采取行动来控制压力源，系统化地消除不确定性';
    recoveryStyle = '你通过恢复秩序和控制感来减压，运动和规律作息是你的天然恢复方式';
    resilienceFactors.push('情绪稳定是最大的抗压资本', '系统化思维让你高效解决问题', '规律的生活习惯提供稳定基础');
    vulnerabilityFactors.push('可能忽视情绪信号直到身体发出警告', '对他人情绪反应缺乏共情', '过度依赖控制感');
  } else if (N < 35 && E > 60) {
    stressType = '社交缓冲型';
    description = '你通过社交互动来消化压力——找人聊天、集体运动、团队活动都是你的减压方式。你的情绪稳定性确保你不会在社交中过度发泄，而是真正地从中获得能量。';
    stressTriggers.push('长时间独处', '社交隔离', '缺乏新鲜刺激', '重复枯燥的工作');
    copingMechanism = '你通过社交和活动来分散注意力并重新获得能量，然后更有效地面对问题';
    recoveryStyle = '社交活动、运动、新体验是你的充电方式，独处反而可能让你更焦虑';
    resilienceFactors.push('广泛的社交网络提供支持', '积极情绪是天然缓冲', '行动力强不易陷入反刍');
    vulnerabilityFactors.push('可能回避独处和深度反思', '社交依赖可能在隔离期成为弱点', '可能用忙碌逃避核心问题');
  } else if (A > 65 && N > 50) {
    stressType = '共情过载型';
    description = '你的压力很大一部分来自他人——你不仅承受自己的压力，还吸收周围人的焦虑和痛苦。你的高宜人性让你难以拒绝他人的请求，导致你经常超载。';
    stressTriggers.push('他人的痛苦和需求', '冲突和对抗', '无法帮助他人', '被误解或被利用');
    copingMechanism = '你倾向于优先处理他人的需求，通过帮助他人来获得控制感，但往往忽视自己';
    recoveryStyle = '你需要刻意建立"情绪隔离区"——独处时间、冥想、自然接触来清理他人情绪';
    resilienceFactors.push('深度的人际连接提供情感支持', '助人行为带来意义感', '直觉敏锐能及早发现问题');
    vulnerabilityFactors.push('情绪边界薄弱', '过度迁就导致自我牺牲', '难以说"不"导致过载');
  } else {
    stressType = '灵活适应型';
    description = '你在压力下相对灵活，能根据压力源的性质调整应对策略。你没有极端的压力反应模式，这意味着你不太可能在某一类压力下崩溃，但也缺少特别强大的抗压优势。';
    stressTriggers.push('超出常规的极端压力', '多重压力同时袭来', '缺乏恢复时间');
    copingMechanism = '你会根据情境灵活选择应对方式——有时行动，有时等待，有时寻求帮助';
    recoveryStyle = '你需要多样化的恢复方式，单一策略可能不够，结合运动、社交和独处效果最佳';
    resilienceFactors.push('灵活性让你适应不同压力', '没有极端的脆弱点', '能从多种策略中选择');
    vulnerabilityFactors.push('缺少突出的抗压优势', '极端压力下可能犹豫不决', '需要更长时间找到最佳策略');
  }

  return {
    stressType,
    description,
    stressTriggers,
    copingMechanism,
    recoveryStyle,
    burnoutRisk,
    resilienceFactors,
    vulnerabilityFactors,
  };
}

// ─── 决策风格 ───

export interface DecisionStyle {
  style: string;              // 决策风格名称
  description: string;        // 详细描述
  informationPreference: string; // 信息偏好
  riskTolerance: number;      // 风险容忍度 0-100
  speedBias: string;          // 速度偏好
  groupInfluence: string;     // 群体影响
  blindSpots: string[];       // 盲点
  optimizationTip: string;    // 优化建议
}

function buildDecisionStyle(scores: DomainScores): DecisionStyle {
  const O = scores.openness;
  const C = scores.conscientiousness;
  const E = scores.extraversion;
  const A = scores.agreeableness;
  const N = scores.neuroticism;

  // 风险容忍度：高O低N高E → 高风险容忍
  const riskTolerance = Math.round(
    Math.min(100, Math.max(0, 30 + (O - 50) * 0.25 + (50 - N) * 0.25 + (E - 50) * 0.15 + (50 - A) * 0.1))
  );

  let style = '';
  let description = '';
  let informationPreference = '';
  let speedBias = '';
  let groupInfluence = '';
  const blindSpots: string[] = [];
  let optimizationTip = '';

  if (C > 65 && N > 55) {
    style = '审慎分析型';
    description = '你做决策时极其谨慎——收集大量信息、评估所有风险、反复推敲利弊。你的决策质量通常很高，但代价是速度。在快速变化的环境中，过度分析可能让你错失窗口期。';
    informationPreference = '全面详尽：你偏好收集所有可得信息，建立完整的决策依据链';
    speedBias = '慢而稳：你宁愿多花时间确保正确，也不愿匆忙决定后后悔';
    groupInfluence = '你会听取他人意见但最终依赖自己的分析，他人主要作为信息源而非决策影响者';
    blindSpots.push('分析瘫痪——信息越多越难决定', '可能过度关注风险而忽视机会', '完美主义导致决策延迟');
    optimizationTip = '设定决策截止时间，采用"70%信息即行动"原则——完美信息不存在，及时决策比完美决策更重要';
  } else if (C > 65 && N < 35) {
    style = '系统决断型';
    description = '你既有系统化分析的能力，又有果断执行的魄力。你建立决策框架，快速填充关键信息，然后自信地做出判断。这是最高效的决策风格之一，但可能在需要更多同理心的决策中显得冷硬。';
    informationPreference = '关键指标优先：你关注核心数据点，不被次要信息干扰';
    speedBias = '高效精准：你快速建立分析框架，高效得出结论';
    groupInfluence = '你主导决策过程，他人意见作为参考数据纳入你的框架';
    blindSpots.push('可能忽视无法量化的因素（情感、直觉）', '对他人决策速度缺乏耐心', '框架外的信息可能被过滤掉');
    optimizationTip = '在涉及人的决策中，刻意纳入"感受"维度——不是所有重要因素都能被量化';
  } else if (E > 60 && O > 60) {
    style = '直觉创新型';
    description = '你信任自己的直觉，且直觉往往很准——高开放性赋予你敏锐的模式识别能力，高外向性让你在行动中验证假设。你的决策风格大胆而富有创造力，但可能在需要严谨论证的场合显得不够扎实。';
    informationPreference = '模式与趋势：你关注大局和趋势，细节留给执行阶段处理';
    speedBias = '快速试错：你偏好快速决策、快速验证、快速调整';
    groupInfluence = '你享受集体头脑风暴，但最终信任自己的判断';
    blindSpots.push('可能忽视反面证据', '直觉偏差难以自我检测', '快速决策可能遗漏关键细节');
    optimizationTip = '为直觉决策增加一个"魔鬼代言人"环节——刻意寻找反对意见，确保直觉经过挑战';
  } else if (A > 65 && E > 55) {
    style = '共识驱动型';
    description = '你倾向于通过协商和共识来做决策——你重视每个人的意见，追求所有人都能接受的方案。这使你在团队中极受欢迎，但可能导致决策妥协化——最优方案被折中方案取代。';
    informationPreference = '多元视角：你主动收集不同立场的信息，确保各方声音被听到';
    speedBias = '适中但偏慢：你需要时间协调各方意见，达成共识需要耐心';
    groupInfluence = '高度受群体影响——他人的意见和感受是你决策的核心输入';
    blindSpots.push('过度妥协导致方案平庸化', '回避必要冲突', '可能牺牲效率追求和谐');
    optimizationTip = '区分"需要共识的决策"和"需要最优解的决策"——后者应该基于数据和逻辑，而非投票';
  } else if (O < 40 && C < 40) {
    style = '即兴反应型';
    description = '你偏好凭当下的感觉做决定，不喜欢复杂的分析过程。你的优势在于速度和灵活，能在瞬息万变的情境中快速反应。但缺乏系统分析可能导致重复犯错。';
    informationPreference = '当下可得：你使用手边的信息快速判断，不做深度调研';
    speedBias = '极快：你几乎凭本能反应，决策速度是你的优势';
    groupInfluence = '你容易受当下社交环境影响，尤其是权威人物或强势意见';
    blindSpots.push('缺乏长期视角', '可能重复相同错误', '容易受框架效应影响');
    optimizationTip = '为重要决策建立简单的检查清单——不需要复杂分析，但需要确保关键因素不被遗漏';
  } else {
    style = '情境适应型';
    description = '你的决策风格随情境灵活调整——小事快速决定，大事审慎分析；技术问题靠逻辑，人的问题靠共情。这种灵活性让你在多数场景下表现良好，但可能在极端压力下缺少默认模式。';
    informationPreference = '按需收集：你根据决策重要性调整信息收集深度';
    speedBias = '因情境而异：你在不同场景下展现不同的速度偏好';
    groupInfluence = '适度——你会参考他人意见但保持独立判断';
    blindSpots.push('缺少一致的决策框架', '可能在高压下犹豫', '不同情境的决策标准可能矛盾');
    optimizationTip = '建立一套个人决策原则——不是死板规则，而是在压力下能快速启发的思维捷径';
  }

  return {
    style,
    description,
    informationPreference,
    riskTolerance,
    speedBias,
    groupInfluence,
    blindSpots,
    optimizationTip,
  };
}

// ─── 主入口：完整人格建模 ───

export function buildPersonalityModel(scores: DomainScores): PersonalityModel {
  const facetProfiles = buildFacetProfiles(scores);
  const archetype = identifyArchetype(scores);
  const careerMatches = calculateCareerMatches(scores);
  const relationshipDynamics = buildRelationshipDynamics(scores);
  const dominantTraits = identifyDominantTraits(scores, facetProfiles);
  const growthEdge = identifyGrowthEdge(scores, facetProfiles);
  const celebrityMatches = matchCelebrities(scores);
  const emotionalProfile = buildEmotionalProfile(scores, facetProfiles);
  const cognitiveStyle = buildCognitiveStyle(scores);
  const stressResponse = buildStressResponse(scores);
  const decisionStyle = buildDecisionStyle(scores);

  return {
    scores,
    archetype,
    facetProfiles,
    careerMatches,
    relationshipDynamics,
    dominantTraits,
    growthEdge,
    celebrityMatches,
    emotionalProfile,
    cognitiveStyle,
    stressResponse,
    decisionStyle,
  };
}
