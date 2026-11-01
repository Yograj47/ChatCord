import { LogoMark } from '@/shared/ui/LogoMark';

export function AppSplash() {
  return (
    <div
      role="status"
      aria-label="Loading ChatCord"
      className="grid min-h-dvh w-full place-items-center bg-[#090a0f] px-6 text-zinc-100"
    >
      <div aria-hidden="true" className="flex flex-col items-center">
        <div className="chatcord-splash-mark relative mb-7">
          <div className="absolute -inset-7 rounded-full bg-indigo-500/10 blur-2xl" />
          <LogoMark size={80} className="relative drop-shadow-[0_0_24px_rgba(99,102,241,0.18)]" />
        </div>
        <span className="font-mono text-lg font-semibold tracking-[0.28em]">CHATCORD</span>
        <div className="relative mt-5 h-0.5 w-24 overflow-hidden rounded-full bg-indigo-400/10">
          <div className="chatcord-splash-shimmer absolute inset-y-0 w-12 rounded-full bg-linear-to-r from-transparent via-indigo-400 to-transparent" />
        </div>
      </div>
    </div>
  );
}
