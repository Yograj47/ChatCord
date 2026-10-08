import React, { useState, useEffect } from 'react';
import { Search, X, Hash, User, MessageSquare, CornerDownLeft } from 'lucide-react';
import { useLayoutStore } from '../../stores/layout.store';

interface SearchResult {
  id: string;
  type: 'channel' | 'dm' | 'message';
  title: string;
  subtitle?: string;
  badge?: string;
}

const MOCK_RESULTS: SearchResult[] = [
  { id: '1', type: 'channel', title: 'Dev-General', subtitle: 'General developer chat', badge: 'Active' },
  { id: '2', type: 'channel', title: 'Frontend-Gang', subtitle: 'React, Tailwind & UI design' },
  { id: '3', type: 'dm', title: 'Elena Marchetti', subtitle: 'Online', badge: 'DM' },
  { id: '4', type: 'message', title: 'Zustand state refactor discussion', subtitle: 'In #Dev-General by Julian' },
  { id: '5', type: 'channel', title: 'Backend-Team', subtitle: 'API Endpoints & Sockets' },
];

export const GlobalSearchModal: React.FC = () => {
  const { isGlobalSearchOpen, setGlobalSearchOpen } = useLayoutStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredResults = MOCK_RESULTS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectResult = (item: SearchResult) => {
    console.log('Navigating to:', item);
    setGlobalSearchOpen(false);
  };

  // Keyboard navigation listener (ArrowUp, ArrowDown, Enter, Escape, Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!isGlobalSearchOpen);
        return;
      }

      if (!isGlobalSearchOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setGlobalSearchOpen(false);
        return;
      }

      if (filteredResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prevIndex) =>
          prevIndex < filteredResults.length - 1 ? prevIndex + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : filteredResults.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const currentItem = filteredResults[selectedIndex];
        if (currentItem) {
          handleSelectResult(currentItem);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, filteredResults, selectedIndex, setGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0f14] text-zinc-100 font-sans select-none">
      {/* 1. Top Header Search Input Container */}
      <div className="h-12 w-full bg-[#0d0f14] border-b border-zinc-800 px-4 md:px-8 flex items-center shrink-0">
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center flex-1 mr-4">
            <Search className="h-4 w-4 text-indigo-400 shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search channels, messages, or teammates..."
              className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded-sm mr-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <kbd className="hidden sm:inline-block text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-sm text-zinc-400 font-mono">
              ESC
            </kbd>
            <button
              type="button"
              onClick={() => setGlobalSearchOpen(false)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/80 text-[10px] rounded-sm transition-colors"
              title="Close Search"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* 2. Results List */}
      <div className="flex-1 overflow-y-auto bg-[#0a0b0e] p-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            {query ? 'Search Results' : 'Recent Suggestions'}
          </div>

          {filteredResults.length > 0 ? (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-sm cursor-pointer border transition-all ${isSelected
                      ? 'bg-zinc-900 border-zinc-800 text-white'
                      : 'border-transparent text-zinc-300 hover:bg-zinc-900/50 hover:text-zinc-100'
                    }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-1.5 rounded-sm bg-zinc-800/80 text-zinc-400 shrink-0">
                      {item.type === 'channel' && <Hash className="h-4 w-4 text-indigo-400" />}
                      {item.type === 'dm' && <User className="h-4 w-4 text-emerald-400" />}
                      {item.type === 'message' && <MessageSquare className="h-4 w-4 text-amber-400" />}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium truncate">{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded-sm font-mono border border-zinc-700/50">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center space-x-1 text-xs text-indigo-400 shrink-0 ml-4">
                      <span className="hidden sm:inline text-[10px] text-zinc-500">Jump to</span>
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              No results found matching &quot;<span className="text-zinc-300">{query}</span>&quot;
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Footer Navigation Guide */}
      <div className="h-9 px-4 md:px-8 bg-[#0d0f14] border-t border-zinc-800 flex items-center shrink-0">
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <kbd className="bg-zinc-800 px-1.5 py-0.2 rounded-sm text-zinc-400 font-mono text-[10px]">↑</kbd>
              <kbd className="bg-zinc-800 px-1.5 py-0.2 rounded-sm text-zinc-400 font-mono text-[10px]">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="bg-zinc-800 px-1.5 py-0.2 rounded-sm text-zinc-400 font-mono text-[10px]">↵</kbd>
              <span className="ml-1">Open</span>
            </span>
          </div>
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">ChatCord Search</span>
        </div>
      </div>
    </div>
  );
};