import React from 'react';
import { ArrowLeft, CheckCircle2, Lock, Play, Shield, Trophy, Zap } from 'lucide-react';
import { TRANSLATIONS } from '../data/i18n';
import { LOCATION_LIST, LOCATIONS } from '../data/locations';
import { GLOBAL_CREWS, STORY_CHAPTERS } from '../data/progression';
import {
  ArcadeMiniGame,
  HubTab,
  Language,
  LocationId,
  MatchConfig,
  MatchFormat,
  SaveProgress,
  SquadConfig,
} from '../types/game';
import { CrewCrest } from './VoltaLogo';

interface MatchHubModalProps {
  lang: Language;
  activeTab: HubTab;
  onChangeTab: (tab: HubTab) => void;
  selectedLocation: LocationId;
  onSelectLocation: (loc: LocationId) => void;
  format: MatchFormat;
  onChangeFormat: (f: MatchFormat) => void;
  wallBounce: boolean;
  onToggleWallBounce: (v: boolean) => void;
  noGoalkeeper: boolean;
  onToggleNoGk: (v: boolean) => void;
  durationSec: number;
  onChangeDuration: (d: number) => void;
  save: SaveProgress;
  onUpdateSquad: (s: SquadConfig) => void;
  onStartMatch: (cfg: MatchConfig) => void;
  onOpenAvatar: () => void;
  onBackToTitle: () => void;
}

