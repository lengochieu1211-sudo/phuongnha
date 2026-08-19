/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CharacterId, AnimState, CategoryType } from '../types';
import { renderCharacterSvg } from '../utils/characterRenderer';
import { voiceGuide } from '../lib/VoiceGuideService';

interface CharacterAvatarProps {
  characterId: CharacterId;
  animState?: AnimState;
  equipped?: { [key in CategoryType]?: string };
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function CharacterAvatar({
  characterId,
  animState = 'idle',
  equipped = {},
  size = 180,
  className = '',
  onClick,
}: CharacterAvatarProps) {
  const [tick, setTick] = useState<number>(0);
  const [isTalking, setIsTalking] = useState<boolean>(false);

  // Subscribe to voice guide speaking state for facial lip-sync
  useEffect(() => {
    const unsubscribe = voiceGuide.subscribeSpeakingState((speaking) => {
      setIsTalking(speaking);
    });
    return () => unsubscribe();
  }, []);

  // Tick loop for continuous procedural ear bounce, tail wiggle, breathing
  useEffect(() => {
    let animId: number;
    const updateTick = () => {
      setTick((t) => (t + 1) % 1000);
      animId = requestAnimationFrame(updateTick);
    };
    animId = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const svgHtml = renderCharacterSvg({
    characterId,
    animState,
    equipped,
    width: size,
    height: size,
    tick,
    isTalking,
  });

  return (
    <div
      onClick={onClick}
      className={`inline-block select-none transition-transform duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}

