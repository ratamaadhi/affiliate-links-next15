import Link from 'next/link';

const links = [
  {
    title: 'Features',
    href: '#',
  },
  {
    title: 'Solution',
    href: '#',
  },
  {
    title: 'Customers',
    href: '#',
  },
  {
    title: 'Pricing',
    href: '#',
  },
  {
    title: 'Help',
    href: '#',
  },
  {
    title: 'About',
    href: '#',
  },
];

export default function FooterLinks() {
  return (
    <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className="text-muted-foreground hover:text-primary block duration-150"
        >
          <span>{link.title}</span>
        </Link>
      ))}
    </div>
  );
}
