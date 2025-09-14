import { LinkPageContext } from '@/context/link-page-context';
import { useSwitchIsActive } from '@/hooks/mutations';
import { authClient } from '@/lib/auth-client';
import { useSearchParams } from 'next/navigation';
import { useContext } from 'react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';

function ToggleLinkActive({ isActive = false, linkId }) {
  const { selectedPage } = useContext(LinkPageContext);
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';

  const { trigger, isMutating } = useSwitchIsActive({
    page: pageIndex,
    search,
    pageId: selectedPage?.id,
  });

  async function handleSwitchIsActive(s) {
    const userId = (await authClient.getSession()).data?.user.id;
    if (!userId) {
      toast.error('You must be logged in to create a link');
      return;
    }
    await trigger({ id: linkId });
  }

  return (
    <div>
      <Switch
        disabled={isMutating}
        checked={isActive}
        onCheckedChange={handleSwitchIsActive}
      />
    </div>
  );
}

export default ToggleLinkActive;
