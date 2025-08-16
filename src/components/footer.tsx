import Link from 'next/link';
import FooterLinks from './footer-links';
import SocialLinks from './social-links';

export default function FooterSection() {
  return (
    <footer className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/" aria-label="go home" className="mx-auto block size-fit">
          <div className="text-lg flex items-center gap-2">
            <span>💎</span>
            <span className="font-semibold">Aff-Link</span>
          </div>
        </Link>

        <FooterLinks />
        <SocialLinks />
        <span className="text-muted-foreground block text-center text-sm">
          {' '}
          © {new Date().getFullYear()} Affiliate Links App. All Rights
          Reserved.
        </span>
      </div>
    </footer>
  );
}
