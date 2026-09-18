import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameConfig, GameScreenState, LevelConfig } from '../types';
import { playStudioBridge } from '../utils/playStudioBridge';
import { 
  Heart, Trophy, Timer, Play, RotateCcw, ArrowLeft, Sparkles, 
  Cake, AlertTriangle, ChevronRight, Volume2, VolumeX, ShieldAlert
} from 'lucide-react';

interface GameCanvasProps {
  config: GameConfig;
  isStandalone?: boolean;
}

interface FallingItem {
  id: string;
  type: 'normal' | 'golden' | 'bomb';
  x: number; // percentage 0-90
  y: number; // percentage 0-90
  speed: number;
  size: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ config, isStandalone = false }) => {
  const [screenState, setScreenState] = useState<GameScreenState>('WELCOME');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [levelScore, setLevelScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(config.mechanics.startingLives);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [basketX, setBasketX] = useState<number>(45); // percentage 0-85
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number; color: string }[]>([]);
  const [basketState, setBasketState] = useState<'moving' | 'catch' | 'hit'>('moving');
  const basketStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerBasketState = useCallback((state: 'catch' | 'hit') => {
    setBasketState(state);
    if (basketStateTimeoutRef.current) {
      clearTimeout(basketStateTimeoutRef.current);
    }
    basketStateTimeoutRef.current = setTimeout(() => {
      setBasketState('moving');
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (basketStateTimeoutRef.current) {
        clearTimeout(basketStateTimeoutRef.current);
      }
    };
  }, []);

  // Asset load error trackers
  const [basketError, setBasketError] = useState<boolean>(false);
  const [basketErrors, setBasketErrors] = useState<Record<string, boolean>>({});
  const [normalCakeError, setNormalCakeError] = useState<boolean>(false);
  const [goldenCakeError, setGoldenCakeError] = useState<boolean>(false);
  const [bombError, setBombError] = useState<boolean>(false);
  const [bgErrors, setBgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setBgErrors({});
  }, [config.backgrounds]);

  // Preload all game assets at config load to eliminate image-swapping latency
  useEffect(() => {
    const urlsToPreload: string[] = [];
    const basketImages = config.assets.basketImages;
    if (basketImages) {
      if (basketImages.moving?.value) urlsToPreload.push(basketImages.moving.value);
      if (basketImages.catch?.value) urlsToPreload.push(basketImages.catch.value);
      if (basketImages.hit?.value) urlsToPreload.push(basketImages.hit.value);
    }
    if (config.assets.basketUrl) urlsToPreload.push(config.assets.basketUrl);
    if (config.assets.normalCakeUrl) urlsToPreload.push(config.assets.normalCakeUrl);
    if (config.assets.goldenCupcakeUrl) urlsToPreload.push(config.assets.goldenCupcakeUrl);
    if (config.assets.bombUrl) urlsToPreload.push(config.assets.bombUrl);

    // Preload default Unsplash fallback assets as well
    urlsToPreload.push("https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=60");
    urlsToPreload.push("https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=150&auto=format&fit=crop&q=60");
    urlsToPreload.push("https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=150&auto=format&fit=crop&q=60");

    urlsToPreload.forEach(url => {
      if (url && url.trim() !== '') {
        const img = new Image();
        img.src = url;
      }
    });
  }, [config]);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<FallingItem[]>([]);
  const [, forceRender] = useState({});
  const gameLoopRef = useRef<number | null>(null);
  const spawnerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const basketWidth = config.assets.basketSize || 18;
  const itemConfigSize = config.assets.itemSize || 42;
  const itemWidthPercent = Math.max(5, Math.min(15, (itemConfigSize / 400) * 100));

  const getBasketImageSrcForState = (state: 'moving' | 'catch' | 'hit') => {
    const basketImages = config.assets.basketImages;
    
    const getValidUrl = (s: 'moving' | 'catch' | 'hit') => {
      if (basketErrors[s]) return null;
      const stateObj = basketImages?.[s];
      if (stateObj && stateObj.value && stateObj.value.trim() !== '') {
        return stateObj.value;
      }
      return null;
    };

    // 1. Try state-specific custom image
    const activeUrl = getValidUrl(state);
    if (activeUrl) return activeUrl;

    // 2. If catch/hit custom image fails or is missing, try moving custom image
    if (state === 'catch' || state === 'hit') {
      const movingUrl = getValidUrl('moving');
      if (movingUrl) return movingUrl;
    }

    // 3. Try fallback standard basketUrl
    if (!basketErrors['standard'] && config.assets.basketUrl && config.assets.basketUrl.trim() !== '') {
      return config.assets.basketUrl;
    }

    // 4. Ultimate polished Unsplash fallbacks
    if (state === 'catch') {
      return "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=150&auto=format&fit=crop&q=60";
    }
    if (state === 'hit') {
      return "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=150&auto=format&fit=crop&q=60";
    }
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=60";
  };

  const getBasketImageSrc = () => {
    return getBasketImageSrcForState(basketState);
  };

  const getScreenBackground = (screenName: 'welcome' | 'play' | 'success' | 'failed') => {
    const bgConfig = config.backgrounds?.[screenName] || {
      enabled: true,
      type: 'none',
      value: '',
      fallbackColor: screenName === 'failed' ? '#EAF7FF' : '#FFF7F2'
    };

    const hasError = bgErrors[screenName];
    const showImage = bgConfig.enabled && bgConfig.type !== 'none' && bgConfig.value && !hasError;

    return (
      <div 
        className="absolute inset-0 select-none pointer-events-none transition-colors duration-500 overflow-hidden"
        style={{ 
          backgroundColor: bgConfig.fallbackColor || (screenName === 'failed' ? '#EAF7FF' : '#FFF7F2'),
          zIndex: 0 
        }}
      >
        {showImage && (
          <img
            src={bgConfig.value}
            alt={`${screenName} background`}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ 
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 0
            }}
            onError={() => {
              setBgErrors(prev => ({ ...prev, [screenName]: true }));
            }}
          />
        )}
      </div>
    );
  };

  useEffect(() => {
    setBasketError(false);
    setBasketErrors({});
  }, [config.assets.basketUrl, config.assets.basketImages]);

  const currentLevel: LevelConfig = config.levels[currentLevelIndex] || config.levels[0];
  const totalLevels = config.levels.length;

  // Handle Game Start
  const startGame = useCallback(() => {
    setCurrentLevelIndex(0);
    setScore(0);
    setLevelScore(0);
    setLives(config.mechanics.startingLives);
    setTimeLeft(currentLevel.durationSeconds || config.mechanics.defaultDuration);
    setScreenState('PLAYING');
    itemsRef.current = [];

    playStudioBridge.sendEvent(
      'GAME_START',
      { current: 1, total: totalLevels, hasNextLevel: totalLevels > 1 },
      { levelScore: 0, totalScore: 0 },
      'ongoing',
      { timeSpentSeconds: 0, livesRemaining: config.mechanics.startingLives }
    );
  }, [config, currentLevel, totalLevels]);

  // Initialize Game on Mount
  useEffect(() => {
    playStudioBridge.sendEvent(
      'GAME_INIT',
      { current: currentLevelIndex + 1, total: totalLevels, hasNextLevel: currentLevelIndex < totalLevels - 1 },
      { levelScore: 0, totalScore: score },
      'pending',
      { timeSpentSeconds: 0, livesRemaining: lives }
    );
  }, [currentLevelIndex, totalLevels, score, lives]);

  // Sync lives when config changes on welcome screen
  useEffect(() => {
    if (screenState === 'WELCOME') {
      setLives(config.mechanics.startingLives);
    }
  }, [config.mechanics.startingLives, screenState]);

  // Start Level Timer
  useEffect(() => {
    if (screenState === 'PLAYING') {
      const duration = currentLevel.durationSeconds || config.mechanics.defaultDuration;
      setTimeLeft(duration);
      setLevelScore(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleLevelTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentLevelIndex, screenState]);

  const handleLevelTimeout = () => {
    // Check if target score reached
    if (levelScore >= currentLevel.targetScore) {
      handleLevelComplete();
    } else {
      handleLevelFail('Time ran out before reaching target score!');
    }
  };

  const handleLevelComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnerRef.current) clearInterval(spawnerRef.current);
    itemsRef.current = [];

    const hasNext = currentLevelIndex < totalLevels - 1;

    playStudioBridge.sendEvent(
      'LEVEL_COMPLETED',
      { current: currentLevelIndex + 1, total: totalLevels, hasNextLevel: hasNext },
      { levelScore, totalScore: score },
      'ongoing',
      { timeSpentSeconds: playStudioBridge.getElapsedSeconds(), livesRemaining: lives }
    );

    if (hasNext) {
      setScreenState('LEVEL_COMPLETE');
    } else {
      setScreenState('VICTORY');
      playStudioBridge.sendEvent(
        'GAME_COMPLETED',
        { current: currentLevelIndex + 1, total: totalLevels, hasNextLevel: false },
        { levelScore, totalScore: score },
        'completed',
        { timeSpentSeconds: playStudioBridge.getElapsedSeconds(), livesRemaining: lives, stars: 3 }
      );
    }
  };

  const handleLevelFail = (reason: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnerRef.current) clearInterval(spawnerRef.current);
    itemsRef.current = [];

    playStudioBridge.sendEvent(
      'LEVEL_FAILED',
      { current: currentLevelIndex + 1, total: totalLevels, hasNextLevel: false },
      { levelScore, totalScore: score },
      'failed',
      { timeSpentSeconds: playStudioBridge.getElapsedSeconds(), livesRemaining: lives, reason }
    );

    playStudioBridge.sendEvent(
      'GAME_OVER',
      { current: currentLevelIndex + 1, total: totalLevels, hasNextLevel: false },
      { levelScore, totalScore: score },
      'failed',
      { timeSpentSeconds: playStudioBridge.getElapsedSeconds(), livesRemaining: lives }
    );

    setScreenState('GAME_OVER');
  };

  const advanceToNextLevel = () => {
    const nextIdx = currentLevelIndex + 1;
    if (nextIdx < totalLevels) {
      setCurrentLevelIndex(nextIdx);
      setLevelScore(0);
      setTimeLeft(config.levels[nextIdx].durationSeconds || 30);
      setScreenState('PLAYING');
    }
  };

  // Item Spawner
  useEffect(() => {
    if (screenState === 'PLAYING') {
      if (spawnerRef.current) clearInterval(spawnerRef.current);

      spawnerRef.current = setInterval(() => {
        const rand = Math.random();
        let type: 'normal' | 'golden' | 'bomb' = 'normal';
        const goldenProb = currentLevel.goldenProbability ?? 0.15;
        const bombProb = currentLevel.bombProbability ?? 0.1;

        if (rand < goldenProb) {
          type = 'golden';
        } else if (rand < goldenProb + bombProb) {
          type = 'bomb';
        }

        const newItem: FallingItem = {
          id: Math.random().toString(36).substring(2, 9),
          type,
          x: Math.floor(Math.random() * (100 - itemWidthPercent)), // 0 to 100 - itemWidthPercent width
          y: -10,
          speed: (currentLevel.fallSpeed || 2) * (config.mechanics.gravityCoefficient || 1) * (0.8 + Math.random() * 0.4),
          size: type === 'golden' ? (itemConfigSize + 2) : type === 'bomb' ? (itemConfigSize - 2) : itemConfigSize,
        };

        itemsRef.current.push(newItem);
      }, currentLevel.spawnIntervalMs || 1000);

      return () => {
        if (spawnerRef.current) clearInterval(spawnerRef.current);
      };
    }
  }, [currentLevelIndex, screenState, config]);

  // Game Loop for updating item positions and collision detection
  useEffect(() => {
    if (screenState === 'PLAYING') {
      const updateGame = () => {
        const updatedItems: FallingItem[] = [];

        for (const item of itemsRef.current) {
          const nextY = item.y + item.speed;

          // Check precise DOM-based collision
          let isCaught = false;
          let isMissed = false;

          const itemEl = document.getElementById(`game-item-${item.id}`);
          const basketImgEl = document.getElementById('game-basket-image');

          if (itemEl && basketImgEl) {
            const itemRect = itemEl.getBoundingClientRect();
            const basketRect = basketImgEl.getBoundingClientRect();

            // Create a smaller catch zone near the top opening of the basket
            const catchZone = {
              left: basketRect.left + basketRect.width * 0.15,
              right: basketRect.right - basketRect.width * 0.15,
              top: basketRect.top,
              bottom: basketRect.top + basketRect.height * 0.45
            };

            const itemCenterX = itemRect.left + itemRect.width / 2;
            const itemBottomY = itemRect.bottom;

            // Only trigger catch when the item center falls into that catch zone
            isCaught =
              itemCenterX >= catchZone.left &&
              itemCenterX <= catchZone.right &&
              itemBottomY >= catchZone.top &&
              itemBottomY <= catchZone.bottom;

            // If item has fallen past the catch zone's bottom threshold without being caught
            if (!isCaught && itemBottomY > catchZone.bottom) {
              isMissed = true;
            }
          } else {
            // Fallback check if elements aren't loaded in the DOM yet
            const basketLeft = basketX + (basketWidth * 0.15);
            const basketRight = basketX + basketWidth - (basketWidth * 0.15);
            const itemCenter = item.x + (itemWidthPercent / 2);

            isCaught = nextY >= 88 && nextY <= 92.5 && itemCenter >= basketLeft && itemCenter <= basketRight;
            if (!isCaught && nextY > 92.5) {
              isMissed = true;
            }
          }

          if (isCaught) {
            // Caught!
            if (item.type === 'normal') {
              setScore((s) => s + 10);
              setLevelScore((ls) => {
                const newLs = ls + 10;
                if (newLs >= currentLevel.targetScore) {
                  setTimeout(() => handleLevelComplete(), 50);
                }
                return newLs;
              });
              showFloatingText('+10', item.x, 85, '#16a34a');
              triggerBasketState('catch');
            } else if (item.type === 'golden') {
              setScore((s) => s + 30);
              setLevelScore((ls) => {
                const newLs = ls + 30;
                if (newLs >= currentLevel.targetScore) {
                  setTimeout(() => handleLevelComplete(), 50);
                }
                return newLs;
              });
              showFloatingText('+30 ✨', item.x, 85, '#d97706');
              triggerBasketState('catch');
            } else if (item.type === 'bomb') {
              setScore((s) => Math.max(0, s - 15));
              setLevelScore((ls) => Math.max(0, ls - 15));
              showFloatingText('-15 💥', item.x, 85, '#dc2626');
              triggerBasketState('hit');
              setLives((l) => {
                const newLives = l - 1;
                if (newLives <= 0) {
                  setTimeout(() => handleLevelFail('Lost all lives!'), 50);
                }
                return newLives;
              });
            }
            continue; // remove item
          }

          if (isMissed || nextY > 105) {
            continue; // remove item
          }

          updatedItems.push({ ...item, y: nextY });
        }

        itemsRef.current = updatedItems;
        forceRender({});
        gameLoopRef.current = requestAnimationFrame(updateGame);
      };

      gameLoopRef.current = requestAnimationFrame(updateGame);
      return () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      };
    }
  }, [screenState, basketX, currentLevel, basketWidth, itemWidthPercent, triggerBasketState, config]);

  const showFloatingText = (text: string, x: number, y: number, color: string) => {
    const id = Math.random().toString();
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 800);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenState !== 'PLAYING') return;
      const step = config.mechanics.basketSpeed || 8;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setBasketX((prev) => Math.max(0, prev - step));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setBasketX((prev) => Math.min(100 - basketWidth, prev + step));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenState, config.mechanics.basketSpeed, basketWidth]);

  // Mouse / Touch drag handlers on container
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (screenState !== 'PLAYING' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    setBasketX(Math.max(0, Math.min(100 - basketWidth, percentage - basketWidth / 2)));
  };

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerMove}
      className="mobile-stage w-full h-full select-none"
      style={{
        fontFamily: config.branding.fontFamily || 'system-ui, sans-serif',
      }}
    >
      <style>{`
        .mobile-stage {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }

        .screen {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 24px;
          padding-top: max(24px, env(safe-area-inset-top));
          padding-bottom: max(32px, env(safe-area-inset-bottom));
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .game-screen {
          display: grid;
          grid-template-rows: auto 1fr auto;
          height: 100%;
          gap: 12px;
          padding: 16px;
          padding-top: max(16px, env(safe-area-inset-top));
          padding-bottom: 0px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .game-hud {
          flex-shrink: 0;
          z-index: 3;
        }

        .play-area {
          position: relative;
          overflow: hidden;
          min-height: 0;
          z-index: 1;
        }

        .basket-area {
          position: relative;
          height: clamp(90px, 14vh, 130px);
          flex-shrink: 0;
          z-index: 2;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }

        .basket {
          position: absolute;
          bottom: calc(max(16px, env(safe-area-inset-bottom)) + 20px);
        }

        .result-screen {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 24px;
          padding-bottom: max(36px, env(safe-area-inset-bottom));
          box-sizing: border-box;
          overflow: hidden;
        }

        .result-content {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: clamp(16px, 3vh, 28px);
        }

        .result-button-wrap {
          flex-shrink: 0;
          padding-bottom: max(16px, env(safe-area-inset-bottom));
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .result-button {
          width: 100%;
          min-height: 60px;
        }

        @media (max-height: 760px) {
          .screen {
            padding-top: 16px;
            padding-bottom: 20px;
          }

          .result-content {
            gap: 12px;
          }

          .result-button {
            min-height: 54px;
          }

          .basket-area {
            height: 90px;
          }
        }
      `}</style>

      {/* Background layer (Z-Index 0) */}
      {screenState === 'WELCOME' && getScreenBackground('welcome')}
      {screenState === 'PLAYING' && getScreenBackground('play')}
      {(screenState === 'LEVEL_COMPLETE' || screenState === 'VICTORY') && getScreenBackground('success')}
      {screenState === 'GAME_OVER' && getScreenBackground('failed')}

      {/* ================= WELCOME SCREEN ================= */}
      {screenState === 'WELCOME' && (
        <div className="screen flex flex-col items-center justify-between relative z-10 bg-transparent">
          {isStandalone && <div className="flex-1" />}

          {!isStandalone && (
            <>
              <div className="pt-8 text-center">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-white/80 backdrop-blur-sm text-slate-700 shadow-sm mb-4">
                  Whitelabel Mini-Game
                </span>
                {config.branding.logoUrl && !basketError ? (
                  <img 
                    src={config.branding.logoUrl} 
                    alt="Logo" 
                    className="w-24 h-24 mx-auto object-contain rounded-2xl shadow-md mb-3 bg-white/50 p-2"
                    onError={() => setBasketError(true)}
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-white shadow-lg flex items-center justify-center text-rose-500 mb-3">
                    <Cake className="w-10 h-10" />
                  </div>
                )}
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 drop-shadow-sm">
                  {config.branding.gameTitle || 'Bakery Basket Catch'}
                </h1>
                <p className="text-slate-600 text-sm max-w-xs mx-auto font-medium">
                  Catch delicious cakes and golden cupcakes! Avoid the dropping burnt coal and trash.
                </p>
              </div>

              <div className="w-full max-w-xs bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/40 mb-6">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-2">
                  <span>Levels Available:</span>
                  <span className="text-rose-500">{config.levels.length} Stages</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                  <span>Starting Hearts:</span>
                  <div className="flex gap-1 text-rose-500">
                     {[...Array(Math.min(5, config.mechanics.startingLives))].map((_, i) => (
                      <Heart key={i} className="w-4 h-4 fill-rose-500" />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="w-full pb-8 max-w-xs flex justify-center">
            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl font-bold text-white shadow-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
              style={{ backgroundColor: config.branding.primaryColor || '#f87171' }}
            >
              <Play className="w-6 h-6 fill-current" />
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ================= ACTIVE GAMEPLAY SCREEN ================= */}
      {screenState === 'PLAYING' && (
        <div className="screen game-screen relative z-10 bg-transparent">
          {/* Row 1: Top HUD */}
          <div className="game-hud flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-white/60">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {currentLevel.name}
              </span>
              <span className="text-sm font-black text-slate-800">
                {levelScore} / <span className="text-rose-500">{currentLevel.targetScore}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
              <span className="text-sm font-bold text-amber-800">00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>

            <div className="flex items-center gap-1">
              {[...Array(config.mechanics.startingLives)].map((_, i) => (
                <Heart 
                  key={i} 
                  className={`w-4 h-4 transition-all duration-300 ${
                    i < lives ? 'fill-rose-500 text-rose-500 scale-100' : 'text-slate-300 scale-90'
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* Row 2: Play Area */}
          <div className="play-area">
            {/* Falling Items */}
            {itemsRef.current.map((item) => (
              <div
                key={item.id}
                id={`game-item-${item.id}`}
                className="absolute transition-transform duration-75 flex items-center justify-center"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.size}px`,
                  height: `${item.size}px`,
                }}
              >
                {item.type === 'normal' && (
                  !normalCakeError ? (
                    <img 
                      src={config.assets.normalCakeUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&auto=format&fit=crop&q=60"} 
                      alt="Cake" 
                      className="w-full h-full object-contain drop-shadow-md animate-spin-slow"
                      onError={() => setNormalCakeError(true)}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-amber-200 shadow-md flex items-center justify-center text-amber-800">
                      <Cake className="w-6 h-6" />
                    </div>
                  )
                )}

                {item.type === 'golden' && (
                  !goldenCakeError ? (
                    <img 
                      src={config.assets.goldenCupcakeUrl || "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=100&auto=format&fit=crop&q=60"} 
                      alt="Golden Cupcake" 
                      className="w-full h-full object-contain drop-shadow-lg animate-bounce"
                      onError={() => setGoldenCakeError(true)}
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Pulsing Outer Golden Spark Halo */}
                      <div className="absolute -inset-2 rounded-full border-2 border-yellow-400 opacity-60 animate-ping" />
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-80 blur-sm animate-pulse" />
                      {/* Core Fallback Cupcake with Shimmering Sparkles */}
                      <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-xl border border-yellow-300 flex items-center justify-center text-white animate-bounce">
                        <Sparkles className="w-6 h-6 text-yellow-100 animate-spin-slow" />
                      </div>
                    </div>
                  )
                )}

                {item.type === 'bomb' && (
                  !bombError ? (
                    <img 
                      src={config.assets.bombUrl || "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=100&auto=format&fit=crop&q=60"} 
                      alt="Coal/Bomb" 
                      className="w-full h-full object-contain drop-shadow-md"
                      onError={() => setBombError(true)}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 shadow-md flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )
                )}
              </div>
            ))}

            {/* Floating Score Popups */}
            {floatingTexts.map((ft) => (
              <div 
                key={ft.id}
                className="absolute text-sm font-black animate-fade-up pointer-events-none drop-shadow"
                style={{ left: `${ft.x}%`, top: `${ft.y}%`, color: ft.color }}
              >
                {ft.text}
              </div>
            ))}
          </div>

          {/* Row 3: Basket Control Area */}
          <div className="basket-area">
            <div 
              className="basket transition-all duration-75 flex flex-col items-center relative"
              style={{ left: `${basketX}%`, width: `${basketWidth}%` }}
              id="game-basket-container"
            >
              {config.mechanics.showDebugZone && (
                <div 
                  className="absolute border-2 border-emerald-500 bg-emerald-500/45 z-50 pointer-events-none rounded animate-pulse"
                  style={{
                    left: '15%',
                    width: '70%',
                    top: '0%',
                    height: '45%',
                  }}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                    CATCH ZONE
                  </div>
                </div>
              )}
              {/* State-specific image or fallback rendering (Permanently mounted to prevent image decoding flickering) */}
              <div className={`w-full ${basketState === 'moving' ? 'block' : 'hidden'}`}>
                {!basketErrors['moving'] ? (
                  <img 
                    id="game-basket-image-moving"
                    src={getBasketImageSrcForState('moving')} 
                    alt="Basket" 
                    className="w-full h-auto object-contain drop-shadow-xl"
                    onError={() => setBasketErrors(prev => ({ ...prev, moving: true }))}
                  />
                ) : (
                  <div 
                    className="w-full h-12 bg-amber-700 rounded-b-2xl shadow-xl border-2 border-amber-900 flex items-center justify-center text-amber-200"
                  >
                    <Cake className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className={`w-full ${basketState === 'catch' ? 'block' : 'hidden'}`}>
                {!basketErrors['catch'] ? (
                  <img 
                    id="game-basket-image-catch"
                    src={getBasketImageSrcForState('catch')} 
                    alt="Basket Catch" 
                    className="w-full h-auto object-contain drop-shadow-xl scale-105 brightness-110 drop-shadow-[0_0_15px_rgba(34,197,94,0.85)]"
                    onError={() => setBasketErrors(prev => ({ ...prev, catch: true }))}
                  />
                ) : (
                  <div 
                    className="w-full h-12 rounded-b-2xl shadow-xl border-2 flex items-center justify-center bg-emerald-600 border-emerald-800 text-emerald-100 scale-105 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
                  >
                    <Cake className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className={`w-full ${basketState === 'hit' ? 'block' : 'hidden'}`}>
                {!basketErrors['hit'] ? (
                  <img 
                    id="game-basket-image-hit"
                    src={getBasketImageSrcForState('hit')} 
                    alt="Basket Hit" 
                    className="w-full h-auto object-contain drop-shadow-xl scale-95 brightness-90 saturate-50 drop-shadow-[0_0_15px_rgba(239,68,68,0.85)] animate-bounce"
                    onError={() => setBasketErrors(prev => ({ ...prev, hit: true }))}
                  />
                ) : (
                  <div 
                    className="w-full h-12 rounded-b-2xl shadow-xl border-2 flex items-center justify-center bg-rose-700 border-rose-900 text-rose-100 scale-95 animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                  >
                    <Cake className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= LEVEL COMPLETE SUB-PAGE ================= */}
      {screenState === 'LEVEL_COMPLETE' && (
        <div className="screen result-screen bg-transparent text-center animate-fade-in relative z-10">
          <div className="result-content">
            {/* Cute Scallop Badge Heading */}
            <div className="relative px-4 py-4 bg-white border-4 border-[#4a2e25] rounded-[24px] shadow-sm max-w-[280px] w-full text-center">
              <h1 className="text-xl font-black text-[#e06d64] tracking-tight leading-none filter drop-shadow-[0_1.5px_0_rgba(74,46,37,1)]" style={{ color: '#e06d64' }}>
                Sweet Success!
              </h1>
              <div className="mt-1.5 text-[8px] uppercase tracking-wider font-extrabold text-[#4a2e25] bg-amber-50 rounded-full py-0.5 px-2.5 border border-[#4a2e25] inline-block">
                Level Complete!
              </div>
            </div>

            {/* Container Box Card */}
            <div className="bg-white rounded-[20px] border-4 border-[#4a2e25] p-4 shadow-sm max-w-[240px] w-full text-center my-2">
              <div className="text-[9px] font-black uppercase text-[#4a2e25] tracking-widest">
                YOUR SCORE
              </div>
              <div className="text-2xl font-black text-[#e06d64] my-1 flex items-center justify-center gap-1.5">
                <span className="text-sm text-emerald-600">🌿</span>
                <span>{levelScore}/{currentLevel.targetScore}</span>
                <span className="text-sm text-emerald-600">🌿</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-bold mb-2">
              You successfully completed {currentLevel.name}!
            </div>
          </div>

          {/* Action Button */}
          <div className="result-button-wrap">
            <button
              onClick={advanceToNextLevel}
              className="result-button max-w-[240px] rounded-full font-black text-white bg-[#231f20] hover:bg-black shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              → Continue
            </button>
          </div>
        </div>
      )}

      {/* ================= VICTORY SUB-PAGE ================= */}
      {screenState === 'VICTORY' && (
        <div className="screen result-screen bg-transparent text-center animate-fade-in relative z-10">
          <div className="result-content">
            {/* Cute Scallop Badge Heading */}
            <div className="relative px-4 py-4 bg-white border-4 border-[#4a2e25] rounded-[24px] shadow-sm max-w-[280px] w-full text-center">
              <h1 className="text-xl font-black text-[#e06d64] tracking-tight leading-none filter drop-shadow-[0_1.5px_0_rgba(74,46,37,1)]" style={{ color: '#e06d64' }}>
                Sweet Success!
              </h1>
              <div className="mt-1.5 text-[8px] uppercase tracking-wider font-extrabold text-[#4a2e25] bg-amber-50 rounded-full py-0.5 px-2.5 border border-[#4a2e25] inline-block">
                All Stages Cleared!
              </div>
            </div>

            {/* Container Box Card */}
            <div className="bg-white rounded-[20px] border-4 border-[#4a2e25] p-4 shadow-sm max-w-[240px] w-full text-center my-2">
              <div className="text-[9px] font-black uppercase text-[#4a2e25] tracking-widest">
                TOTAL SCORE
              </div>
              <div className="text-2xl font-black text-[#e06d64] my-1 flex items-center justify-center gap-1.5">
                <span className="text-sm text-emerald-600">🌿</span>
                <span>{score}</span>
                <span className="text-sm text-emerald-600">🌿</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-bold mb-2">
              You are the Ultimate Master Baker!
            </div>
          </div>

          {/* Action Buttons */}
          <div className="result-button-wrap gap-2">
            <button
              onClick={startGame}
              className="result-button max-w-[240px] py-3.5 rounded-full font-black text-white bg-[#231f20] hover:bg-black shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider mb-2"
            >
              → Continue
            </button>
            {!isStandalone && (
              <button
                onClick={() => setScreenState('WELCOME')}
                className="result-button max-w-[240px] py-3 rounded-full font-black text-[#231f20] bg-white border-2 border-[#231f20] hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                ← Home Menu
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= GAME OVER SUB-PAGE ================= */}
      {screenState === 'GAME_OVER' && (
        <div className="screen result-screen bg-transparent text-center animate-fade-in relative z-10">
          <div className="result-content">
            {/* Oh Crumbs Badge Heading */}
            <div className="relative px-4 py-4 bg-white border-4 border-[#4a2e25] rounded-[24px] shadow-sm max-w-[280px] w-full text-center">
              <h1 className="text-xl font-black text-[#5ba1d8] tracking-tight leading-none filter drop-shadow-[0_1.5px_0_rgba(74,46,37,1)]" style={{ color: '#5ba1d8' }}>
                Oh, Crumbs!
              </h1>
              <div className="mt-1.5 text-[8px] uppercase tracking-wider font-extrabold text-[#4a2e25] bg-slate-100 rounded-full py-0.5 px-2.5 border border-[#4a2e25] inline-block">
                A few treats escaped. Try again!
              </div>
            </div>

            {/* Container Box Card */}
            <div className="bg-white rounded-[20px] border-4 border-[#4a2e25] p-4 shadow-sm max-w-[240px] w-full text-center my-2">
              <div className="text-[9px] font-black uppercase text-[#4a2e25] tracking-widest">
                YOUR SCORE
              </div>
              <div className="text-2xl font-black text-[#e06d64] my-1 flex items-center justify-center gap-1.5">
                <span className="text-sm text-emerald-600">🌿</span>
                <span>{score}/{currentLevel.targetScore}</span>
                <span className="text-sm text-emerald-600">🌿</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="result-button-wrap gap-2">
            <button
              onClick={startGame}
              className="result-button max-w-[240px] py-3.5 rounded-full font-black text-white bg-[#231f20] hover:bg-black shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider mb-2"
            >
              → Continue
            </button>
            {!isStandalone && (
              <button
                onClick={() => setScreenState('WELCOME')}
                className="result-button max-w-[240px] py-3 rounded-full font-black text-[#231f20] bg-white border-2 border-[#231f20] hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                ← Home
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
