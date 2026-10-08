import React from 'react';

export interface ActiveMember {
  id: string;
  initials: string;
  bgColor: string;
}

interface ActiveMembersStackProps {
  members?: ActiveMember[];
  overflowCount?: number;
}

const DEFAULT_MEMBERS: ActiveMember[] = [
  { id: '1', initials: 'JR', bgColor: 'bg-indigo-600' },
  { id: '2', initials: 'MV', bgColor: 'bg-emerald-600' },
  { id: '3', initials: 'DS', bgColor: 'bg-amber-600' },
];

export const ActiveMembersStack: React.FC<ActiveMembersStackProps> = ({
  members = DEFAULT_MEMBERS,
  overflowCount = 8,
}) => {
  return (
    <div className="hidden sm:flex items-center space-x-2">
      <div className="flex items-center -space-x-1.5">
        {members.map((member) => (
          <div
            key={member.id}
            className={`w-6 h-6 rounded-full ${member.bgColor} border-2 border-[#0d0f14] text-[10px] font-semibold text-white flex items-center justify-center shrink-0`}
          >
            {member.initials}
          </div>
        ))}
      </div>
      {overflowCount > 0 && (
        <span className="text-[10px] text-zinc-400 font-mono">
          +{overflowCount}
        </span>
      )}
    </div>
  );
};