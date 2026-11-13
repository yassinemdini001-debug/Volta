import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';
import { TRANSLATIONS } from '../data/i18n';
import { STORY_CHAPTERS } from '../data/progression';
import { Language, MatchConfig, MatchSnapshot, MatchStats, ScreenState } from '../types/game';

interface MatchHUDProps {
  lang: Language;
  screen: ScreenState;
  config: MatchConfig;
  snapshot: MatchSnapshot;
  stats: MatchStats | null;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onNextChapter: () => void;
  onReturnHub: () => void;
  onVirtualAxis: (x: number, z: number) => void;
  onAction: (a: 'shootStart' | 'shootEnd' | 'pass' | 'skill' | 'switch') => void;
}

export const MatchHUD: React.FC<MatchHUDProps> = ({
  lang,
  screen,
  config,
  snapshot,
  stats,
  muted,
  onToggleMute,
  onPause,
  onResume,
  onRestart,
  onNextChapter,
  onReturnHub,
  onVirtualAxis,
  onAction,
}) => {
  const t = TRANSLATIONS[lang];
  const [calloutText, setCalloutText] = useState<string | null>(null);

  useEffect(() => {
    if (!snapshot.callout) return;
    const pool = t.callouts[snapshot.callout.key];
    const line = pool[snapshot.callout.id % pool.length];
    setCalloutText(snapshot.callout.playerName ? `${snapshot.callout.playerName} · ${line}` : line);
    const timer = window.setTimeout(() => setCalloutText(null), 2200);
    return () => clearTimeout(timer);
  }, [snapshot.callout, t.callouts]);

  const mins = Math.floor(snapshot.timeRemaining / 60);
  const secs = snapshot.timeRemaining % 60;
  const clockStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isArcade = config.mode === 'arcade';

  const hasNextChapter =
    config.mode === 'story' &&
    typeof config.storyChapterId === 'number' &&
    config.storyChapterId < STORY_CHAPTERS.length - 1 &&
    Boolean(stats?.won);

  return (
    <>
      {/* Live Match Minimalist Perimeter HUD (no backdrop-filter over WebGL!) */}
      {screen === 'playing' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-5">
          {/* Top Bar: Scoreboard + Utility */}
          <div className="flex items-start justify-between gap-4">
            <div className="text-xs font-semibold text-zinc-300 bg-[#0B0E14]/90 border border-white/10 px-3 py-1.5 rounded-lg">
              {t.locations[config.location].name}
              <span className="mx-1.5 text-zinc-500">·</span>
              <span className="font-mono-num text-amber-400">
                {isArcade ? t.arcade.games[config.arcadeGame!].name : config.format}
              </span>
            </div>

            {/* Center Scoreboard */}
            <div className="flex items-center gap-4 bg-[#0B0E14]/92 border border-white/15 rounded-xl px-4 py-2">
              {isArcade ? (
                <>
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-wider text-zinc-400">SCORE</div>
                    <div className="font-mono-num text-2xl font-bold text-amber-400">{snapshot.arcadeScore}</div>
                  </div>
                  <div className="h-7 w-px bg-white/10" />
                  <div className="font-mono-num text-xl font-bold text-white">{clockStr}</div>
                  <div className="h-7 w-px bg-white/10" />
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-wider text-zinc-400">{t.hud.style}</div>
                    <div className="font-mono-num text-xl font-bold text-sky-400">x{snapshot.styleCombo}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    <span className="font-display text-base font-bold text-white">VOLTA</span>
                    <span className="font-mono-num text-2xl font-bold text-amber-400">{snapshot.homeScore}</span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded bg-[#161B26] font-mono-num text-base font-bold text-white">
                    {clockStr}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-2xl font-bold text-sky-400">{snapshot.awayScore}</span>
                    <span className="font-display text-base font-bold text-zinc-200 truncate max-w-[110px]">
                      {config.opponentName}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                  </div>
                </>
              )}
            </div>

            {/* Top-Right Pause & Mute */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? t.hud.unmute : t.hud.mute}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0B0E14]/90 border border-white/10 text-zinc-200 hover:text-amber-400 cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onPause}
                aria-label={t.hud.paused}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0B0E14]/90 border border-white/10 text-zinc-200 hover:text-amber-400 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reactive Localized Commentary Callout */}
          {calloutText && (
            <div className="self-center mt-2 bg-[#0B0E14]/95 border border-amber-400/50 px-4 py-1.5 rounded-lg text-sm font-display font-bold tracking-wide text-amber-300">
              {calloutText}
            </div>
          )}

          {/* Bottom Stamina / Charge + Action Buttons */}
          <div className="mt-auto flex items-end justify-between gap-4">
            {/* Active Player Stamina & Shot Meter */}
            <div className="bg-[#0B0E14]/90 border border-white/10 rounded-lg px-3.5 py-2.5 w-52 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate">{snapshot.activePlayerName}</span>
                {snapshot.styleCombo > 1 && (
                  <span className="font-mono-num text-amber-400 font-bold">x{snapshot.styleCombo}</span>
                )}
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-transform duration-75"
                  style={{ width: `${Math.round(snapshot.stamina * 100)}%` }}
                />
              </div>
              {snapshot.shotCharge > 0.02 && (
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${Math.round(snapshot.shotCharge * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Interactive Touch / Mouse Quick Action Cluster */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="flex md:hidden items-center gap-1 mr-2">
                <button
                  type="button"
                  onPointerDown={() => onVirtualAxis(-1, 0)}
                  onPointerUp={() => onVirtualAxis(0, 0)}
                  onPointerLeave={() => onVirtualAxis(0, 0)}
                  className="w-10 h-10 rounded-lg bg-[#0B0E14]/90 border border-white/15 text-xs font-bold text-white"
                >
                  ◀
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onPointerDown={() => onVirtualAxis(0, -1)}
                    onPointerUp={() => onVirtualAxis(0, 0)}
                    onPointerLeave={() => onVirtualAxis(0, 0)}
                    className="w-10 h-8 rounded-lg bg-[#0B0E14]/90 border border-white/15 text-xs font-bold text-white"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => onVirtualAxis(0, 1)}
                    onPointerUp={() => onVirtualAxis(0, 0)}
                    onPointerLeave={() => onVirtualAxis(0, 0)}
                    className="w-10 h-8 rounded-lg bg-[#0B0E14]/90 border border-white/15 text-xs font-bold text-white"
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  onPointerDown={() => onVirtualAxis(1, 0)}
                  onPointerUp={() => onVirtualAxis(0, 0)}
                  onPointerLeave={() => onVirtualAxis(0, 0)}
                  className="w-10 h-10 rounded-lg bg-[#0B0E14]/90 border border-white/15 text-xs font-bold text-white"
                >
                  ▶
                </button>
              </div>

              <button
                type="button"
                onClick={() => onAction('switch')}
                className="px-3 py-2 rounded-lg bg-[#0B0E14]/90 border border-white/12 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              >
                Q
              </button>
              <button
                type="button"
                onClick={() => onAction('skill')}
                className="px-3.5 py-2 rounded-lg bg-[#0B0E14]/90 border border-sky-400/40 text-xs font-bold text-sky-300 hover:bg-sky-500/20 cursor-pointer"
              >
                E · {t.hud.skill}
              </button>
              <button
                type="button"
                onClick={() => onAction('pass')}
                className="px-3.5 py-2 rounded-lg bg-[#0B0E14]/90 border border-white/15 text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
              >
                J · {t.hud.pass}
              </button>
              <button
                type="button"
                onPointerDown={() => onAction('shootStart')}
                onPointerUp={() => onAction('shootEnd')}
                className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-xs font-extrabold text-zinc-950 cursor-pointer"
              >
                Space · {snapshot.isControllingOnBall ? t.hud.shoot : t.hud.tackle}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {screen === 'paused' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#090B10]/80">
          <div className="w-full max-w-sm bg-[#121620] border border-white/15 rounded-xl p-6 space-y-5 text-center">
            <h2 className="font-display text-3xl font-bold text-white">{t.hud.paused}</h2>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-display text-lg font-extrabold uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.hud.resume}</span>
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-2.5 rounded-lg bg-[#192030] hover:bg-[#222b40] border border-white/10 text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.hud.restart}</span>
              </button>
              <button
                type="button"
                onClick={onReturnHub}
                className="w-full py-2.5 rounded-lg bg-[#192030] hover:bg-[#222b40] border border-white/10 text-sm font-semibold text-zinc-300 cursor-pointer"
              >
                {t.hud.quit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Match Summary Modal */}
      {screen === 'postmatch' && stats && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#090B10]/82">
          <div className="w-full max-w-md bg-[#121620] border border-white/15 rounded-xl p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="text-xs font-mono-num uppercase tracking-wider text-zinc-400">{t.hud.fullTime}</div>
              <h2 className="font-display text-3xl font-extrabold text-white flex items-center justify-center gap-2">
                {stats.won && <Trophy className="w-6 h-6 text-amber-400" />}
                <span>
                  {isArcade
                    ? `${stats.arcadeScore} PTS`
                    : stats.won
                    ? t.hud.victory
                    : stats.homeScore === stats.awayScore
                    ? t.hud.draw
                    : t.hud.defeat}
                </span>
              </h2>
              {!isArcade && (
                <div className="font-mono-num text-4xl font-bold text-amber-400 pt-1">
                  {stats.homeScore} — {stats.awayScore}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#181E2B] border border-white/10 rounded-lg p-3 flex items-center justify-between">
                <span className="text-zinc-400">{t.hud.goals}</span>
                <span className="font-mono-num text-base font-bold text-white">{stats.goals}</span>
              </div>
              <div className="bg-[#181E2B] border border-white/10 rounded-lg p-3 flex items-center justify-between">
                <span className="text-zinc-400">{t.hud.nutmegs}</span>
                <span className="font-mono-num text-base font-bold text-amber-400">{stats.nutmegs}</span>
              </div>
              <div className="bg-[#181E2B] border border-white/10 rounded-lg p-3 flex items-center justify-between">
                <span className="text-zinc-400">{t.hud.wallPasses}</span>
                <span className="font-mono-num text-base font-bold text-sky-400">{stats.wallPasses}</span>
              </div>
              <div className="bg-[#181E2B] border border-white/10 rounded-lg p-3 flex items-center justify-between">
                <span className="text-zinc-400">{t.hud.repEarned}</span>
                <span className="font-mono-num text-base font-bold text-emerald-400">+{stats.repEarned}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {hasNextChapter && (
                <button
                  type="button"
                  onClick={onNextChapter}
                  className="flex-1 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-display text-lg font-extrabold uppercase cursor-pointer"
                >
                  {t.hud.nextChapter}
                </button>
              )}
              <button
                type="button"
                onClick={onRestart}
                className={`flex-1 py-3 rounded-lg font-display text-lg font-extrabold uppercase cursor-pointer ${
                  hasNextChapter
                    ? 'bg-[#192030] hover:bg-[#222b40] border border-white/10 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                }`}
              >
                {t.hud.playAgain}
              </button>
              <button
                type="button"
                onClick={onReturnHub}
                className="flex-1 py-3 rounded-lg bg-[#192030] hover:bg-[#222b40] border border-white/10 text-sm font-semibold text-zinc-200 cursor-pointer"
              >
                {t.hud.returnHub}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
