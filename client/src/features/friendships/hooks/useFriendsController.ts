import { normalizeUsernameSearch } from '@/features/auth/lib/username-search';
import { socialApi } from '@/features/friendships/api/social.api';
import { SOCIAL_QUERY_KEYS } from '@/features/friendships/api/social.keys';
import {
  useFriendRequests,
  useFriends,
  useUserSearch,
} from '@/features/friendships/hooks/useSocial';
import { usePresence } from '@/features/realtime/hooks/usePresence';
import { dmsApi } from '@/features/rooms/api/dm.api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { showSuccess } from '@/shared/lib/toast';
import { useLayoutStore } from '@/shared/stores/layout.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type View = 'friends' | 'requests' | 'search';
export type Action = {
  kind: 'send' | 'accept' | 'decline' | 'cancel' | 'remove' | 'message';
  id: string;
};
export function useFriendsController(userId: string) {
  const [view, setView] = useState<View>('friends');
  const [input, setInput] = useState('');

  const [removeId, setRemoveId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setMobileView = useLayoutStore((state) => state.setMobileView);
  const { query, valid } = normalizeUsernameSearch(input);

  const debounced = useDebouncedValue(valid ? query : '');

  const friends = useFriends(userId);
  const requests = useFriendRequests(userId);
  const presence = usePresence((friends.data ?? []).map((friend) => friend.user._id));
  const search = useUserSearch(
    userId,
    debounced,
    view === 'search' && valid && query === debounced,
  );
  const incoming = (requests.data ?? []).filter((request) => request.recipient?._id === userId);
  const outgoing = (requests.data ?? []).filter((request) => request.requester?._id === userId);
  const relationshipsReady = friends.isSuccess && requests.isSuccess;
  const friendsByUser = new Map((friends.data ?? []).map((friend) => [friend.user._id, friend]));
  const pendingByUser = new Map(
    (requests.data ?? []).map((request) => [
      request.requester?._id === userId ? request.recipient?._id : request.requester?._id,
      request,
    ]),
  );

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.friends(userId) }),
      queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.requests(userId) }),
      queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.dms(userId) }),
    ]);
  const action = useMutation({
    mutationFn: async ({ kind, id }: Action) => {
      switch (kind) {
        case 'send':
          await socialApi.sendRequest(id);
          return;
        case 'accept':
          await socialApi.acceptRequest(id);
          return;
        case 'decline':
          await socialApi.declineRequest(id);
          return;
        case 'cancel':
          await socialApi.cancelRequest(id);
          return;
        case 'remove':
          await socialApi.removeFriend(id);
          return;
        case 'message':
          return dmsApi.create(id);
      }
    },
    onSuccess: async (room, variables) => {
      setRemoveId(null);
      await refresh();
      if (room) {
        setMobileView('chat');
        void navigate(`/app/dms/${room._id}`);
      } else {
        const messages = {
          send: 'Friend request sent.',
          accept: 'Friend request accepted.',
          decline: 'Friend request declined.',
          cancel: 'Friend request canceled.',
          remove: 'Friend removed.',
          message: '',
        };
        showSuccess(messages[variables.kind]);
      }
    },
    // Refetch after conflicts or stale actions so relationship buttons match the server.
    onError: () => {
      void refresh();
    },
  });
  const act = (kind: Action['kind'], id: string) => action.mutate({ kind, id });
  const loading = friends.isPending || requests.isPending;
  const loadError = friends.isError || requests.isError;
  const searchWaiting = valid && (query !== debounced || search.isFetching);
  const changeView = (next: View) => {
    setView(next);
    setRemoveId(null);
    action.reset();
  };

  return {
    view,
    input,
    setInput,
    removeId,
    setRemoveId,
    query,
    valid,
    debounced,
    friends,
    requests,
    presence,
    search,
    incoming,
    outgoing,
    relationshipsReady,
    friendsByUser,
    pendingByUser,
    refresh,
    action,
    act,
    loading,
    loadError,
    searchWaiting,
    changeView,
  };
}
