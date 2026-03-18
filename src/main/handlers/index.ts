/**
 * 핸들러 통합 모듈
 * 도메인별로 분리된 핸들러를 하나의 HandlerMap으로 합쳐서 반환
 */
import { HandlerMap } from './types';
import { createAdminHandlers } from './admin';
import { createCharacterHandlers } from './character';
import { createReciteHandlers } from './recite';
import { createBattleHandlers } from './battle';
import { createInventoryHandlers } from './inventory';
import { createConsumableHandlers } from './consumable';
import { createBossHandlers } from './boss';
import { createPvpHandlers } from './pvp';
import { createFileHandlers } from './file-io';
import { createCutsceneHandlers } from './cutscene';
import { createDebugHandlers } from './debug';
import { createRoguelikeHandlers } from './roguelike';

export { HandlerMap } from './types';

export function createHandlers(): HandlerMap {
  return {
    ...createAdminHandlers(),
    ...createCharacterHandlers(),
    ...createReciteHandlers(),
    ...createBattleHandlers(),
    ...createInventoryHandlers(),
    ...createConsumableHandlers(),
    ...createBossHandlers(),
    ...createPvpHandlers(),
    ...createFileHandlers(),
    ...createCutsceneHandlers(),
    ...createDebugHandlers(),
    ...createRoguelikeHandlers(),
  };
}
