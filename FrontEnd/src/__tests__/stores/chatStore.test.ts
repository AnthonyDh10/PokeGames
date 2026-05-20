import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useChatStore } from '../../app/store/chatStore';
import type { ChatMessage } from '../../app/store/chatStore';

const makeMessage = (text: string): ChatMessage => ({
  senderName: 'Sacha',
  text,
  timestamp: new Date().toISOString(),
  isOwn: true,
});

beforeEach(() => {
  act(() => {
    useChatStore.getState().clearContext();
  });
});

describe('chatStore', () => {
  it('a les valeurs initiales correctes', () => {
    const state = useChatStore.getState();
    expect(state.partieId).toBe('');
    expect(state.sessionCode).toBe('');
    expect(state.isSolo).toBe(true);
    expect(state.isOpen).toBe(false);
    expect(state.messages).toHaveLength(0);
  });

  it('setContext met à jour partieId, sessionCode, isSolo', () => {
    act(() => {
      useChatStore.getState().setContext({
        partieId: 'partie-1',
        sessionCode: 'ABC123',
        isSolo: false,
      });
    });

    const state = useChatStore.getState();
    expect(state.partieId).toBe('partie-1');
    expect(state.sessionCode).toBe('ABC123');
    expect(state.isSolo).toBe(false);
  });

  it('setContext avec un nouveau partieId efface les messages', () => {
    act(() => {
      useChatStore.getState().setContext({ partieId: 'partie-1', sessionCode: 'A', isSolo: false });
      useChatStore.getState().addMessage(makeMessage('Bonjour'));
    });

    expect(useChatStore.getState().messages).toHaveLength(1);

    act(() => {
      useChatStore.getState().setContext({ partieId: 'partie-2', sessionCode: 'B', isSolo: false });
    });

    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it('setContext avec le même partieId conserve les messages', () => {
    act(() => {
      useChatStore.getState().setContext({ partieId: 'partie-1', sessionCode: 'A', isSolo: false });
      useChatStore.getState().addMessage(makeMessage('Bonjour'));
      useChatStore.getState().setContext({ partieId: 'partie-1', sessionCode: 'A', isSolo: false });
    });

    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('toggleOpen inverse isOpen', () => {
    expect(useChatStore.getState().isOpen).toBe(false);

    act(() => { useChatStore.getState().toggleOpen(); });
    expect(useChatStore.getState().isOpen).toBe(true);

    act(() => { useChatStore.getState().toggleOpen(); });
    expect(useChatStore.getState().isOpen).toBe(false);
  });

  it('addMessage ajoute un message', () => {
    act(() => {
      useChatStore.getState().addMessage(makeMessage('Hello'));
    });

    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].text).toBe('Hello');
  });

  it('clearMessages vide la liste des messages', () => {
    act(() => {
      useChatStore.getState().addMessage(makeMessage('Hello'));
      useChatStore.getState().clearMessages();
    });

    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it('addMessage garde au maximum 100 messages', () => {
    act(() => {
      for (let i = 0; i < 105; i++) {
        useChatStore.getState().addMessage(makeMessage(`Message ${i}`));
      }
    });

    expect(useChatStore.getState().messages).toHaveLength(100);
  });
});
