import type { DomainScores } from './scoring';
import type { Domain } from '@/data/questions';

export interface AIStreamOptions {
  /** Worker 代理 URL。设置后直连 Worker，API Key 不经过客户端 */
  proxyUrl?: string;
  /** 直连 DeepSeek 时使用（开发备用），不持久化 */
  apiKey?: string;
  corsProxy?: string;
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface ScoreAnalysis {
  extremeDomains: { domain: Domain; level: 'very_high' | 'very_low'; score: number }[];
  hasRetestAdvice: boolean;
  retestMessage: string;
}

/**
 * Detect extreme scores that may need reliability disclaimers.
 */
export function analyzeScores(scores: DomainScores): ScoreAnalysis {
  const domainScores: Record<Domain, number> = {
    O: scores.openness,
    C: scores.conscientiousness,
    E: scores.extraversion,
    A: scores.agreeableness,
    N: scores.neuroticism,
  };

  const domainNames: Record<Domain, string> = {
    O: '开放性',
    C: '尽责性',
    E: '外向性',
    A: '宜人性',
    N: '神经质',
  };

  const extremeDomains: ScoreAnalysis['extremeDomains'] = [];

  for (const [domain, score] of Object.entries(domainScores) as [Domain, number][]) {
    if (score >= 90) {
      extremeDomains.push({ domain, level: 'very_high', score });
    } else if (score <= 10) {
      extremeDomains.push({ domain, level: 'very_low', score });
    }
  }

  const hasRetestAdvice = extremeDomains.length >= 2;

  let retestMessage = '';
  if (hasRetestAdvice) {
    const domainList = extremeDomains
      .map((d) => `${domainNames[d.domain]}(${d.score}分)`)
      .join('、');
    retestMessage = `注意：${domainList}的分数比较极端。这可能和最近的状态有关，不一定是平时的你。如果过段时间再做一次，结果可能会不一样。`;
  } else if (extremeDomains.length === 1) {
    const d = extremeDomains[0];
    retestMessage = `${domainNames[d.domain]}分数为${d.score}分，偏高/偏低。这个结果可以和其他方面的信息结合起来看。`;
  }

  return { extremeDomains, hasRetestAdvice, retestMessage };
}

/**
 * Build a comprehensive, honest, psychologically-grounded prompt.
 */
function buildPrompt(scores: DomainScores, analysis: ScoreAnalysis): string {
  const domainScores: Record<Domain, number> = {
    O: scores.openness,
    C: scores.conscientiousness,
    E: scores.extraversion,
    A: scores.agreeableness,
    N: scores.neuroticism,
  };

  const domainNames: Record<Domain, string> = {
    O: '开放性',
    C: '尽责性',
    E: '外向性',
    A: '宜人性',
    N: '神经质',
  };

  const domainKeys: Domain[] = ['O', 'C', 'E', 'A', 'N'];

  // Build detailed score profile
  const scoreProfile = domainKeys
    .map((d) => {
      const score = domainScores[d];
      let level = '中等';
      if (score >= 80) level = '非常高';
      else if (score >= 60) level = '较高';
      else if (score <= 20) level = '非常低';
      else if (score <= 40) level = '较低';
      return `${domainNames[d]}: ${score}/100 (${level})`;
    })
    .join('\n');

  // Build facet scores
  const facetLines = Object.entries(scores.subDimensions)
    .map(([key, value]) => `  ${key}: ${value}/100`)
    .join('\n');

  // Extreme score warnings
  const extremeWarnings = analysis.extremeDomains
    .map((d) => {
      const name = domainNames[d.domain];
      if (d.level === 'very_high') {
        return `- ${name}(${d.score})：极高分，需考虑是否存在当前情绪状态影响`;
      }
      return `- ${name}(${d.score})：极低分，需考虑是否存在作答偏差或特殊情境因素`;
    })
    .join('\n');

  return `你是一个对人心有深刻理解的朋友，善于观察和分析人的性格。你正在为一位朋友写一份真诚、有温度的分析。

## 你的核心原则
1. **温和而诚实**：不美化负面特质，不回避适应性问题，但始终保持尊重和理解。你的语气像一位坦诚的老友兼专业督导。
2. **具体而非抽象**：每个判断必须有行为场景支撑，禁止空洞的形容词堆砌（如"你是一个有创造力的人"→不合格；"你会在开会走神时在笔记本角落画出一幅小漫画"→合格）。
3. **因果分析**：不仅描述"是什么"，更要分析"为什么"——这个分数背后可能的心理机制与起源（价值观驱动？防御机制？成长环境的适应策略？还是真实的神经生物学倾向？）。
4. **反巴纳姆**：绝不写放之四海皆准的废话，只写只有符合该特定得分模式的人才适用的描述。每句话都应该让不同得分组合的人感到"这不适用于我"。
5. **代价-收益框架**：每个特质都标注"天赋面"和"代价面"，避免纯美化或纯病理化。人格倾向是一把双刃剑。
6. **发展性视角**：看到静态分数背后的动态可能性——人格既有稳定性，也有可塑性，特别在"被看见"之后。
7. **文化敏感性**：考虑来访者可能的中国文化背景特征——集体主义价值观、儒家关系取向、面子意识等对人格表达的影响。

## 来访者的人格数据

维度得分：
${scoreProfile}

子维度得分：
${facetLines}

## 统计学注意事项
${extremeWarnings || '所有维度分数均在正常范围内，无需特别的信度提示。'}

## 报告结构要求

### 一、核心人格画像（必写）
2-3句话，直击要害。不要用"你是一个复杂的人"这种废话。整合该来访者最突出的2-3个维度特征，构筑一个生动、一致的心理画像。要像一位了解你10年的老友在描述你——但更有洞察。

### 二、维度深度分析（每个维度必写）
对每个维度（O/C/E/A/N），分析：
- **分数解读**：这个分数在日常生活中如何体现？给出至少一个具体行为场景。
- **成因推测**：这个分数可能来自哪里？考虑：价值观驱动 vs 防御机制 vs 成长环境的适应策略 vs 真实气质倾向。
  - 示例：高尽责性可能来自"内在对秩序的享受"也可能来自"用忙碌逃避面对情绪"——写报告时要区分是哪种。
- **代价与收益**：这个特质给你带来什么（天赋面），又让你付出什么（代价面）。必须两方面都写。

### 三、维度交互分析（选2-3组最有意义的写）
分析2-3组有意义的维度组合或子维度交叉，例如：
- 高开放性 + 高神经质 = "情绪沉浸型探索者"——丰富的内心世界同时也是焦虑的放大器
- 高尽责 + 高神经质 = "焦虑型完美主义"——高标准驱动但永远觉得不够好
- 低尽责 + 低神经质 = "松弛的自由灵魂"——不为未完成的事焦虑是优势也是盲区
- 高审美感受 + 低求知欲 = 对艺术有感觉但不愿深入理论
- 高焦虑 + 高效率感 = 焦虑驱动的生产力
- 低宜人 + 高外向 = 你需要把他人的反馈当作数据而非批评

### 四、防御机制与适应模式（新增）
根据人格剖面，分析来访者**最可能使用的心理防御机制**：
- 是理智化、压抑、升华，还是投射、被动攻击？
- 这些防御机制在哪些场景是适应性的，在哪些场景反而造成了困扰？
- 提供一个"防御机制觉察"策略：如何识别自己在使用它，以及如何尝试更成熟的替代方式。

### 五、情境化建议
不要给"通用建议"。给"给这个独特profile的定制策略"：
- 对低尽责者：不要建议"做计划"，建议"把计划外包给高尽责的朋友"或"用随机性对抗完美主义"
- 对高神经质者：不要建议"管理情绪"，建议"把情绪变成创作素材"或"建立情绪调节工具箱"
- 对高开放+低外向者：建议"用写作代替演讲来表达想法"
- 对高宜人者：建议"练习温和而坚定地说'不'，良好的边界感不会破坏关系"
- 每一条建议必须能够具体执行，而不是"要找到平衡"这类抽象表述

### 六、发展性视角
- 这个剖面在20岁、35岁、50岁等不同人生阶段可能会面临什么不同的挑战和红利？
- 存在哪些补偿性发展的可能？例如：开放性的高峰通常在青少年和中年两个阶段，尽责性随年龄增长自然上升等。
- 建议来访者在未来3-6个月可以关注的具体成长方向

### 七、依恋关系速写（新增）
基于宜人性与神经质的组合，给出1-2句关于关系模式的洞察：
- 高宜人+高神经质：倾向于焦虑型依恋，需要练习"对方没有回应≠被拒绝"的认知重构
- 低宜人+低神经质：倾向于回避型依恋，需要练习"表达脆弱不会削弱你的力量"
- 这部分的语气要尤其温和，因为涉及核心关系安全感

### 八、一句话总结
一句真诚、有力、不煽情的总结。应该让来访者感到被深刻地理解，同时也看到一个值得期待的成长方向。像心理学教授在案例督导会上的评语——专业精准、共情而不滥情。

请直接输出报告内容，不要加任何前缀说明。请使用中文撰写，语气专业而不学术、温暖而不煽情。字数控制在2000-3500字为宜。`;
}

/**
 * Stream AI analysis using OpenAI-compatible API with enhanced prompting.
 */
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';

/** Build-time injected API key from GitHub Actions */
const BUILTIN_API_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEEPSEEK_API_KEY
  ? (import.meta.env.VITE_DEEPSEEK_API_KEY as string)
  : '';

export async function streamAIAnalysis(
  scores: DomainScores,
  options: AIStreamOptions
): Promise<void> {
  const { proxyUrl, corsProxy, onToken, onComplete, onError } = options;
  const apiKey = options.apiKey || BUILTIN_API_KEY;

  if (!proxyUrl && !apiKey) {
    onError(new Error('请先在设置中配置 API（Worker URL 或 API Key）'));
    return;
  }

  const analysis = analyzeScores(scores);
  const prompt = buildPrompt(scores, analysis);

  // Build the API URL
  // Priority: proxyUrl → direct DeepSeek (via corsProxy) → direct DeepSeek
  const base = proxyUrl || DEEPSEEK_BASE_URL;
  const apiUrl = corsProxy && !proxyUrl
    ? `${corsProxy}${encodeURIComponent(`${base}/chat/completions`)}`
    : `${base}/chat/completions`;

  // Build headers — proxy handles auth, direct mode uses apiKey
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!proxyUrl && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个对人心有深刻理解的朋友。你的分析风格：
- 温和而诚实：不美化负面特质，但始终保持尊重
- 因果导向：不仅描述行为，更分析背后的心理机制——防御机制、适应策略、成长环境
- 反套路：绝不使用"你是一个有创造力的人"这类空洞描述
- 具体化：每个判断必须有行为场景支撑
- 代价-收益：每个特质都标注天赋面和代价面
- 发展性视角：看到静态分数背后的动态可能
- 文化敏感性：考虑中国文化背景对人格表达的影响`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onComplete();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          const finishReason = parsed.choices?.[0]?.finish_reason;

          if (content) {
            onToken(content);
          }

          // Check if API signaled completion
          if (finishReason === 'stop') {
            onComplete();
            return;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    // Stream ended without [DONE] - likely truncated by proxy
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
