import React, { useEffect, useState } from 'react';
import type { Character, Item } from '../types';
import { RARITY_COLORS, RARITY_NAMES, ITEM_TYPE_NAMES, ITEM_TYPE_EMOJI } from '../constants';
import { useApi } from '../api-context';

interface Props {
  character: Character;
  onBack: () => void;
}

type SubPage = 'list' | 'enhance' | 'synthesize';

const getDisplayName = (item: Item) => {
  return item.enhance_level > 0 ? `${item.name} +${item.enhance_level}` : item.name;
};

const getEffectiveStat = (item: Item) => {
  const enhanceBonus = item.stat_type === 'evasion' ? Math.floor(item.enhance_level * 0.5) : item.enhance_level * 3;
  return item.stat_bonus + enhanceBonus;
};

const getStatLabel = (statType: string) => {
  return statType === 'attack' ? '공격력' : statType === 'defense' ? '방어력' : statType === 'evasion' ? '회피율' : '체력';
};

const getEnhanceRate = (nextLevel: number) => {
  if (nextLevel <= 5) return 100;
  const rates: Record<number, number> = { 6: 80, 7: 60, 8: 40, 9: 20, 10: 10 };
  return rates[nextLevel] ?? 5;
};

const CONSUMABLE_INFO: Record<string, { name: string; emoji: string; description: string }> = {
  perfect_score: { name: '암송 100점권', emoji: '📜', description: '사용 시 암송 점수가 자동으로 100점 처리됩니다.' },
  hint: { name: '힌트권', emoji: '💡', description: '사용 시 20초간 정답이 표시됩니다.' },
};

