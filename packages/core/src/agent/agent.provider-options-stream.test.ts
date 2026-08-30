import { simulateReadableStream, MockLanguageModelV2 } from '@internal/ai-sdk-v5/test';
import { describe, it, expect } from 'vitest';
import { noopLogger } from '../logger';
import { MockMemory } from '../memory/mock';
import { Agent } from './agent';

describe('Agent stream providerOptions propagation', () => {
  it('passes providerOptions to the model on a plain stream call', async () => {
    let capturedProviderOptions: any = null;
    const mockModel = new MockLanguageModelV2({
      doStream: async ({ providerOptions }) => {
        capturedProviderOptions = providerOptions;
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-delta', id: '1', textDelta: 'Hello' },
              {
                type: 'finish',
                id: '1',
                finishReason: 'stop',
                usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
              },
            ],
          }),
          rawCall: { rawPrompt: null, rawSettings: {} },
        };
      },
    });

    const agent = new Agent({
      id: 'po-stream-agent',
      name: 'PO Stream Agent',
      instructions: 'Test instructions',
      model: mockModel,
    });
    agent.__setLogger(noopLogger);

    const stream = await agent.stream('Hello', {
      providerOptions: {
        deepseek: {
          thinking: { type: 'disabled' },
        },
      },
    });
    await stream.getFullOutput();

    expect(capturedProviderOptions).toBeDefined();
    expect(capturedProviderOptions?.deepseek?.thinking).toEqual({ type: 'disabled' });
  });

  it('passes providerOptions to the model when memory is enabled', async () => {
    let capturedProviderOptions: any = null;
    const mockModel = new MockLanguageModelV2({
      doStream: async ({ providerOptions }) => {
        capturedProviderOptions = providerOptions;
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-delta', id: '1', textDelta: 'Hello' },
              {
                type: 'finish',
                id: '1',
                finishReason: 'stop',
                usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
              },
            ],
          }),
          rawCall: { rawPrompt: null, rawSettings: {} },
        };
      },
    });

    const agent = new Agent({
      id: 'po-stream-memory-agent',
      name: 'PO Stream Memory Agent',
      instructions: 'Test instructions',
      model: mockModel,
      memory: new MockMemory(),
    });
    agent.__setLogger(noopLogger);

    const stream = await agent.stream('Hello', {
      memory: {
        resource: 'user-1',
        thread: { id: 'thread-1' },
      },
      providerOptions: {
        deepseek: {
          thinking: { type: 'disabled' },
        },
      },
    });
    await stream.getFullOutput();

    expect(capturedProviderOptions).toBeDefined();
    expect(capturedProviderOptions?.deepseek?.thinking).toEqual({ type: 'disabled' });
  });
});
