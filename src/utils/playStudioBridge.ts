import { PlayStudioEventPayload } from '../types';

export class PlayStudioBridge {
  private gameID: string = '';
  private userID: string = '';
  private sessionID: string = 'sess_' + Math.random().toString(36).substring(2, 9);
  private startTime: number = Date.now();
  private salt: string = 'index';

  constructor(defaultGameID: string = 'bakery-basket-catch') {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      this.userID = params.get('userID') || 'user_' + Math.random().toString(36).substring(2, 7);
      
      const pathBase = window.location.pathname.split('/').pop() || '';
      this.salt = pathBase.replace(/\.html$/i, '').replace(/\.[^/.]+$/, '') || 'index';
      this.gameID = params.get('gameID') || this.salt || defaultGameID;
    }
  }

  public getSessionID(): string {
    return this.sessionID;
  }

  public getElapsedSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  public async generateSignature(rawStr: string): Promise<string> {
    try {
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        return 'mock_sig_' + Math.random().toString(36).substring(2);
      }
      const msgBuffer = new TextEncoder().encode(rawStr);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return 'fallback_sig_' + Math.random().toString(36).substring(2);
    }
  }

  public async sendEvent(
    event: string,
    level: { current: number; total: number; hasNextLevel: boolean },
    score: { levelScore: number; totalScore: number },
    status: 'pending' | 'ongoing' | 'completed' | 'failed' | 'paused',
    metrics: { timeSpentSeconds: number; moves?: number; stars?: number; livesRemaining?: number; [key: string]: any }
  ): Promise<PlayStudioEventPayload> {
    const timestamp = Date.now();
    const rawForSig = [
      event,
      this.gameID,
      this.userID,
      level.current,
      score.levelScore,
      score.totalScore,
      metrics.moves || '',
      metrics.timeSpentSeconds || '',
      timestamp,
      this.salt,
    ].join('|');

    const signature = await this.generateSignature(rawForSig);

    const payload: PlayStudioEventPayload = {
      version: '1.0',
      gameID: this.gameID,
      sessionID: this.sessionID,
      userID: this.userID,
      timestamp,
      event,
      level,
      score,
      status,
      metrics,
      signature,
    };

    if (typeof window !== 'undefined') {
      try {
        window.parent.postMessage({
          type: '42PLAYSTUDIO_GAME_EVENT',
          payload,
        }, '*');
      } catch (e) {
        console.warn('Failed to post message to parent window:', e);
      }

      // Also dispatch custom event for internal app listeners (e.g. Admin Event Inspector)
      window.dispatchEvent(new CustomEvent('42PLAYSTUDIO_EVENT_LOG', { detail: payload }));
    }

    return payload;
  }
}

export const playStudioBridge = new PlayStudioBridge();
