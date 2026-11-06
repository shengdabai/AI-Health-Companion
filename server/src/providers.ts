import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from '@google/genai';
import type { LiveOperation, MediaPart, ModelTask } from './contracts.js';
import type { ServerConfig } from './config.js';

export interface LiveEvents {
  ready(): void;
  audio(data: string, mimeType: string): void;
  text(text: string): void;
  interrupted(): void;
  error(): void;
  closed(): void;
}
export interface LiveProviderSession {
  sendAudio(media: MediaPart): void;
  sendImage(media: MediaPart): void;
  close(): void;
}
export interface ProviderAdapter {
  invoke(task: ModelTask, config: ServerConfig, signal: AbortSignal): Promise<unknown>;
  connectLive(operation: LiveOperation, input: Record<string, unknown>, config: ServerConfig, signal: AbortSignal, events: LiveEvents): Promise<LiveProviderSession>;
}

export const OFFICIAL_ENDPOINTS = {
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com',
} as const;
export const anthropicClientOptions = (apiKey: string) => ({ apiKey, authToken: null, baseURL: OFFICIAL_ENDPOINTS.anthropic });
export const geminiClientOptions = (apiKey: string, timeout: number) => ({ apiKey, vertexai: false as const, httpOptions: { baseUrl: OFFICIAL_ENDPOINTS.gemini, timeout } });
export const liveModelConfig = (operation: LiveOperation, signal: AbortSignal) => ({
  abortSignal: signal,
  responseModalities: [Modality.AUDIO],
  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: operation === 'roleplay-live' ? 'Puck' : 'Fenrir' } } },
});
export const anthropicSystem = (task: ModelTask) => task.schema
  ? `${task.system}\nReturn JSON that exactly matches this server-owned JSON Schema:\n${JSON.stringify(task.schema)}`
  : task.system;

const parseJson = (value: string | undefined): unknown => {
  if (!value) throw new Error('empty provider response');
  return JSON.parse(value);
};

const liveInstructions: Record<LiveOperation, (input: Record<string, unknown>) => string> = {
  'language-live': () => 'You are an encouraging Chinese language tutor for business professionals. Identify shown objects with Mandarin and Pinyin. Give concise pronunciation guidance.',
  'multimodal-live': () => 'You are an encouraging Chinese language tutor. Discuss the user audio and images in concise Mandarin, Pinyin, and English as useful.',
  'roleplay-live': input => {
    const scenario = typeof input.scenarioId === 'string' ? input.scenarioId : '';
    const roles: Record<string, string> = { cafe: 'cafe server', taxi: 'taxi driver', restaurant: 'restaurant server', supermarket: 'cashier', appointment: 'friend arranging a meeting', hospital: 'hospital registration clerk', colleague: 'coworker', business: 'business meeting participant', market: 'night-market vendor' };
    const role = roles[scenario];
    if (!role) throw new Error('invalid roleplay scenario');
    return `Act as a ${role} in a Chinese-learning roleplay. Keep the exchange safe, concise, and level-appropriate. Help with Mandarin and Pinyin when the learner struggles.`;
  },
};

export class OfficialProviderAdapter implements ProviderAdapter {
  async invoke(task: ModelTask, config: ServerConfig, signal: AbortSignal): Promise<unknown> {
    if (task.provider === 'anthropic') {
      const client = new Anthropic(anthropicClientOptions(config.anthropicKey!));
      const response = await client.messages.create({
        model: config.anthropicModel!, max_tokens: 2048, system: anthropicSystem(task),
        messages: [{ role: 'user', content: task.prompt }],
      }, { signal, timeout: config.providerTimeoutMs, maxRetries: 0 });
      const text = response.content.filter(block => block.type === 'text').map(block => block.text).join('\n');
      return parseJson(text);
    }

    const client = new GoogleGenAI(geminiClientOptions(config.geminiKey!, config.providerTimeoutMs));
    const parts: Array<Record<string, unknown>> = [{ text: task.prompt }];
    if (task.media) parts.push({ inlineData: task.media });
    if (task.mode === 'audio') {
      const response = await client.models.generateContent({
        model: config.geminiTtsModel!, contents: [{ role: 'user', parts: [{ text: `${task.system}\n\n${task.prompt}` }] }],
        config: { abortSignal: signal, httpOptions: { timeout: config.providerTimeoutMs }, responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: task.voice || 'Zephyr' } } } },
      });
      const data = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data)?.inlineData?.data;
      if (!data) throw new Error('empty audio response');
      return { mimeType: 'audio/pcm;rate=24000', data };
    }
    const response = await client.models.generateContent({
      model: config.geminiModel!, contents: [{ role: 'user', parts }],
      config: {
        abortSignal: signal, httpOptions: { timeout: config.providerTimeoutMs }, systemInstruction: task.system,
        maxOutputTokens: 4096, ...(task.mode === 'json' ? { responseMimeType: 'application/json', responseJsonSchema: task.schema } : {}),
      },
    });
    return task.mode === 'json' ? parseJson(response.text) : { text: response.text };
  }

  async connectLive(operation: LiveOperation, input: Record<string, unknown>, config: ServerConfig, signal: AbortSignal, events: LiveEvents): Promise<LiveProviderSession> {
    const client = new GoogleGenAI(geminiClientOptions(config.geminiKey!, config.providerTimeoutMs));
    let session: Session | undefined;
    session = await client.live.connect({
      model: config.geminiLiveModel!,
      config: { ...liveModelConfig(operation, signal), systemInstruction: liveInstructions[operation](input) },
      callbacks: {
        onopen: () => events.ready(),
        onmessage: (message: LiveServerMessage) => {
          const parts = message.serverContent?.modelTurn?.parts ?? [];
          for (const part of parts) {
            if (part.inlineData?.data) events.audio(part.inlineData.data, 'audio/pcm;rate=24000');
            if (part.text) events.text(part.text);
          }
          if (message.serverContent?.interrupted) events.interrupted();
        },
        onerror: () => events.error(), onclose: () => events.closed(),
      },
    });
    if (signal.aborted) { session.close(); throw new Error('live request aborted'); }
    const abort = () => session?.close(); signal.addEventListener('abort', abort, { once: true });
    return {
      sendAudio: value => session!.sendRealtimeInput({ audio: value }),
      sendImage: value => session!.sendRealtimeInput({ video: value }),
      close: () => { signal.removeEventListener('abort', abort); session?.close(); },
    };
  }
}