export function Inventory({ character, onBack }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [otherCharacters, setOtherCharacters] = useState<Character[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [subPage, setSubPage] = useState<SubPage>('list');
  const [targetItem, setTargetItem] = useState<Item | null>(null);
  const [prevItem, setPrevItem] = useState<Item | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultSuccess, setResultSuccess] = useState(false);
  const [consumables, setConsumables] = useState<{ type: string; quantity: number }[]>([]);
  const { api } = useApi();

  useEffect(() => {
    loadItems();
    loadOtherCharacters();
    loadConsumables();
  }, []);

  const loadConsumables = async () => {
    const data = await api.getConsumables(character.id);
    setConsumables(data);
  };

  const loadItems = async () => {
    const data = await api.getItems(character.id);
    data.sort((a: Item, b: Item) => {
      const nameCompare = a.name.localeCompare(b.name, 'ko');
      if (nameCompare !== 0) return nameCompare;
      return getEffectiveStat(b) - getEffectiveStat(a);
    });
    setItems(data);
  };

  const loadOtherCharacters = async () => {
    const all = await api.getCharacters();
    setOtherCharacters(all.filter((c: Character) => c.id !== character.id));
  };

  const handleEquip = async (item: Item) => {
    if (item.is_equipped) {
      await api.unequipItem({ ciId: item.ci_id, characterId: character.id });
    } else {
      await api.equipItem({ characterId: character.id, ciId: item.ci_id, itemType: item.type });
    }
    setSelectedItem(null);
    loadItems();
  };

  const handleDiscard = async (item: Item) => {
    if (confirm(`"${getDisplayName(item)}"을(를) 버리시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      await api.discardItem({ ciId: item.ci_id, characterId: character.id });
      setSelectedItem(null);
      loadItems();
    }
  };

  const handleTransfer = async (item: Item, toCharacterId: number) => {
    const result = await api.transferItem({
      ciId: item.ci_id,
      fromCharacterId: character.id,
      toCharacterId,
    });
    alert(result.message);
    if (result.success) {
      setSelectedItem(null);
      setShowTransfer(false);
      loadItems();
    }
  };

  // 같은 이름 + 같은 등급의 미장착 아이템 목록
  const getSynthesisMaterials = (item: Item) => {
    return items.filter(
      (i) => i.ci_id !== item.ci_id && i.name === item.name && i.rarity === item.rarity && !i.is_equipped
    );
  };

  // 같은 이름의 미장착 아이템 목록 (강화 재료)
  const getEnhanceMaterials = (item: Item) => {
    return items.filter(
      (i) => i.ci_id !== item.ci_id && i.name === item.name && !i.is_equipped
    );
  };

  // 강화 페이지 진입
  const openEnhance = (item: Item) => {
    setTargetItem(item);
    setResultMessage(null);
    setSubPage('enhance');
  };

  // 합성 페이지 진입
  const openSynthesize = (item: Item) => {
    setTargetItem(item);
    setResultMessage(null);
    setSubPage('synthesize');
  };

  // 강화 실행
  const doEnhance = async () => {
    if (!targetItem) return;
    const materials = getEnhanceMaterials(targetItem);
    if (materials.length < 1) return;
    if (!confirm(`정말 강화하시겠습니까?`)) return;

    setPrevItem({ ...targetItem });
    const result = await api.enhanceItem({
      characterId: character.id,
      targetCiId: targetItem.ci_id,
      materialCiId: materials[0].ci_id,
    });
    setResultMessage(result.message);
    setResultSuccess(result.success);
    await loadItems();
    const updated = (await api.getItems(character.id)).find((i: Item) => i.ci_id === targetItem.ci_id);
    if (updated) setTargetItem(updated);
  };

  // 합성 실행
  const doSynthesize = async () => {
    if (!targetItem) return;
    const materials = getSynthesisMaterials(targetItem);
    if (materials.length < 2) return;

    const all3 = [targetItem, materials[0], materials[1]];
    const enhanced = all3.filter(i => i.enhance_level > 0);
    if (enhanced.length > 0) {
      const warn = enhanced.map(i => `${i.name} +${i.enhance_level}`).join(', ');
      if (!confirm(`강화된 아이템이 포함되어 있습니다.\n(${warn})\n합성 시 강화 수치는 사라집니다. 계속하시겠습니까?`)) return;
    } else {
      if (!confirm(`정말 합성하시겠습니까?`)) return;
    }

    setPrevItem({ ...targetItem });
    const ciIds = [targetItem.ci_id, materials[0].ci_id, materials[1].ci_id];
    const result = await api.synthesizeItem({ characterId: character.id, ciIds });
    setResultMessage(result.message || '');
    setResultSuccess(result.success !== false);
    await loadItems();
    if (result.success && result.newItem) {
      setTargetItem(result.newItem);
    }
  };

  const goBackToList = () => {
    setSubPage('list');
    setTargetItem(null);
    setPrevItem(null);
    setSelectedItem(null);
    setResultMessage(null);
  };

  const filterItems = (list: Item[]) => {
    if (filter === 'all') return list;
    return list.filter(i => i.type === filter);
  };

  const equipped = filterItems(items.filter((i) => i.is_equipped));
  const unequipped = filterItems(items.filter((i) => !i.is_equipped));

  const filterTabs = [
    { key: 'all', label: '전체' },
    { key: 'weapon', label: '🗡️ 무기' },
    { key: 'helmet', label: '⛑️ 투구' },
    { key: 'chest', label: '🛡️ 가슴' },
    { key: 'belt', label: '🪢 허리' },
    { key: 'shield', label: '🛡️ 방패' },
    { key: 'shoes', label: '👢 신발' },
    { key: 'consumable', label: '📜 소모품' },
  ];

  const isConsumableTab = filter === 'consumable';

  const renderItemCard = (item: Item) => (
    <div
      key={item.ci_id}
      className={`item-card ${item.is_equipped ? 'equipped' : ''} ${selectedItem?.ci_id === item.ci_id ? 'selected' : ''}`}
      style={{ borderColor: RARITY_COLORS[item.rarity] }}
      onClick={() => setSelectedItem(selectedItem?.ci_id === item.ci_id ? null : item)}
    >
      <div className="item-emoji">{ITEM_TYPE_EMOJI[item.type]}</div>
      <div className="item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
        {getDisplayName(item)}
      </div>
      <div className="item-rarity">Lv.{item.level_req} [{RARITY_NAMES[item.rarity]}] {ITEM_TYPE_NAMES[item.type]}</div>
      <div className="item-stat">
        {getStatLabel(item.stat_type)} +{getEffectiveStat(item)}
        {item.enhance_level > 0 && <span className="enhance-detail"> ({item.stat_bonus}+{item.stat_type === 'evasion' ? Math.floor(item.enhance_level * 0.5) : item.enhance_level * 3})</span>}
      </div>
    </div>
  );

  // ========== 강화 페이지 ==========
  if (subPage === 'enhance' && targetItem) {
    const materials = getEnhanceMaterials(targetItem);
    const nextLevel = targetItem.enhance_level + 1;
    const rate = getEnhanceRate(nextLevel);
    const canEnhance = materials.length >= 1 && !resultMessage;

    return (
      <div className="page forge-page">
        <h1 className="title">🔨 강화</h1>

        <div className="forge-main-item" style={{ borderColor: RARITY_COLORS[targetItem.rarity] }}>
          <div className="forge-item-emoji">{ITEM_TYPE_EMOJI[targetItem.type]}</div>
          <div className="forge-item-name" style={{ color: RARITY_COLORS[targetItem.rarity] }}>
            {getDisplayName(targetItem)}
          </div>
          <div className="forge-item-rarity">Lv.{targetItem.level_req} [{RARITY_NAMES[targetItem.rarity]}] {ITEM_TYPE_NAMES[targetItem.type]}</div>
          <div className="forge-item-stat">
            {getStatLabel(targetItem.stat_type)} +{getEffectiveStat(targetItem)}
          </div>
          {targetItem.enhance_level > 0 && (
            <div className="forge-item-detail">기본 {targetItem.stat_bonus} + 강화 {targetItem.stat_type === 'evasion' ? Math.floor(targetItem.enhance_level * 0.5) : targetItem.enhance_level * 3}</div>
          )}
        </div>

        {resultMessage ? (
          <div className={`forge-result ${resultSuccess ? 'success' : 'fail'}`}>
            <div className="forge-result-icon">{resultSuccess ? '✨' : '💔'}</div>
            <div className="forge-result-text">{resultMessage}</div>
            {prevItem && (
              <div className="forge-compare">
                <div className="forge-compare-item">
                  <div className="forge-compare-label">BEFORE</div>
                  <div className="forge-compare-name" style={{ color: RARITY_COLORS[prevItem.rarity] }}>{getDisplayName(prevItem)}</div>
                  <div className="forge-compare-rarity">Lv.{prevItem.level_req} [{RARITY_NAMES[prevItem.rarity]}]</div>
                  <div className="forge-compare-stat">{getStatLabel(prevItem.stat_type)} +{getEffectiveStat(prevItem)}</div>
                </div>
                <div className="forge-compare-arrow">{resultSuccess ? '→' : '✕'}</div>
                <div className="forge-compare-item">
                  <div className="forge-compare-label">{resultSuccess ? 'AFTER' : 'UNCHANGED'}</div>
                  <div className="forge-compare-name" style={{ color: RARITY_COLORS[targetItem.rarity] }}>{getDisplayName(targetItem)}</div>
                  <div className="forge-compare-rarity">Lv.{targetItem.level_req} [{RARITY_NAMES[targetItem.rarity]}]</div>
                  <div className="forge-compare-stat">
                    {getStatLabel(targetItem.stat_type)} +{getEffectiveStat(targetItem)}
                    {resultSuccess && getEffectiveStat(targetItem) > getEffectiveStat(prevItem) && (
                      <span className="forge-compare-diff"> (+{getEffectiveStat(targetItem) - getEffectiveStat(prevItem)})</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="forge-arrow">⬇️</div>
            <div className="forge-section-title">재료 (같은 이름 아이템 1개 소모)</div>
            <div className="forge-materials">
              {materials.length > 0 ? (
                materials.slice(0, 3).map(m => (
                  <div key={m.ci_id} className="forge-material-card" style={{ borderColor: RARITY_COLORS[m.rarity] }}>
                    <span className="forge-material-emoji">{ITEM_TYPE_EMOJI[m.type]}</span>
                    <span className="forge-material-name" style={{ color: RARITY_COLORS[m.rarity] }}>{getDisplayName(m)}</span>
                    <span className="forge-material-stat">{getStatLabel(m.stat_type)} +{getEffectiveStat(m)}</span>
                  </div>
                ))
              ) : (
                <div className="forge-no-material">재료가 없습니다</div>
              )}
              {materials.length > 3 && <div className="forge-material-more">외 {materials.length - 3}개</div>}
            </div>
          </>
        )}

        <div className="forge-actions">
          {!resultMessage && (
            <button
              className={`btn btn-enhance-large ${!canEnhance ? 'disabled' : ''}`}
              onClick={doEnhance}
              disabled={!canEnhance}
            >
              강화하기 (성공률 {rate}%)
            </button>
          )}
          <button className="btn btn-secondary" onClick={goBackToList}>돌아가기</button>
        </div>
      </div>
    );
  }

  // ========== 합성 페이지 ==========
  if (subPage === 'synthesize' && targetItem) {
    const materials = getSynthesisMaterials(targetItem);
    const canSynthesize = materials.length >= 2 && !resultMessage;
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'mythic'];
    const nextRarityIdx = rarityOrder.indexOf(targetItem.rarity) + 1;
    const nextRarity = nextRarityIdx < rarityOrder.length ? rarityOrder[nextRarityIdx] : null;

    return (
      <div className="page forge-page">
        <h1 className="title">🔮 합성</h1>

        <div className="forge-main-item" style={{ borderColor: RARITY_COLORS[resultMessage ? (nextRarity || targetItem.rarity) : targetItem.rarity] }}>
          <div className="forge-item-emoji">{ITEM_TYPE_EMOJI[targetItem.type]}</div>
          <div className="forge-item-name" style={{ color: RARITY_COLORS[resultMessage ? (nextRarity || targetItem.rarity) : targetItem.rarity] }}>
            {getDisplayName(targetItem)}
          </div>
          <div className="forge-item-rarity">
            Lv.{targetItem.level_req} [{RARITY_NAMES[resultMessage ? (nextRarity || targetItem.rarity) : targetItem.rarity]}] {ITEM_TYPE_NAMES[targetItem.type]}
          </div>
          <div className="forge-item-stat">
            {getStatLabel(targetItem.stat_type)} +{getEffectiveStat(targetItem)}
          </div>
        </div>

        {resultMessage ? (
          <div className={`forge-result ${resultSuccess ? 'success' : 'fail'}`}>
            <div className="forge-result-icon">{resultSuccess ? '🌟' : '💔'}</div>
            <div className="forge-result-text">{resultMessage}</div>
            {prevItem && resultSuccess && (
              <div className="forge-compare">
                <div className="forge-compare-item">
                  <div className="forge-compare-label">BEFORE</div>
                  <div className="forge-compare-name" style={{ color: RARITY_COLORS[prevItem.rarity] }}>{getDisplayName(prevItem)}</div>
                  <div className="forge-compare-rarity">Lv.{prevItem.level_req} [{RARITY_NAMES[prevItem.rarity]}]</div>
                  <div className="forge-compare-stat">{getStatLabel(prevItem.stat_type)} +{getEffectiveStat(prevItem)}</div>
                </div>
                <div className="forge-compare-arrow">→</div>
                <div className="forge-compare-item">
                  <div className="forge-compare-label">AFTER</div>
                  <div className="forge-compare-name" style={{ color: RARITY_COLORS[targetItem.rarity] }}>{getDisplayName(targetItem)}</div>
                  <div className="forge-compare-rarity">Lv.{targetItem.level_req} [{RARITY_NAMES[targetItem.rarity]}]</div>
                  <div className="forge-compare-stat">
                    {getStatLabel(targetItem.stat_type)} +{getEffectiveStat(targetItem)}
                    {getEffectiveStat(targetItem) > getEffectiveStat(prevItem) && (
                      <span className="forge-compare-diff"> (+{getEffectiveStat(targetItem) - getEffectiveStat(prevItem)})</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="forge-arrow">⬇️</div>
            <div className="forge-section-title">재료 (같은 이름 + 같은 등급 2개 소모)</div>
            <div className="forge-materials">
              {materials.slice(0, 2).map(m => (
                <div key={m.ci_id} className="forge-material-card" style={{ borderColor: RARITY_COLORS[m.rarity] }}>
                  <span className="forge-material-emoji">{ITEM_TYPE_EMOJI[m.type]}</span>
                  <span className="forge-material-name" style={{ color: RARITY_COLORS[m.rarity] }}>{getDisplayName(m)}</span>
                  <span className="forge-material-stat">{getStatLabel(m.stat_type)} +{getEffectiveStat(m)}</span>
                </div>
              ))}
              {materials.length < 2 && (
                <div className="forge-no-material">재료 부족 ({materials.length}/2)</div>
              )}
            </div>
            {nextRarity && (
              <div className="forge-hint">
                [{RARITY_NAMES[targetItem.rarity]}] 3개 → [{RARITY_NAMES[nextRarity]}] 1개
              </div>
            )}
          </>
        )}

        <div className="forge-actions">
          {!resultMessage && (
            <button
              className={`btn btn-synthesize-large ${!canSynthesize ? 'disabled' : ''}`}
              onClick={doSynthesize}
              disabled={!canSynthesize}
            >
              합성하기
            </button>
          )}
          <button className="btn btn-secondary" onClick={goBackToList}>돌아가기</button>
        </div>
      </div>
    );
  }

  // ========== 아이템 목록 (기본) ==========
  const renderSelectedPanel = () => {
    if (!selectedItem) return null;
    const synthMaterials = getSynthesisMaterials(selectedItem);
    const enhMaterials = getEnhanceMaterials(selectedItem);
    const canSynthesize = !selectedItem.is_equipped && selectedItem.rarity !== 'mythic' && synthMaterials.length >= 2;
    const canEnhance = enhMaterials.length >= 1;

    return (
      <div className="item-detail-panel">
        <div className="item-detail-header">
          <span className="item-detail-emoji">{ITEM_TYPE_EMOJI[selectedItem.type]}</span>
          <div>
            <div className="item-detail-name" style={{ color: RARITY_COLORS[selectedItem.rarity] }}>
              {getDisplayName(selectedItem)}
            </div>
            <div className="item-detail-rarity">Lv.{selectedItem.level_req} [{RARITY_NAMES[selectedItem.rarity]}] {ITEM_TYPE_NAMES[selectedItem.type]}</div>
          </div>
        </div>
        <div className="item-detail-stat">
          {getStatLabel(selectedItem.stat_type)} +{getEffectiveStat(selectedItem)}
        </div>

        <div className="item-detail-actions">
          <button className="btn btn-small btn-equip" onClick={() => handleEquip(selectedItem)}>
            {selectedItem.is_equipped ? '장착 해제' : '장착하기'}
          </button>

          <button
            className={`btn btn-small btn-enhance ${!canEnhance ? 'disabled' : ''}`}
            onClick={() => canEnhance && openEnhance(selectedItem)}
            disabled={!canEnhance}
          >
            강화 ({enhMaterials.length}개 재료)
          </button>

          <button
            className={`btn btn-small btn-synthesize ${!canSynthesize ? 'disabled' : ''}`}
            onClick={() => canSynthesize && openSynthesize(selectedItem)}
            disabled={!canSynthesize}
          >
            합성 ({Math.min(synthMaterials.length, 2)}/2 재료)
          </button>

          {!selectedItem.is_equipped && otherCharacters.length > 0 && (
            <button className="btn btn-small btn-transfer" onClick={() => setShowTransfer(!showTransfer)}>
              전달
            </button>
          )}

          {!selectedItem.is_equipped && (
            <button className="btn btn-small btn-discard-action" onClick={() => handleDiscard(selectedItem)}>
              버리기
            </button>
          )}
        </div>

        {showTransfer && !selectedItem.is_equipped && (
          <div className="transfer-panel">
            <div className="transfer-title">누구에게 전달할까요?</div>
            {otherCharacters.map((c) => (
              <button
                key={c.id}
                className="btn btn-small btn-transfer-target"
                onClick={() => handleTransfer(selectedItem, c.id)}
              >
                {c.name} (Lv.{c.level})
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page inventory">
      <h1 className="title">🎒 가방</h1>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '10px', fontSize: '14px', padding: '6px 16px' }}>뒤로가기</button>

      <div className="item-filter-tabs">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            className={`item-filter-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => { setFilter(tab.key); setSelectedItem(null); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isConsumableTab ? (
        <div className="inventory-section">
          <h2 className="section-title">소모품</h2>
          {consumables.length === 0 ? (
            <p className="empty-text">소모품이 없습니다. 전투 승리 시 획득할 수 있습니다.</p>
          ) : (
            <div className="consumable-list">
              {consumables.map(c => {
                const info = CONSUMABLE_INFO[c.type];
                if (!info) return null;
                return (
                  <div key={c.type} className="consumable-card">
                    <span className="consumable-emoji">{info.emoji}</span>
                    <div className="consumable-info">
                      <div className="consumable-name">{info.name}</div>
                      <div className="consumable-desc">{info.description}</div>
                    </div>
                    <span className="consumable-qty">x{c.quantity}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {renderSelectedPanel()}

          {equipped.length > 0 && (
            <div className="inventory-section">
              <h2 className="section-title">장착 중</h2>
              <div className="item-grid">
                {equipped.map((item) => renderItemCard(item))}
              </div>
            </div>
          )}

          <div className="inventory-section">
            <h2 className="section-title">보관함 ({unequipped.length})</h2>
            {unequipped.length === 0 ? (
              <p className="empty-text">아이템이 없습니다. 암송 도전으로 레벨업하여 아이템을 획득하세요!</p>
            ) : (
              <div className="item-grid">
                {unequipped.map((item) => renderItemCard(item))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
