import React from 'react';
import { Hash, Plus } from 'lucide-react';

export interface RoomItem {
  id: string;
  name: string;
  unreadCount?: number;
}

interface RoomsSectionProps {
  rooms: RoomItem[];
  activeRoomId: string;
  onSelectRoom: (id: string) => void;
  onCreateRoom: () => void;
}

export const RoomsSection: React.FC<RoomsSectionProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  onCreateRoom,
}) => {
  return (
    <div>
      <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        <span>Active Rooms</span>
        <button
          type="button"
          onClick={onCreateRoom}
          title="Create Group Room"
          className="text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-0.5">
        {rooms.map((room) => {
          const isActive = room.id === activeRoomId;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room.id)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Hash className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                <span className="truncate">{room.name}</span>
              </div>
              {room.unreadCount ? (
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {room.unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};