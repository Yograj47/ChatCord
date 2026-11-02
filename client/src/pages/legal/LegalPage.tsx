import { Link } from 'react-router-dom';

const privacy = [
  [
    'What we collect',
    'Google sign-in supplies your Google identifier, name, email and profile photo URL. ChatCord stores your username, profile details, room memberships, friendships, invitations, messages, replies, reactions and room activity. Sessions can record an IP address and browser user agent for authentication and security. Guests receive a generated identity instead of a Google account.',
  ],
  [
    'Why we use it',
    'We use this information to sign you in, deliver conversations, manage membership and permissions, display profiles, show presence and typing, and apply security and rate limits. The current application does not include advertising or third-party analytics tracking.',
  ],
  [
    'Who can see it',
    'Other users can see your public profile information and the conversation content available to them. Your email is not part of the public profile. New room members only receive messages from their current join time. Room privacy and membership controls limit access, but messages are stored on the server and are not end-to-end encrypted. Operators with database access can access stored content.',
  ],
  [
    'Cookies and external services',
    'An HTTP-only session cookie keeps you signed in. Blocking it prevents authenticated chat. Google handles Google sign-in under its own privacy policy; ChatCord does not receive your Google password. Loading a Google-hosted profile image also contacts that image host. The hosting provider may process connection details and operational logs.',
  ],
  [
    'Guests and retention',
    'Guest sessions end 30 minutes after creation. Expired guest identities, sessions and memberships are cleaned up automatically; cleanup may occur shortly after expiry. Guest messages and room activity remain. Registered profiles, relationships and messages have no general automatic deletion schedule in the current project. Logging out ends your session, not your account or messages. Message deletion keeps a placeholder for conversation references.',
  ],
  [
    'Your choices',
    'Registered users can edit profile details in Settings and edit or delete their own eligible messages. There is no self-service account deletion or data export yet. For a privacy or removal request, contact the person operating the instance you are using. Do not include private chat content, credentials or other personal data in public repository issues.',
  ],
  [
    'Before public deployment',
    'This notice describes the educational project. An operator must publish their identity and private contact channel, hosting and transfer details, applicable rights and legal grounds, and a concrete retention and request-handling policy before collecting public users’ data. These deployment details are not configured here.',
  ],
];

const terms = [
  [
    'About this project',
    'ChatCord is an educational software project for exploring real-time communication. Use it for learning and ordinary conversation; it is not an emergency service or a place to store sensitive or irreplaceable information. Features and test data may change or be reset.',
  ],
  [
    'Accounts and guest access',
    'Use an account you control and keep it secure. Google manages your sign-in credentials. Guests receive random usernames and a fixed 30-minute session, with access to public rooms only. Signing in does not automatically convert or transfer a guest identity or its messages.',
  ],
  [
    'Respect other people',
    'Do not harass, threaten, impersonate, spam, share unlawful content, publish another person’s private information, or attempt unauthorized access. Only post content you have permission to share. Do not bypass membership controls, abuse automated requests or interfere with the service.',
  ],
  [
    'Rooms and conversations',
    'Room owners and moderators can manage membership and permissions within their roles. Members may be removed and room rules may change. History starts at your current join time; leaving and rejoining starts a new history window. Friend-only direct messages require friendship to start or send, while existing history may remain accessible after unfriending.',
  ],
  [
    'Your content',
    'You retain ownership of content you submit. Using chat allows the application to store and deliver it to the intended conversation participants. Participants may copy or screenshot content. Deleting a message does not recall copies already received, and a placeholder may remain. Guest expiry does not delete guest messages.',
  ],
  [
    'Availability and security',
    'This project is provided as available, without a promise of uninterrupted access, data preservation or fitness for a particular purpose. Bugs and security limitations may exist. Do not rely on it for confidential, medical, financial or emergency communications. Mandatory rights under applicable law are unaffected.',
  ],
  [
    'Stopping use and questions',
    'You can stop using ChatCord and log out at any time. Account deletion and export are not self-service features yet; ask the operator of your instance privately for data requests or conduct concerns. Public repository issues are for software problems and must not contain personal information.',
  ],
  [
    'Scope and changes',
    'These terms describe the educational project and were last updated on 2 November 2026. The MIT license governs the source code separately. Before a public launch, the operator must supply contact details and review these terms for the actual service and applicable law. Material changes should be clearly communicated to users.',
  ],
];

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const isPrivacy = kind === 'privacy';
  const title = isPrivacy ? 'Privacy policy' : 'Terms of use';
  const sections = isPrivacy ? privacy : terms;
  return (
    <article className="mx-auto max-w-3xl py-10 sm:py-14">
      <p className="text-xs font-medium uppercase tracking-widest text-indigo-300">
        Educational project
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-zinc-400">Last updated: 2 November 2026</p>
      <p className="mt-5 text-sm leading-7 text-zinc-400">
        Clear information about using ChatCord as it works today. This project is still being
        prepared for deployment.
      </p>
      <nav
        aria-label="Legal pages"
        className="mt-6 flex gap-5 border-b border-zinc-800 pb-6 text-sm"
      >
        <Link
          to="/privacy"
          aria-current={isPrivacy ? 'page' : undefined}
          className="text-indigo-300 hover:underline"
        >
          Privacy policy
        </Link>
        <Link
          to="/terms"
          aria-current={!isPrivacy ? 'page' : undefined}
          className="text-indigo-300 hover:underline"
        >
          Terms of use
        </Link>
      </nav>
      <div className="mt-8 space-y-8">
        {sections.map(([heading, text]) => (
          <section key={heading}>
            <h2 className="text-base font-medium text-zinc-200">{heading}</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{text}</p>
          </section>
        ))}
      </div>
      {isPrivacy && (
        <a
          href="https://policies.google.com/privacy"
          className="mt-8 inline-block text-sm text-indigo-300 hover:underline"
        >
          Google privacy policy
        </a>
      )}
      <Link to="/app" className="mt-10 block text-sm text-zinc-300 hover:text-white">
        Open workspace →
      </Link>
    </article>
  );
}
