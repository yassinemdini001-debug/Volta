import React from 'react';
import { Volume2, VolumeX, Play, SlidersHorizontal, User } from 'lucide-react';
import { TRANSLATIONS } from '../data/i18n';
import { LOCATIONS } from '../data/locations';
import { Language, LocationId } from '../types/game';
import { VoltaLogo } from './VoltaLogo';

interface TitleScreenProps {
  lang: Language;
  onChangeLang: (l: Language) => void;
  muted: boolean;
  onToggleMute: () => void;
  rep: number;
  featuredLocation: LocationId;
  onQuickKickOff: () => void;
  onOpenHub: () => void;
  onOpenAvatar: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  lang,
  onChangeLang,
  muted,
  onToggleMute,
  rep,
  featuredLocation,
  onQuickKickOff,
  onOpenHub,
  onOpenAvatar,
}) => {
  const t = TRANSLATIONS[lang];
  const locText = t.locations[featuredLocation];
  const locDef = LOCATIONS[featuredLocation];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-10">
      {/* Subtle directional gradient scrim on left side only so right 60%+ live 3D scrimmage stays crystal clear */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            lang === 'ar'
              ? 'linear-gradient(270deg, rgba(9,11,16,0.88) 0%, rgba(9,11,16,0.52) 42%, rgba(9,11,16,0.12) 100%)'
              : 'linear-gradient(90deg, rgba(9,11,16,0.88) 0%, rgba(9,11,16,0.52) 42%, rgba(9,11,16,0.12) 100%)',
        }}
      />

      {/* Top Perimeter Bar */}
      <div className="relative z-10 flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-3 text-xs font-medium text-zinc-300">
          <span className="font-display text-sm tracking-wider text-amber-400 uppercase">{locText.name}</span>
          <span aria-hidden="true" className="text-zinc-500">·</span>
          <span className="hidden sm:inline text-zinc-400">{locDef.pitchWidth}m × {locDef.pitchLength}m</span>
          <span aria-hidden="true" className="hidden sm:inline text-zinc-500">·</span>
          <span className="font-mono-num text-zinc-200">{rep} REP</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#121620] border border-white/10 rounded-lg p-1">
            {(['ar', 'fr', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onChangeLang(l)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === l ? 'bg-amber-400 text-zinc-950' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {l === 'ar' ? 'العربية' : l.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t.hud.unmute : t.hud.mute}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#121620] border border-white/10 text-zinc-200 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Title Lockup & Actions */}
      <div className="relative z-10 max-w-lg my-auto pointer-events-auto">
        <VoltaLogo className="w-64 sm:w-80 h-auto mb-3" />
        <p className="text-base sm:text-lg text-zinc-300 font-medium mb-8 max-w-md text-balance">
          {t.brandSub}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={onQuickKickOff}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-display text-xl font-extrabold tracking-wide uppercase transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t.startMatch}</span>
          </button>

          <button
            type="button"
            onClick={onOpenHub}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#121620] hover:bg-[#1a2030] border border-white/15 text-zinc-100 font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>{t.openHub}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAvatar}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#121620] hover:bg-[#1a2030] border border-white/15 text-zinc-100 font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <User className="w-4 h-4 text-sky-400" />
            <span>{t.avatarLocker}</span>
          </button>
        </div>
      </div>

      {/* Bottom Single Control-Hint Line */}
      <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 pointer-events-none">
        <span className="font-mono-num tracking-tight bg-[#090B10]/85 px-3 py-1.5 rounded-md border border-white/10">
          {t.controlHint}
        </span>
      </div>
    </div>
  );
};
