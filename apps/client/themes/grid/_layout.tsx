import { Navigation } from 'letterpad-sdk';
import { FC, PropsWithChildren } from 'react';

import Link from '@/components/Link';
import ThemeSwitch from '@/components/ThemeSwitch';

import { Footer } from './commons/footer';
import { MobileNav } from './commons/mobile-nav';
import { LogoWithTitle } from './commons/site-logo';
import { getAuthorAndSettingsData } from '../../src/data';

export const Layout: FC<PropsWithChildren> = async ({ children }) => {
  const data = await getAuthorAndSettingsData();
  if (!data) return null;
  const { settings, me } = data;
  const routes = [...settings.menu];

  const menu = getMenu(routes);
  return (
    <>
      <div className={'bg-accent-50  bg-cover text-white'}>
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-20">
          <div>
            <Link href="/" aria-label={settings.site_title}>
              <LogoWithTitle
                logo={settings.site_logo}
                title={settings.site_title}
              />
            </Link>
          </div>
          <div className="lp-header-right flex items-center text-base leading-5">
            <div className="lp-menu hidden md:block">{menu}</div>
            <ThemeSwitch />
            <MobileNav routes={routes} />
          </div>
        </header>
      </div>
      <main className="mb-auto">{children}</main>
      <div className="border-b-[1px] dark:border-gray-700">
        <Footer author={me} settings={settings} />
      </div>
    </>
  );
};

function getMenu(menu: Omit<Navigation, 'original_name'>[]) {
  return menu.map((item, i) => {
    return item.type === 'custom' ? (
      <a
        key={item.slug}
        href={item.slug}
        className="p-1 text-md font-medium capitalize text-gray-50 sm:p-4"
      >
        {item.label}
      </a>
    ) : (
      <Link
        key={item.slug}
        href={i === 0 ? '/' : item.slug}
        target="_self"
        className="text-md font-medium capitalize text-gray-50 sm:p-4"
      >
        {item.label}
      </Link>
    );
  });
}
