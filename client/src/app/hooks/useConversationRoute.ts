import { useMatch } from 'react-router-dom';

export function useConversationRoute() {
  const room = useMatch('/app/rooms/:roomId/*');
  const dm = useMatch('/app/dms/:dmId');
  return { roomId: room?.params.roomId, dmId: dm?.params.dmId };
}
