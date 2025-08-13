import CallToAction from '@/components/call-to-action';
import Features from '@/components/features';
import FooterSection from '@/components/footer';
import HeroSection from '@/components/hero-section';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Main component
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <main>
      <HeroSection session={session} />
      <Features />
      <CallToAction />
      <FooterSection />
    </main>
  );
}
