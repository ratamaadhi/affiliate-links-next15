import { Button } from '@/components/ui/button';
import { LinkSelect } from '@/lib/db/schema';

interface PagePreviewProps {
  links: LinkSelect[];
  page: { title: string; description: string } | null;
}

export function PagePreview({ links, page }: PagePreviewProps) {
  return (
    <div className="w-full">
      <div className="relative flex aspect-[9/16] max-h-[120vh] w-[340px] max-w-md origin-top flex-col items-center gap-10 mx-auto">
        <div className="h-full w-full scale-[.9]">
          <div className="relative h-full w-full overflow-hidden shadow-[0_121px_49px_#00000005,0_68px_41px_#00000014,0_30px_30px_#00000024,0_8px_17px_#00000029] rounded-[34px] border-4 border-muted-foreground/30">
            {/* real page content  */}
            <main className="relative h-full w-full px-3.5 flex flex-col bg-gradient-to-t from-accent to-background">
              <div className="flex flex-col items-center pt-8 pb-4 bg-background text-center">
                <p className="font-semibold text-xl w-full line-clamp-1">
                  {page.title}
                </p>
                <p>{page.description}</p>
              </div>
              <div className="flex flex-col gap-3.5 flex-1 overflow-y-scroll no-scrollbar pt-4 pb-8 min-h-0">
                {links && links.length > 0 ? (
                  links
                    .filter((link) => link.isActive)
                    .map((link) => (
                      <Button
                        key={link.id}
                        variant="outline"
                        className="w-full h-16 text-base rounded-xl bg-muted"
                        asChild
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="w-full truncate text-center text-sm">
                            {link.title}
                          </div>
                        </a>
                      </Button>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No active links to display.
                    </p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
