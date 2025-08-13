import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            Start Earning More
          </h2>
          <p className="mt-4">
            Join the creators and affiliates who are already boosting their
            income. Create your page in minutes, for free.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup">
                <span>Sign Up Now, It&apos;s Free!</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
