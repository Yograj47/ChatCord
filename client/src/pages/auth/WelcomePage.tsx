import { ArrowDown, Compass, Hash, MessagesSquare, UserRoundPlus } from 'lucide-react';
import { SignInPanel } from '@/features/auth/components/SignInPanel';

const features = [
  {
    icon: Hash,
    title: 'A room for your people',
    text: 'Find a public conversation or make an invitation-only room for a group of your own.',
  },
  {
    icon: UserRoundPlus,
    title: 'Friends first. Then private chats.',
    text: 'Find someone by username, become friends, and keep the conversation going in a direct message.',
  },
  {
    icon: MessagesSquare,
    title: 'Keep the context close',
    text: 'Reply to a message, add a reaction, or search your conversation. See who is online and when someone is typing.',
  },
];
const steps = [
  {
    number: '01',
    title: 'Choose your way in',
    text: 'Use Google for an account, or try public rooms with a temporary guest username.',
  },
  {
    number: '02',
    title: 'Find your place',
    text: 'Search public rooms, create a group, or accept an invitation from someone you know.',
  },
  {
    number: '03',
    title: 'Start with a hello',
    text: 'Your history begins when you join. New messages and room updates arrive in real time.',
  },
];
export function WelcomePage() {
  return (
    <>
      <section
        className="grid items-center gap-12 py-12 sm:py-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20 lg:py-16"
        aria-labelledby="welcome-heading"
      >
        <div>
          <p className="mb-5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-300">
            <span className="h-px w-6 bg-indigo-400/70" aria-hidden="true" />A place to connect
          </p>
          <h1
            id="welcome-heading"
            className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-100 sm:text-5xl lg:text-[56px]"
          >
            Good conversations
            <br />
            <span className="text-indigo-300">need a place.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-400">
            Bring a few friends together, meet people in a public room, or pick up a private chat.
            ChatCord gives every conversation a space of its own.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500">
            <span>Public & private rooms</span>
            <span>Friend-only DMs</span>
            <span>Live conversations</span>
          </div>
          <a
            href="#how-it-works"
            className="mt-9 inline-flex items-center gap-2 text-xs font-medium text-zinc-300 transition hover:text-indigo-300"
          >
            Get to know ChatCord <ArrowDown className="size-3.5" aria-hidden="true" />
          </a>
        </div>
        <SignInPanel />
      </section>
      <section
        id="features"
        aria-labelledby="features-heading"
        className="scroll-mt-24 border-t border-zinc-800/70 py-12 sm:py-16"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Made for conversation
            </p>
            <h2 id="features-heading" className="text-2xl font-medium tracking-tight">
              From a quick hello to a shared space.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
            Simple ways to find people and stay in the conversation.
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="border-l border-zinc-800 pl-5">
              <Icon className="mb-5 size-5 text-indigo-300/80" aria-hidden="true" />
              <h3 className="mb-3 text-sm font-medium text-zinc-200">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="scroll-mt-24 border-t border-zinc-800/70 py-12 sm:py-16"
      >
        <h2 id="how-heading" className="mb-10 text-2xl font-medium tracking-tight">
          A little less setup. A little more conversation.
        </h2>
        <ol className="grid gap-10 md:grid-cols-3">
          {steps.map(({ number, title, text }) => (
            <li key={number}>
              <span className="mb-3 block font-mono text-xs text-indigo-300/60">{number}</span>
              <h3 className="mb-2 text-sm font-medium text-zinc-200">{title}</h3>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-400">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap items-start justify-between gap-5 rounded-xl border border-indigo-400/10 bg-indigo-400/[0.03] p-5 sm:p-6">
          <div className="flex max-w-2xl items-start gap-3">
            <Compass className="mt-0.5 size-5 shrink-0 text-indigo-300/70" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-medium text-zinc-200">
                Just looking around? You're welcome too.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Guest visits last 30 minutes and let you join public rooms with a generated
                username. Sign in with Google to continue with an account. In every room, you only
                see messages sent from the time you join.
              </p>
            </div>
          </div>
          <a
            href="#get-started"
            className="shrink-0 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Find your way in
          </a>
        </div>
      </section>
    </>
  );
}
