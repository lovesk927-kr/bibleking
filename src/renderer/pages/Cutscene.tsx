import React, { useState } from 'react';
import { CHARACTER_INFO } from '../constants';

interface CutsceneScene {
  speaker: string;
  speakerEmoji: string;
  lines: string[];
}

interface Props {
  scenes: CutsceneScene[];
  characterName: string;
  characterType: number;
  onComplete: () => void;
  title?: string;
}

export function Cutscene({ scenes, characterName, characterType, onComplete, title }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  const charInfo = CHARACTER_INFO[characterType];
  const avatar = charInfo?.image ? charInfo.emoji : (charInfo?.emoji || '🗡️');

  const replacePlaceholders = (text: string) => {
    return text.replace(/\{닉네임\}/g, characterName).replace(/\{아바타\}/g, avatar);
  };

  const currentScene = scenes[sceneIndex];
  if (!currentScene) {
    onComplete();
    return null;
  }

  const currentLine = currentScene.lines[lineIndex];
  const speaker = replacePlaceholders(currentScene.speaker);
  const speakerEmoji = currentScene.speakerEmoji === '{아바타}' ? avatar : currentScene.speakerEmoji;
  const displayLine = replacePlaceholders(currentLine || '');

  const handleNext = () => {
    if (lineIndex < currentScene.lines.length - 1) {
      setLineIndex(lineIndex + 1);
    } else if (sceneIndex < scenes.length - 1) {
      setSceneIndex(sceneIndex + 1);
      setLineIndex(0);
    } else {
      onComplete();
    }
  };

  const isLast = sceneIndex === scenes.length - 1 && lineIndex === currentScene.lines.length - 1;
  const progress = scenes.reduce((acc, s, i) => {
    if (i < sceneIndex) return acc + s.lines.length;
    if (i === sceneIndex) return acc + lineIndex + 1;
    return acc;
  }, 0);
  const total = scenes.reduce((acc, s) => acc + s.lines.length, 0);

  return (
    <div className="page cutscene-page">
      {title && <div className="cutscene-title">{title}</div>}
      <div className="cutscene-progress-bar">
        <div className="cutscene-progress-fill" style={{ width: `${(progress / total) * 100}%` }}></div>
      </div>
      <div className="cutscene-box">
        <div className="cutscene-speaker">
          <span className="cutscene-speaker-emoji">{speakerEmoji}</span>
          <span className="cutscene-speaker-name">{speaker}</span>
        </div>
        <div className="cutscene-dialogue">
          {displayLine}
        </div>
      </div>
      <button className="btn btn-primary cutscene-next-btn" onClick={handleNext}>
        {isLast ? '시작하기' : '다음'}
      </button>
    </div>
  );
}
