/**
 * API Call Wrapper
 */
import { AnalysisRequest, AnalysisResponse, OptimizeRequest, OptimizeResponse, PredictModel, PredictResponse } from './types';

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

export async function fetchOptimizedPortfolio(data: OptimizeRequest): Promise<OptimizeResponse> {
  const response = await fetch(`${API_URL}/api/v1/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function fetchPrediction(
  ticker: string,
  model: PredictModel = "lgbm",
): Promise<PredictResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/predict/${encodeURIComponent(ticker)}?model=${model}`,
  );

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

  let readCount = 0;
  while (true) {
    const { done, value } = await reader.read();
    readCount += 1;
    if (typeof console !== 'undefined' && console.log && readCount <= 5) console.log('[LLM read]', { readCount, done, valueLen: value?.length });
    // #region agent log
    if (readCount <= 2) fetch('http://127.0.0.1:7537/ingest/8dfb01be-c204-46a4-b56d-eb7b9f35fb9f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc746e'},body:JSON.stringify({sessionId:'fc746e',location:'api.ts:reader.read',message:'read chunk',data:{readCount,done,valueLen:value?.length},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    if (done) break;

    // 将当前的二进制块解码并拼接到缓存中
    const decoded = decoder.decode(value, { stream: true });
    buffer += decoded;
    if (typeof console !== 'undefined' && console.log && readCount <= 3) console.log('[LLM decoded]', { readCount, decodedLen: decoded.length, decodedPreview: decoded.slice(0, 200) });

    // SSE 的标准是以双换行符 \n\n 分隔消息
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const startsWithData = trimmedLine.startsWith('data: ');
      if (typeof console !== 'undefined' && console.log) console.log('[LLM line]', { startsWithData, preview: trimmedLine.slice(0, 180) });
      // #region agent log
      fetch('http://127.0.0.1:7537/ingest/8dfb01be-c204-46a4-b56d-eb7b9f35fb9f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc746e'},body:JSON.stringify({sessionId:'fc746e',location:'api.ts:SSE-line',message:'SSE line',data:{startsWithData:trimmedLine.startsWith('data: '),linePreview:trimmedLine.slice(0,120)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion

      if (startsWithData) {
        const data = trimmedLine.replace(/^data: /, '');
        if (data === '[DONE]') {
          if (typeof console !== 'undefined' && console.log) console.log('[LLM] got [DONE]');
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const chunk = parsed.content ?? parsed.text ?? parsed.choices?.[0]?.delta?.content ?? '';
          if (typeof console !== 'undefined' && console.log) console.log('[LLM parsed]', { keys: Object.keys(parsed), chunkLen: String(chunk).length, preview: String(chunk).slice(0, 80) });
          // #region agent log
          fetch('http://127.0.0.1:7537/ingest/8dfb01be-c204-46a4-b56d-eb7b9f35fb9f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc746e'},body:JSON.stringify({sessionId:'fc746e',location:'api.ts:yield',message:'yielding chunk',data:{chunkLen:chunk.length,chunkPreview:String(chunk).slice(0,80),hasContent:!!parsed.content,hasText:!!parsed.text,parsedKeys:Object.keys(parsed)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
          // #endregion
          if (typeof console !== 'undefined' && console.log) console.log('[LLM chunk]', { len: chunk.length, preview: String(chunk).slice(0, 80) });
          yield chunk;
        } catch (e) {
          if (typeof console !== 'undefined' && console.log) console.log('[LLM chunk raw]', { len: data.length, preview: String(data).slice(0, 80) });
          yield data;
        }
      } else {
        if (typeof console !== 'undefined' && console.log) console.log('[LLM plaintext]', { len: line.length, preview: line.slice(0, 80) });
        yield line + '\n';
      }
    }
  }
  if (buffer.trim()) {
    if (typeof console !== 'undefined' && console.log) console.log('[LLM plaintext tail]', { len: buffer.length, preview: buffer.slice(0, 80) });
    yield buffer;
  }
  if (typeof console !== 'undefined' && console.log) console.log('[LLM] stream loop ended, no more reads');
}
