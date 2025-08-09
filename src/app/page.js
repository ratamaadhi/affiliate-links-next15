import CallToAction from '@/components/call-to-action';
import Features from '@/components/features';
import FooterSection from '@/components/footer';
import HeroSection from '@/components/hero-section';

// Main component
export default function Home() {
  return (
    <main>
      <HeroSection />
      <Features />
      <CallToAction />
      <FooterSection />
    </main>
  );
}
