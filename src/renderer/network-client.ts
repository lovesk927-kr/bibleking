// 브라우저 네이티브 WebSocket을 사용하는 네트워크 클라이언트

type LobbyUpdateCallback = (players: NetworkPlayerInfo[], mode?: string) => void;
type DisconnectCallback = () => void;
type GameStartCallback = (mode: string) => void;
type PvpEventCallback = (data: any) => void;
type GiftNotificationCallback = (senderName: string, itemName: string, isConsumable: boolean) => void;

export interface NetworkPlayerInfo {
  id: string;
  characterId: number;
  characterName: string;
  characterType: number;
  level: number;
  isHost: boolean;
  easyMode?: boolean;
  team?: 'blue' | 'red';
}

export class NetworkClient {
  private ws: WebSocket | null = null;
  private pendingRequests = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>();
  private onLobbyUpdate: LobbyUpdateCallback | null = null;
  private onDisconnect: DisconnectCallback | null = null;
  private onGameStart: GameStartCallback | null = null;
  private onPvpEvent: PvpEventCallback | null = null;
  private onGiftNotification: GiftNotificationCallback | null = null;
  private playerId: string = '';
  private _connected = false;

  get connected() { return this._connected; }
  get id() { return this.playerId; }

  setOnLobbyUpdate(cb: LobbyUpdateCallback) { this.onLobbyUpdate = cb; }
  setOnDisconnect(cb: DisconnectCallback) { this.onDisconnect = cb; }
  setOnGameStart(cb: GameStartCallback) { this.onGameStart = cb; }
  setOnPvpEvent(cb: PvpEventCallback) { this.onPvpEvent = cb; }
  setOnGiftNotification(cb: GiftNotificationCallback) { this.onGiftNotification = cb; }

  connect(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`ws://${host}:${port}`);
      } catch (e) {
        reject(e);
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('연결 시간 초과'));
        this.ws?.close();
      }, 5000);

      this.ws.onopen = () => {
        this._connected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          switch (msg.type) {
            case 'welcome':
              clearTimeout(timeout);
              this.playerId = msg.playerId;
              resolve();
              break;
            case 'rpc:response': {
              const pending = this.pendingRequests.get(msg.id);
              if (pending) {
                this.pendingRequests.delete(msg.id);
                if (msg.error) {
                  pending.reject(new Error(msg.error));
                } else {
                  pending.resolve(msg.result);
                }
              }
              break;
            }
            case 'lobby:players':
              if (this.onLobbyUpdate) {
                this.onLobbyUpdate(msg.players, msg.mode);
              }
              break;
            case 'room:info':
              // room info is also delivered via lobby:players mode field
              break;
            case 'game:started':
              if (this.onGameStart) {
                this.onGameStart(msg.mode);
              }
              break;
            case 'pvp:start':
            case 'pvp:attackResult':
            case 'pvp:gameOver':
              if (this.onPvpEvent) this.onPvpEvent(msg);
              break;
            case 'gift:notification':
              // 다른 플레이어로부터 선물 수신 알림 (DB는 호스트에서 직접 처리됨)
              if (this.onGiftNotification) {
                this.onGiftNotification(msg.senderName, msg.itemName, msg.isConsumable);
              }
              break;
            case 'server:closed':
              this._connected = false;
              if (this.onDisconnect) this.onDisconnect();
              break;
          }
        } catch (e) {
          console.error('Message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this._connected = false;
        for (const [, pending] of this.pendingRequests) {
          pending.reject(new Error('연결이 끊어졌습니다.'));
        }
        this.pendingRequests.clear();
        if (this.onDisconnect) this.onDisconnect();
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error('연결 실패'));
      };
    });
  }

  send(channel: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('연결되지 않았습니다.'));
        return;
      }

      const id = Math.random().toString(36).substring(2, 12);
      this.pendingRequests.set(id, { resolve, reject });

      this.ws.send(JSON.stringify({
        type: 'rpc',
        id,
        channel,
        data,
      }));

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('요청 시간 초과'));
        }
      }, 10000);
    });
  }

  selectCharacter(characterId: number, characterName: string, characterType: number, level: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'lobby:selectCharacter',
      characterId,
      characterName,
      characterType,
      level,
    }));
  }

  requestPlayers() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'lobby:getPlayers' }));
  }

  pvpReady(stats: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'pvp:ready', stats }));
  }

  pvpAttack() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'pvp:attack' }));
  }

  pvpEnd() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'pvp:end' }));
  }

  setTeam(team: 'blue' | 'red') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'lobby:setTeam', team }));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
    this.pendingRequests.clear();
  }
}
