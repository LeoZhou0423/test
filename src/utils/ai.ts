import type { DomainScores } from './scoring';
import type { Domain } from '@/data/questions';

export interface AIStreamOptions {
  apiKey: string;
  baseUrl: string;
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

/**
 * Build a prompt for AI personality analysis based on scores.
 */
function buildPrompt(scores: DomainScores): string {
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

  // Build score description
  const scoreLines = (['O', 'C', 'E', 'A', 'N'] as Domain[])
    .map((d) => `${domainNames[d]}: ${domainScores[d]}/100`)
    .join('\n');

  // Build facet scores
  const facetLines = Object.entries(scores.subDimensions)
    .map(([key, value]) => `  ${key}: ${value}/100`)
    .join('\n');

  return `你是一位专业的心理咨询师，正在为来访者撰写人格评估报告。

以下是该来访者的大五人格测试结果：

维度得分：
${scoreLines}

子维度得分：
${facetLines}

请根据以上数据，撰写一份专业、温暖、具体的人格侧写报告。要求：

1. 使用第二人称"你"，语气像心理咨询师在和来访者对话
2. 每个维度的解读必须包含具体的行为场景（如"你可能会在周末花三小时逛书店"），而非抽象形容词
3. 避免巴纳姆效应——不要写放之四海皆准的废话，要写只有符合该得分模式的人才适用的描述
4. 报告结构：

## 人格画像
（2-3句话总结核心人格特征，像给朋友写推荐信那样真诚）

## 核心优势
（列出2-3个具体优势，每个优势配一个行为场景说明）

## 成长空间
（列出1-2个可以发展的方向，给出具体可执行的建议）

## 人际风格
（描述在亲密关系、友谊、职场中的典型互动模式）

请直接输出报告内容，不要加任何前缀说明。`;
}

/**
 * Stream AI analysis using OpenAI-compatible API (works with Mimo, OpenAI, etc.).
 */
export async function streamAIAnalysis(
  scores: DomainScores,
  options: AIStreamOptions
): Promise<void> {
  const { apiKey, baseUrl, onToken, onComplete, onError } = options;

  if (!apiKey) {
    onError(new Error('请先在设置中配置 API Key'));
    return;
  }

  const prompt = buildPrompt(scores);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
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
            content: '你是一位专业的心理咨询师，擅长人格评估和心理分析。你的回复温暖、专业、具体，从不使用空洞的套话。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
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
          if (content) {
            onToken(content);
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
