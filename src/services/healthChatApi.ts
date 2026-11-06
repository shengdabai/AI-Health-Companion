import { ChatResponse } from '../types/health';
import { ApiClientError, postOperation } from './aiApiClient';

const MAX_QUESTION_CHARS = 2_000;
const MAX_ANSWER_CHARS = 8_000;
const MAX_SUGGESTIONS = 5;

const isChatResponse = (value: unknown): value is ChatResponse => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChatResponse>;
  return typeof candidate.answer === 'string'
    && candidate.answer.length > 0
    && candidate.answer.length <= MAX_ANSWER_CHARS
    && typeof candidate.confidence === 'number'
    && Number.isFinite(candidate.confidence)
    && candidate.confidence >= 0
    && candidate.confidence <= 1
    && Array.isArray(candidate.suggestions)
    && candidate.suggestions.length <= MAX_SUGGESTIONS
    && candidate.suggestions.every((item) => typeof item === 'string' && item.length <= 200);
};

export const askHealthQuestion = async (question: string): Promise<ChatResponse> => {
  const normalizedQuestion = question.trim();
  if (!normalizedQuestion || normalizedQuestion.length > MAX_QUESTION_CHARS) {
    throw new ApiClientError('AI_API_INVALID_INPUT', '问题长度不符合要求。');
  }

  const response = await postOperation<{ question: string }, unknown>(
    'health-chat',
    { question: normalizedQuestion },
  );

  if (!isChatResponse(response)) {
    throw new ApiClientError('AI_API_INVALID_RESPONSE', 'AI 服务返回了无效回复。');
  }
  return response;
};
