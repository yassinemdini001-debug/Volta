import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { AvatarStudio } from './components/AvatarStudio';
import { MatchHUD } from './components/MatchHUD';
import { MatchHubModal } from './components/MatchHubModal';
import { TitleScreen } from './components/TitleScreen';
import { TRANSLATIONS } from './data/i18n';
import { loadSaveProgress, persistSaveProgress, STORY_CHAPTERS } from './data/progression';
import { VoltaEngine } from './engine/VoltaEngine';
import {
  AvatarConfig,
  HubTab,
  Language,
  LocationId,
  MatchConfig,
  MatchFormat,
  MatchSnapshot,
  MatchStats,
  PlayerRole,
  SaveProgress,
  ScreenState,
  SquadConfig,
} from './types/game';

const INITIAL_SNAPSHOT: MatchSnapshot = {
  homeScore: 0,
  awayScore: 0,
  timeRemaining: 90,
  stamina: 1,
  shotCharge: 0,
  styleCombo: 1,
  arcadeScore: 0,
  hasBall: false,
  isControllingOnBall: false,
  callout: null,
  activePlayerName: 'YASSINE',
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<VoltaEngine | null>(null);

  const [lang, setLang] = useState<Language>('en');
  const [screen, setScreen] = useState<ScreenState>('title');
  const [hubTab, setHubTab] = useState<HubTab>('quick');
  const [muted, setMuted] = useState(false);

  const [save, setSave] = useState<SaveProgress>(() => loadSaveProgress());
  const [selectedLocation, setSelectedLocation] = useState<LocationId>('mellassine');
  const [format, setFormat] = useState<MatchFormat>('3v3');
  const [wallBounce, setWallBounce] = useState(true);
  const [noGoalkeeper, setNoGoalkeeper] = useState(true);
  const [durationSec, setDurationSec] = useState(90);

  const [activeMatchConfig, setActiveMatchConfig] = useState<MatchConfig>({
    mode: 'quick',
    location: 'mellassine',
    format: '3v3',
    wallBounce: true,
    noGoalkeeper: true,
    durationSec: 90,
    opponentName: 'STREET XI',
    opponentColor: '#06b6d4',
  });
  const activeMatchConfigRef = useRef(activeMatchConfig);
  activeMatchConfigRef.current = activeMatchConfig;

  const [snapshot, setSnapshot] = useState<MatchSnapshot>(INITIAL_SNAPSHOT);
  const [postStats, setPostStats] = useState<MatchStats | null>(null);

  // Sync document direction for Arabic RTL vs French/English LTR
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Persist save changes
  const updateSave = useCallback((updater: (prev: SaveProgress) => SaveProgress) => {
    setSave((prev) => {
      const next = updater(prev);
      persistSaveProgress(next);
      engineRef.current?.updateSaveProgress(next);
      return next;
    });
  }, []);

  const handleMatchEnd = useCallback(
    (stats: MatchStats) => {
      const cfg = activeMatchConfigRef.current;
      let earned = stats.repEarned;
      updateSave((prev) => {
        const next = structuredClone(prev);
        if (cfg.mode === 'story' && typeof cfg.storyChapterId === 'number' && stats.won) {
          const reward = TRANSLATIONS[lang].story.chapters[cfg.storyChapterId].reward;
          earned += reward;
          if (!next.completedChapters.includes(cfg.storyChapterId)) {
            next.completedChapters.push(cfg.storyChapterId);
          }
          next.unlockedStoryChapter = Math.min(
            STORY_CHAPTERS.length - 1,
            Math.max(next.unlockedStoryChapter, cfg.storyChapterId + 1)
          );
        }
        if (cfg.mode === 'arcade' && cfg.arcadeGame) {
          next.bestArcade[cfg.arcadeGame] = Math.max(next.bestArcade[cfg.arcadeGame] || 0, stats.arcadeScore);
        }
        if (cfg.mode === 'squads') {
          if (stats.won) {
            next.squad.wins += 1;
            next.squad.points += 85;
          } else {
            next.squad.points += 20;
          }
        }
        const prevLevel = Math.floor(next.rep / 180);
        next.rep += earned;
        const newLevel = Math.floor(next.rep / 180);
        if (newLevel > prevLevel) {
          next.skillPoints += newLevel - prevLevel;
        }
        return next;
      });
      setPostStats({ ...stats, repEarned: earned });
      setScreen('postmatch');
    },
    [lang, updateSave]
  );

  const handleMatchEndRef = useRef(handleMatchEnd);
  handleMatchEndRef.current = handleMatchEnd;

  // Mount Three.js engine once in isolated ref container
  useEffect(() => {
    if (!mountRef.current) return;
    const engine = new VoltaEngine(mountRef.current, save, {
      onSnapshot: (snap) => setSnapshot(snap),
      onMatchEnd: (stats) => handleMatchEndRef.current(stats),
    });
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMatch = useCallback((cfg: MatchConfig) => {
    soundEngine.playUiClick();
    setActiveMatchConfig(cfg);
    setPostStats(null);
    setScreen('playing');
    engineRef.current?.startMatch(cfg);
  }, []);

  const handleQuickKickOff = useCallback(() => {
    startMatch({
      mode: 'quick',
      location: selectedLocation,
      format,
      wallBounce,
      noGoalkeeper,
      durationSec,
      opponentName: 'STREET XI',
      opponentColor: '#06b6d4',
    });
  }, [durationSec, format, noGoalkeeper, selectedLocation, startMatch, wallBounce]);

  // Global keyboard shortcuts for Title (Enter) and Match Pause (Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (screen === 'playing') {
          engineRef.current?.setPaused(true);
          setScreen('paused');
        } else if (screen === 'paused') {
          engineRef.current?.setPaused(false);
          setScreen('playing');
        } else if (screen === 'hub' || screen === 'avatar') {
          engineRef.current?.setTitleScreenMode(selectedLocation);
          setScreen('title');
        }
      } else if (e.code === 'Enter' && screen === 'title') {
        handleQuickKickOff();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleQuickKickOff, screen, selectedLocation]);

  const handleSelectLocation = (loc: LocationId) => {
    soundEngine.playUiClick();
    setSelectedLocation(loc);
    engineRef.current?.loadLocation(loc);
  };

  const handleOpenAvatar = () => {
    soundEngine.playUiClick();
    engineRef.current?.setAvatarPreviewMode(save.avatar);
    setScreen('avatar');
  };

  const handleCloseAvatar = () => {
    soundEngine.playUiClick();
    engineRef.current?.setTitleScreenMode(selectedLocation);
    setScreen('title');
  };

  const handleUpdateAvatar = (avatar: AvatarConfig) => {
    updateSave((prev) => ({ ...prev, avatar }));
  };

  const handleUpgradeSkill = (role: PlayerRole, idx: 0 | 1 | 2) => {
    soundEngine.playUiClick();
    updateSave((prev) => {
      if (prev.skillPoints <= 0 || prev.skills[role][idx] >= 3) return prev;
      const next = structuredClone(prev);
      next.skillPoints -= 1;
      next.skills[role][idx] += 1;
      return next;
    });
  };

  const handleUpdateSquad = (squad: SquadConfig) => {
    updateSave((prev) => ({ ...prev, squad }));
  };

  const handleToggleMute = () => {
    setMuted(soundEngine.toggleMute());
  };

  const handleNextChapter = () => {
    if (typeof activeMatchConfig.storyChapterId !== 'number') return;
    const nextIdx = activeMatchConfig.storyChapterId + 1;
    if (nextIdx >= STORY_CHAPTERS.length) return;
    const ch = STORY_CHAPTERS[nextIdx];
    const chText = TRANSLATIONS[lang].story.chapters[nextIdx];
    startMatch({
      mode: 'story',
      location: ch.location,
      format: ch.format,
      wallBounce: ch.wallBounce,
      noGoalkeeper: ch.noGoalkeeper,
      durationSec: ch.durationSec,
      storyChapterId: ch.id,
      opponentName: chText.rival,
      opponentColor: ch.opponentColor,
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090B10] select-none">
      {/* Isolated Three.js WebGL Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {screen === 'title' && (
        <TitleScreen
          lang={lang}
          onChangeLang={(l) => {
            soundEngine.playUiClick();
            setLang(l);
          }}
          muted={muted}
          onToggleMute={handleToggleMute}
          rep={save.rep}
          featuredLocation={selectedLocation}
          onQuickKickOff={handleQuickKickOff}
          onOpenHub={() => {
            soundEngine.playUiClick();
            setScreen('hub');
          }}
          onOpenAvatar={handleOpenAvatar}
        />
      )}

      {screen === 'hub' && (
        <MatchHubModal
          lang={lang}
          activeTab={hubTab}
          onChangeTab={(tab) => {
            soundEngine.playUiClick();
            setHubTab(tab);
          }}
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          format={format}
          onChangeFormat={setFormat}
          wallBounce={wallBounce}
          onToggleWallBounce={setWallBounce}
          noGoalkeeper={noGoalkeeper}
          onToggleNoGk={setNoGoalkeeper}
          durationSec={durationSec}
          onChangeDuration={setDurationSec}
          save={save}
          onUpdateSquad={handleUpdateSquad}
          onStartMatch={startMatch}
          onOpenAvatar={handleOpenAvatar}
          onBackToTitle={() => {
            soundEngine.playUiClick();
            engineRef.current?.setTitleScreenMode(selectedLocation);
            setScreen('title');
          }}
        />
      )}

      {screen === 'avatar' && (
        <AvatarStudio
          lang={lang}
          save={save}
          onUpdateAvatar={handleUpdateAvatar}
          onUpgradeSkill={handleUpgradeSkill}
          onClose={handleCloseAvatar}
        />
      )}

      {(screen === 'playing' || screen === 'paused' || screen === 'postmatch') && (
        <MatchHUD
          lang={lang}
          screen={screen}
          config={activeMatchConfig}
          snapshot={snapshot}
          stats={postStats}
          muted={muted}
          onToggleMute={handleToggleMute}
          onPause={() => {
            engineRef.current?.setPaused(true);
            setScreen('paused');
          }}
          onResume={() => {
            engineRef.current?.setPaused(false);
            setScreen('playing');
          }}
          onRestart={() => startMatch(activeMatchConfig)}
          onNextChapter={handleNextChapter}
          onReturnHub={() => {
            engineRef.current?.setTitleScreenMode(selectedLocation);
            setScreen('hub');
          }}
          onVirtualAxis={(x, z) => engineRef.current?.setVirtualAxis(x, z)}
          onAction={(a) => engineRef.current?.triggerAction(a)}
        />
      )}
    </div>
  );
}
