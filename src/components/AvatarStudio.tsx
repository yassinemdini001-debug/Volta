import React from 'react';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import { TRANSLATIONS } from '../data/i18n';
import { AvatarConfig, HairStyle, Language, PlayerRole, SaveProgress, TopStyle } from '../types/game';

interface AvatarStudioProps {
  lang: Language;
  save: SaveProgress;
  onUpdateAvatar: (avatar: AvatarConfig) => void;
  onUpgradeSkill: (role: PlayerRole, index: 0 | 1 | 2) => void;
  onClose: () => void;
}

const SKIN_TONES = ['#f1c27d', '#e0ac69', '#c68b59', '#a5694f', '#8d5524', '#5c3818'];
const KIT_COLORS = ['#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#8b5cf6', '#f8fafc', '#18181b'];
const ACCENT_COLORS = ['#18181b', '#f8fafc', '#fbbf24', '#ef4444', '#38bdf8', '#a3e635'];

export const AvatarStudio: React.FC<AvatarStudioProps> = ({
  lang,
  save,
  onUpdateAvatar,
  onUpgradeSkill,
  onClose,
}) => {
  const t = TRANSLATIONS[lang];
  const { avatar, skills, skillPoints, rep } = save;

  const setField = <K extends keyof AvatarConfig>(key: K, val: AvatarConfig[K]) => {
    onUpdateAvatar({ ...avatar, [key]: val });
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex items-stretch justify-between p-4 md:p-6">
      {/* Left Panel Dock — leaves center/right 3D avatar turntable unobstructed */}
      <div className="pointer-events-auto w-full max-w-[440px] bg-[#0D1018]/95 border border-white/10 rounded-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
          <h2 className="font-display text-2xl font-bold tracking-wide text-white">{t.avatar.title}</h2>
          <div className="flex items-center gap-3 text-xs font-mono-num">
            <span className="text-amber-400 font-bold">{skillPoints} SP</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-300">{rep} REP</span>
          </div>
        </div>

        {/* Scrollable Builder Body */}
        <div className="flex-1 overflow-y-auto volta-scroll p-5 space-y-5">
          {/* Street Handle */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{t.avatar.playerName}</label>
            <input
              type="text"
              maxLength={14}
              value={avatar.name}
              onChange={(e) => setField('name', e.target.value.toUpperCase())}
              className="w-full bg-[#151A26] border border-white/10 rounded-lg px-3.5 py-2 text-sm font-bold tracking-wider text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Archetype Role Selector + Skill Tree */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400">{t.avatar.role}</span>
              <span className="text-xs text-amber-400 font-mono-num">
                {t.avatar.skillPoints}: {skillPoints}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['striker', 'playmaker', 'defender'] as PlayerRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setField('role', r)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap truncate ${
                    avatar.role === r
                      ? 'bg-amber-400 text-zinc-950 border-amber-400'
                      : 'bg-[#151A26] text-zinc-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  {t.roles[r].name}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mb-3">{t.roles[avatar.role].desc}</p>

            {/* 3 Skill Tree Nodes for selected role */}
            <div className="space-y-2">
              {([0, 1, 2] as const).map((idx) => {
                const level = skills[avatar.role][idx];
                const maxed = level >= 3;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 bg-[#151A26] border border-white/10 rounded-lg px-3 py-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-100">{t.roles[avatar.role].skills[idx]}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[0, 1, 2].map((bar) => (
                          <span
                            key={bar}
                            className={`h-1.5 w-6 rounded-sm ${bar < level ? 'bg-amber-400' : 'bg-zinc-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={maxed || skillPoints <= 0}
                      onClick={() => onUpgradeSkill(avatar.role, idx)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        maxed
                          ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                          : skillPoints > 0
                          ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {maxed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.avatar.maxed}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.avatar.upgrade}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hair & Streetwear Top */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-xs font-semibold text-zinc-400 mb-1.5">{t.avatar.hair}</span>
              <div className="flex flex-wrap gap-1.5">
                {(['fade', 'afro', 'braids', 'buzz', 'cap'] as HairStyle[]).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setField('hairStyle', h)}
                    className={`px-2.5 py-1 rounded text-xs font-medium capitalize border cursor-pointer ${
                      avatar.hairStyle === h
                        ? 'bg-white text-zinc-950 border-white'
                        : 'bg-[#151A26] text-zinc-300 border-white/10 hover:border-white/25'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-zinc-400 mb-1.5">{t.avatar.top}</span>
              <div className="flex flex-wrap gap-1.5">
                {(['hoodie', 'jersey', 'jacket'] as TopStyle[]).map((top) => (
                  <button
                    key={top}
                    type="button"
                    onClick={() => setField('topStyle', top)}
                    className={`px-2.5 py-1 rounded text-xs font-medium capitalize border cursor-pointer ${
                      avatar.topStyle === top
                        ? 'bg-white text-zinc-950 border-white'
                        : 'bg-[#151A26] text-zinc-300 border-white/10 hover:border-white/25'
                    }`}
                  >
                    {top}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Swatches */}
          <div className="space-y-3">
            <div>
              <span className="block text-xs font-semibold text-zinc-400 mb-1.5">{t.avatar.skin}</span>
              <div className="flex items-center gap-2">
                {SKIN_TONES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setField('skinTone', c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                      avatar.skinTone === c ? 'border-amber-400 scale-110' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-zinc-400 mb-1.5">{t.avatar.topColor}</span>
              <div className="flex items-center gap-2">
                {KIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setField('topColor', c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-md border-2 cursor-pointer ${
                      avatar.topColor === c ? 'border-amber-400 scale-110' : 'border-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-semibold text-zinc-400 mb-1.5">{t.avatar.accentColor}</span>
                <div className="flex items-center gap-1.5">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setField('accentColor', c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-md border-2 cursor-pointer ${
                        avatar.accentColor === c ? 'border-amber-400 scale-110' : 'border-white/15'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-zinc-400 mb-1.5">{t.avatar.sneakers}</span>
                <div className="flex items-center gap-1.5">
                  {['#f8fafc', '#f59e0b', '#ef4444', '#06b6d4', '#18181b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setField('sneakerColor', c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-md border-2 cursor-pointer ${
                        avatar.sneakerColor === c ? 'border-amber-400 scale-110' : 'border-white/15'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center justify-between bg-[#151A26] border border-white/10 rounded-lg px-3.5 py-2.5 cursor-pointer">
              <span className="text-xs font-semibold text-zinc-200">{t.avatar.tattoo}</span>
              <input
                type="checkbox"
                checked={avatar.hasTattoo}
                onChange={(e) => setField('hasTattoo', e.target.checked)}
                className="w-4 h-4 accent-amber-400"
              />
            </label>
          </div>
        </div>

        {/* Footer Save CTA */}
        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-display text-lg font-extrabold uppercase tracking-wide cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.avatar.saveBack}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
