'use client';

import { LinkPageContext } from '@/context/link-page-context';
import { useContext } from 'react';

export function DashboardLinksPreview({
  pageLink,
  username,
}: {
  pageLink: string;
  username: string;
}) {
  const { selectedPage } = useContext(LinkPageContext);
  const slug = selectedPage?.slug === username ? '' : selectedPage?.slug;
  const fullLink = slug ? `${pageLink}/${slug}` : pageLink;

  if (!pageLink || !username) {
    return (
      <div className="w-full">
        <div className="relative flex aspect-[9/16] max-h-[120vh] w-[340px] max-w-[394px] origin-top scale-[1] flex-col items-center gap-10 mx-auto">
          <div className="h-full w-full">
            <div className="relative h-full w-full overflow-hidden shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] rounded-[34px] border-4 border-muted-foreground/30">
              <main className="relative h-full w-full px-3.5 flex flex-col bg-gradient-to-t from-accent to-background">
                <div className="flex flex-col gap-3.5 flex-1 overflow-y-scroll no-scrollbar py-8 text-center">
                  <p className="font-semibold">No Page Selected or Found</p>
                  <p className="text-sm text-muted-foreground">
                    Select a page to see its preview.
                  </p>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative flex aspect-[9/16] max-h-[120vh] w-[340px] origin-top scale-[1] flex-col items-center gap-10 mx-auto">
        <div className="h-full w-full">
          <div className="relative h-full w-full overflow-hidden shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] rounded-[34px] border-4 border-muted-foreground/30">
            <iframe className="w-full h-full" src={fullLink}></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
