/**
 * API Call Wrapper
 */
import { AnalysisRequest, AnalysisResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function analyzeStock(params: AnalysisRequest): Promise<AnalysisResponse> {
  const response = await fetch(`${API_URL}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function* fetchLLMAnalysis(params: AnalysisRequest): AsyncGenerator<string> {
  const response = await fetch(`${API_URL}/api/v1/analyze/LLM`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('ReadableStream not supported');

  let buffer = ''; // 用于处理可能被截断的 SSE 帧

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 将当前的二进制块解码并拼接到缓存中
    buffer += decoder.decode(value, { stream: true });

    // SSE 的标准是以双换行符 \n\n 分隔消息
    const lines = buffer.split('\n');
    
    // 保留最后一行（可能是不完整的），剩下的进行处理
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // 跳过空行

      // 如果后端返回的是标准 SSE 格式: "data: {"text": "hello"}"
      if (trimmedLine.startsWith('data: ')) {
        const data = trimmedLine.replace('data: ', '');
        
        // 如果后端发的是 [DONE] 信号
        if (data === '[DONE]') return;

        try {
          // 如果后端返回的是 JSON 字符串，解析它
          const parsed = JSON.parse(data);
          yield parsed.content || parsed.text || ''; 
        } catch (e) {
          // 如果后端直接返回的是纯文本内容
          yield data;
        }
      }
    }
  }
}
