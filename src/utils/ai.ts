import type { DomainScores } from './scoring';
import type { Domain } from '@/data/questions';

export interface AIStreamOptions {
  apiKey: string;
  baseUrl: string;
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
    retestMessage = `⚠️ 信度提示：您的${domainList}分数处于极端区间。在正规大五测评中，多个维度同时处于极端百分位是小概率事件。这可能与测试时的情绪状态有关。建议2周后复测确认，以获得更稳定的人格画像。`;
  } else if (extremeDomains.length === 1) {
    const d = extremeDomains[0];
    retestMessage = `ℹ️ 您的${domainNames[d.domain]}分数为${d.score}分，处于较高/较低区间。单一维度的极端分数在正常范围内，但结合整体报告阅读效果更佳。`;
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
        return `- ${name}(${d.score})：极高分，需考虑是否存在社会期许效应或当前情绪状态影响`;
      }
      return `- ${name}(${d.score})：极低分，需考虑是否存在作答偏差或特殊情境因素`;
    })
    .join('\n');

  // Social desirability warning
  let sdWarning = '';
  if (scores.socialDesirability >= 70) {
    sdWarning = `\n## ⚠️ 作答可信度警告
您的社会期许量表得分为${scores.socialDesirability}/100，表明您可能在"表演"理想自我。具体表现：
- 您在"我从不说谎""我总是信守承诺"等题目上选择了较高分值
- 这可能导致您的其他人格分数偏离真实状态
- 建议：请在放松状态下重新作答，如实回答而非"应该怎样"

在撰写报告时，请注意：
1. 您的宜人性、尽责性分数可能被高估
2. 您的神经质分数可能被低估
3. 请在报告开头温和地提醒用户注意这一偏差`;
  }

  return `你是一位资深临床心理学家，拥有15年人格评估经验。你正在为来访者撰写一份诚实、有深度的人格分析报告。

## 你的核心原则
1. **温和而诚实**：不美化负面特质，不回避适应性问题，但始终保持尊重和理解
2. **具体而非抽象**：每个判断必须有行为场景支撑，禁止空洞的形容词堆砌
3. **因果分析**：不仅描述"是什么"，更要分析"为什么"——这个分数背后可能的心理机制
4. **反巴纳姆**：绝不写放之四海皆准的废话，只写只有符合该特定得分模式的人才适用的描述
5. **代价-收益框架**：每个特质都标注"天赋面"和"代价面"，避免纯美化或纯病理化

## 来访者的人格数据

维度得分：
${scoreProfile}

子维度得分：
${facetLines}

## 统计学注意事项
${extremeWarnings || '所有维度分数均在正常范围内，无需特别的信度提示。'}
${sdWarning}

## 报告结构要求

### 一、核心人格画像
（2-3句话，直击要害。不要用"你是一个复杂的人"这种废话。要像一位了解你10年的老友在描述你）

### 二、维度深度分析
对每个维度，分析：
- **分数解读**：这个分数意味着什么（具体行为场景）
- **成因推测**：这个分数可能来自哪里（高开放的价值观驱动？高神经质的焦虑逃避？完美主义的拖延？还是真的低动机？）
- **代价与收益**：这个特质给你带来什么，又让你付出什么

特别关注：
- 尽责性极低时，不要建议"列清单"（低尽责性本身就是"难以坚持列清单"的特质）。应该建议：游戏化、外部问责、5分钟启动法、允许"烂开始"
- 神经质极高时，不要简单说"情绪敏感"。应该分析：你的情绪调节系统可能像没有减震器的跑车，遇到颠簸会过度反应
- 开放性极高时，不要只说"有创造力"。应该指出：高开放的代价是注意力分散、难以深耕

### 三、子维度交叉分析
分析2-3个最有意义的子维度组合，例如：
- 高审美感受 + 低求知欲 = 对艺术有感觉但不愿深入理论
- 高焦虑 + 高效率感 = 焦虑驱动的完美主义
- 高社交性 + 低自信表达 = 想融入但不敢主导

### 四、情境化建议
不要给"通用建议"。给"给这个独特profile的定制策略"：
- 对低尽责者：不要建议"做计划"，建议"把计划外包给高尽责的朋友"或"用随机性对抗完美主义"
- 对高神经质者：不要建议"管理情绪"，建议"把情绪变成创作素材"
- 对高开放+低外向者：建议"用写作代替演讲来表达想法"

### 五、发展性视角
- 这个profile在不同人生阶段（20/30/40岁）会面临什么不同挑战？
- 存在哪些补偿性发展的可能？

### 六、一句话总结
（一句真诚、有力、不煽情的总结，像心理学教授在督导会上的发言）

请直接输出报告内容，不要加任何前缀说明。`;
}

/**
 * Stream AI analysis using OpenAI-compatible API with enhanced prompting.
 */
export async function streamAIAnalysis(
  scores: DomainScores,
  options: AIStreamOptions
): Promise<void> {
  const { apiKey, baseUrl, corsProxy, onToken, onComplete, onError } = options;

  if (!apiKey) {
    onError(new Error('请先在设置中配置 API Key'));
    return;
  }

  const analysis = analyzeScores(scores);
  const prompt = buildPrompt(scores, analysis);

  // Build the API URL, optionally using CORS proxy
  const apiUrl = corsProxy
    ? `${corsProxy}${encodeURIComponent(`${baseUrl}/chat/completions`)}`
    : `${baseUrl}/chat/completions`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mimo-v2-pro',
        messages: [
          {
            role: 'system',
            content: `你是一位资深临床心理学家，专长大五人格评估。你的报告风格：
- 温和而诚实：不美化负面特质，但始终保持尊重
- 因果导向：不仅描述行为，更分析背后的心理机制
- 反套路：绝不使用"你是一个有创造力的人"这类空洞描述
- 具体化：每个判断必须有行为场景支撑
- 代价-收益：每个特质都标注天赋面和代价面`,
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
    let lastTokenTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      lastTokenTime = Date.now();
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
