import { LogoMark } from '@/shared/ui/LogoMark';

export function HeaderBranding() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <LogoMark size={20} />
      <span className="font-mono text-xs font-bold tracking-wider text-zinc-100">CHATCORD</span>
    </div>
  );
}