export const MatchHubModal: React.FC<MatchHubModalProps> = ({
  lang,
  activeTab,
  onChangeTab,
  selectedLocation,
  onSelectLocation,
  format,
  onChangeFormat,
  wallBounce,
  onToggleWallBounce,
  noGoalkeeper,
  onToggleNoGk,
  durationSec,
  onChangeDuration,
  save,
  onUpdateSquad,
  onStartMatch,
  onOpenAvatar,
  onBackToTitle,
}) => {
  const t = TRANSLATIONS[lang];
  const tunisiaLocs = LOCATION_LIST.filter((l) => l.region === 'tunisia');
  const globalLocs = LOCATION_LIST.filter((l) => l.region === 'global');

  const launchQuickMatch = () => {
    onStartMatch({
      mode: 'quick',
      location: selectedLocation,
      format,
      wallBounce,
      noGoalkeeper,
      durationSec,
      opponentName: 'STREET XI',
      opponentColor: '#06b6d4',
    });
  };

  const launchStoryChapter = (idx: number) => {
    const ch = STORY_CHAPTERS[idx];
    const chText = t.story.chapters[idx];
    onStartMatch({
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

  const launchArcade = (game: ArcadeMiniGame) => {
    onStartMatch({
      mode: 'arcade',
      arcadeGame: game,
      location: selectedLocation,
      format: '3v3',
      wallBounce: true,
      noGoalkeeper: game !== 'wallvolley',
      durationSec: 45,
      opponentName: 'CHALLENGER',
      opponentColor: '#ef4444',
    });
  };

  const launchSquadMatch = () => {
    const topRival = GLOBAL_CREWS[Math.floor(Math.random() * 3)];
    onStartMatch({
      mode: 'squads',
      location: save.squad.homeLocation,
      format: '4v4',
      wallBounce: true,
      noGoalkeeper: false,
      durationSec: 90,
      opponentName: topRival.name,
      opponentColor: topRival.color,
    });
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 md:p-8 bg-[#090B10]/70">
      <div className="w-full max-w-5xl max-h-[88vh] bg-[#0E121B] border border-white/12 rounded-xl flex flex-col overflow-hidden">
        {/* Top Hub Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10">
          <button
            type="button"
            onClick={onBackToTitle}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.rules.backToTitle}</span>
          </button>

          {/* Segmented Mode Tabs */}
          <div className="flex items-center gap-1 bg-[#161B26] p-1 rounded-lg border border-white/10">
            {(['quick', 'story', 'arcade', 'squads'] as HubTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onChangeTab(tab)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab ? 'bg-amber-400 text-zinc-950' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {t.tabs[tab]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenAvatar}
            className="px-3.5 py-1.5 rounded-lg bg-[#161B26] hover:bg-[#1e2536] border border-white/10 text-xs font-semibold text-sky-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            {t.tabs.avatar} · <span className="font-mono-num text-amber-400">{save.skillPoints} SP</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto volta-scroll p-5 md:p-6">
          {activeTab === 'quick' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: 8 Locations Grid */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h3 className="text-xs font-bold tracking-wider uppercase text-amber-400 mb-2.5">
                    {t.rules.regionTunisia}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tunisiaLocs.map((loc) => {
                      const active = selectedLocation === loc.id;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => onSelectLocation(loc.id)}
                          className={`text-start p-3 rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1a2234] border-amber-400'
                              : 'bg-[#141924] border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-lg font-bold text-white">
                              {t.locations[loc.id].name}
                            </span>
                            <span
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ backgroundColor: loc.pitchAccent }}
                            />
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{t.locations[loc.id].vibe}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold tracking-wider uppercase text-sky-400 mb-2.5">
                    {t.rules.regionGlobal}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {globalLocs.map((loc) => {
                      const active = selectedLocation === loc.id;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => onSelectLocation(loc.id)}
                          className={`text-start p-3 rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1a2234] border-amber-400'
                              : 'bg-[#141924] border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-lg font-bold text-white">
                              {t.locations[loc.id].name}
                            </span>
                            <span
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ backgroundColor: loc.pitchAccent }}
                            />
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{t.locations[loc.id].vibe}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Format & Match Rules */}
              <div className="lg:col-span-5 bg-[#141924] border border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-zinc-400 mb-2">Format</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['3v3', '4v4', '5v5'] as MatchFormat[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            onChangeFormat(f);
                            if (f === '3v3') onToggleNoGk(true);
                            else onToggleNoGk(false);
                          }}
                          className={`py-2.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                            format === f
                              ? 'bg-amber-400 text-zinc-950 border-amber-400'
                              : 'bg-[#1a202e] text-zinc-300 border-white/10 hover:border-white/25'
                          }`}
                        >
                          {t.formats[f]}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      {format === '3v3' ? t.formats['3v3Desc'] : format === '4v4' ? t.formats['4v4Desc'] : t.formats['5v5Desc']}
                    </p>
                  </div>

                  {/* Rule Toggles */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="flex items-center justify-between py-1.5 cursor-pointer">
                      <span className="text-sm font-medium text-zinc-200">{t.rules.wallBounce}</span>
                      <input
                        type="checkbox"
                        checked={wallBounce}
                        onChange={(e) => onToggleWallBounce(e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between py-1.5 cursor-pointer">
                      <span className="text-sm font-medium text-zinc-200">{t.rules.noGk}</span>
                      <input
                        type="checkbox"
                        checked={noGoalkeeper}
                        onChange={(e) => onToggleNoGk(e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                    </label>
                  </div>

                  {/* Duration */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
                      <span>{t.rules.duration}</span>
                      <span className="font-mono-num text-white">{durationSec} {t.rules.seconds}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[60, 90, 120].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => onChangeDuration(d)}
                          className={`py-1.5 rounded-md text-xs font-mono-num font-bold border cursor-pointer ${
                            durationSec === d
                              ? 'bg-white text-zinc-950 border-white'
                              : 'bg-[#1a202e] text-zinc-300 border-white/10'
                          }`}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={launchQuickMatch}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-display text-xl font-extrabold uppercase tracking-wide cursor-pointer transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{t.rules.kickOff}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'story' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">{t.story.title}</h2>
                <p className="text-sm text-zinc-400">{t.story.subtitle}</p>
              </div>

              <div className="space-y-3">
                {STORY_CHAPTERS.map((ch, idx) => {
                  const text = t.story.chapters[idx];
                  const unlocked = idx <= save.unlockedStoryChapter;
                  const completed = save.completedChapters.includes(idx);
                  const locInfo = t.locations[ch.location];

                  return (
                    <div
                      key={ch.id}
                      className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        unlocked ? 'bg-[#141924] border-white/12' : 'bg-[#10141d] border-white/5 opacity-60'
                      }`}
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span className="font-mono-num font-bold text-amber-400">
                            {t.story.chapterLabel} {idx + 1}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{locInfo.name}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">{ch.format}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num text-emerald-400">+{text.reward} REP</span>
                        </div>
                        <h3 className="font-display text-xl font-bold text-white">{text.title}</h3>
                        <p className="text-xs text-zinc-300 italic">“{text.dialogue}” — {text.rival}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {completed && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t.story.completed}</span>
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => launchStoryChapter(idx)}
                          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                            unlocked
                              ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          {unlocked ? <Play className="w-3.5 h-3.5 fill-current" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{unlocked ? t.story.playChapter : t.story.locked}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'arcade' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">{t.arcade.title}</h2>
                <p className="text-sm text-zinc-400">{t.arcade.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['targets', 'king', 'wallvolley'] as ArcadeMiniGame[]).map((g) => {
                  const info = t.arcade.games[g];
                  const best = save.bestArcade[g] || 0;
                  return (
                    <div
                      key={g}
                      className="bg-[#141924] border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span className="font-mono-num">
                            {t.arcade.best}: <strong className="text-white">{best}</strong>
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-white">{info.name}</h3>
                        <p className="text-xs text-zinc-300 leading-relaxed">{info.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => launchArcade(g)}
                        className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-display text-lg font-extrabold uppercase tracking-wide cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{t.arcade.play}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'squads' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Crew Identity & Crest Editor */}
              <div className="lg:col-span-6 bg-[#141924] border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <CrewCrest
                    shape={save.squad.crestShape}
                    primary={save.squad.primaryColor}
                    secondary={save.squad.secondaryColor}
                    size={56}
                  />
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">{t.squads.crewName}</label>
                    <input
                      type="text"
                      maxLength={18}
                      value={save.squad.crewName}
                      onChange={(e) => onUpdateSquad({ ...save.squad, crewName: e.target.value.toUpperCase() })}
                      className="w-full bg-[#1a202e] border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['shield', 'diamond', 'hexagon'] as const).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => onUpdateSquad({ ...save.squad, crestShape: shape })}
                      className={`py-1.5 rounded-md text-xs font-semibold capitalize border cursor-pointer ${
                        save.squad.crestShape === shape
                          ? 'bg-white text-zinc-950 border-white'
                          : 'bg-[#1a202e] text-zinc-300 border-white/10'
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs text-zinc-400 mb-1.5">{t.squads.primaryColor}</span>
                    <div className="flex gap-1.5">
                      {['#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#8b5cf6'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onUpdateSquad({ ...save.squad, primaryColor: c })}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded border-2 cursor-pointer ${
                            save.squad.primaryColor === c ? 'border-white scale-110' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400 mb-1.5">{t.squads.homePitch}</span>
                    <select
                      value={save.squad.homeLocation}
                      onChange={(e) => onUpdateSquad({ ...save.squad, homeLocation: e.target.value as LocationId })}
                      className="w-full bg-[#1a202e] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white"
                    >
                      {Object.keys(LOCATIONS).map((id) => (
                        <option key={id} value={id}>
                          {t.locations[id as LocationId].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Crew Roster */}
                <div className="pt-2 border-t border-white/10">
                  <div className="text-xs font-semibold text-zinc-400 mb-2">{t.squads.rosterTitle}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {save.squad.roster.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between bg-[#1a202e] border border-white/10 rounded-lg px-3 py-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{m.name}</div>
                          <div className="text-zinc-400">{t.roles[m.role].name}</div>
                        </div>
                        <span className="font-mono-num font-bold text-amber-400">{m.ovr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={launchSquadMatch}
                  className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-display text-xl font-extrabold uppercase tracking-wide cursor-pointer flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>{t.squads.playCrewMatch}</span>
                </button>
              </div>

              {/* Leaderboard */}
              <div className="lg:col-span-6 bg-[#141924] border border-white/10 rounded-xl p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="font-display text-xl font-bold text-white">{t.squads.leaderboard}</h3>
                </div>

                <div className="divide-y divide-white/10">
                  {[
                    ...GLOBAL_CREWS,
                    {
                      name: save.squad.crewName,
                      city: t.locations[save.squad.homeLocation].name,
                      wins: save.squad.wins,
                      points: save.squad.points,
                      color: save.squad.primaryColor,
                      isPlayer: true,
                    },
                  ]
                    .sort((a, b) => b.points - a.points)
                    .map((entry, idx) => {
                      const isPlayer = 'isPlayer' in entry;
                      return (
                        <div
                          key={`${entry.name}-${idx}`}
                          className={`flex items-center justify-between py-2.5 px-2 text-xs ${
                            isPlayer ? 'bg-amber-400/10 rounded-md' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono-num w-5 text-zinc-400 font-bold">#{idx + 1}</span>
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                            <div>
                              <span className={`font-bold ${isPlayer ? 'text-amber-300' : 'text-white'}`}>
                                {entry.name}
                              </span>
                              <span className="text-zinc-500 mx-1.5">·</span>
                              <span className="text-zinc-400">{entry.city}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 font-mono-num">
                            <span className="text-zinc-400">
                              {entry.wins} {t.squads.winsLabel}
                            </span>
                            <span className="font-bold text-white">
                              {entry.points} {t.squads.ptsLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
