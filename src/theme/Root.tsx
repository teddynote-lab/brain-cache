import React, {useEffect, useState, useCallback} from 'react';
import {useLocation} from '@docusaurus/router';

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  const isBlogPost =
    /^\/(blog|lab|projects|seminar)\//.test(location.pathname) &&
    !location.pathname.endsWith('/tags') &&
    !location.pathname.includes('/tags/') &&
    !location.pathname.includes('/authors') &&
    !location.pathname.includes('/archive') &&
    !location.pathname.includes('/page/');

  useEffect(() => {
    if (!isBlogPost) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isBlogPost, location.pathname]);

  if (!isBlogPost) return null;

  return (
    <div className="reading-progress-bar">
      <div
        className="reading-progress-bar__fill"
        style={{width: `${progress}%`}}
      />
    </div>
  );
}

function SidebarToggle() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isBlogPage =
    /^\/(blog|lab|projects|seminar)(\/|$)/.test(location.pathname) &&
    !location.pathname.includes('/authors') &&
    !location.pathname.includes('/archive');

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      const wrapper = document.querySelector('.blog-wrapper');
      if (!wrapper) return next;
      const sidebarCol = wrapper.querySelector('.col--3') as HTMLElement;
      const contentCol = wrapper.querySelector('.col--7') as HTMLElement;

      if (sidebarCol && contentCol) {
        if (next) {
          sidebarCol.style.opacity = '0';
          sidebarCol.style.transform = 'translateX(-20px)';
          setTimeout(() => {
            sidebarCol.style.width = '0';
            sidebarCol.style.minWidth = '0';
            sidebarCol.style.padding = '0';
            sidebarCol.style.overflow = 'hidden';
            sidebarCol.style.flex = '0 0 0%';
            contentCol.style.flex = '0 0 100%';
            contentCol.style.maxWidth = '100%';
          }, 150);
        } else {
          sidebarCol.style.width = '';
          sidebarCol.style.minWidth = '';
          sidebarCol.style.padding = '';
          sidebarCol.style.overflow = '';
          sidebarCol.style.flex = '';
          contentCol.style.flex = '';
          contentCol.style.maxWidth = '';
          setTimeout(() => {
            sidebarCol.style.opacity = '1';
            sidebarCol.style.transform = 'translateX(0)';
          }, 50);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    setCollapsed(false);
  }, [location.pathname]);

  if (!isBlogPage) return null;

  return (
    <button
      onClick={toggle}
      title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
      aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
      className="sidebar-toggle"
    >
      {collapsed ? '»' : '«'}
    </button>
  );
}

const TAB_TO_LABEL: Record<string, string> = {
  Library: 'Library',
  Lab: 'Lab',
  Projects: 'Projects',
  Seminar: 'Seminar & Paper',
};

function NavbarActiveSync() {
  const location = useLocation();

  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>('.navbar__items .navbar__link');
    const activeClass = 'navbar__link--active';

    // Clear all active states first
    links.forEach((link) => link.classList.remove(activeClass));

    if (location.pathname === '/posts') {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab') || '';
      const targetLabel = TAB_TO_LABEL[tab] || '';

      links.forEach((link) => {
        if (link.textContent?.trim() === targetLabel) {
          link.classList.add(activeClass);
        }
      });
    } else if (location.pathname.startsWith('/blog/') || location.pathname.startsWith('/lab/') || location.pathname.startsWith('/projects/') || location.pathname.startsWith('/seminar/')) {
      // Individual post pages: highlight matching category
      const category = location.pathname.startsWith('/blog/') ? 'Library'
        : location.pathname.startsWith('/lab/') ? 'Lab'
        : location.pathname.startsWith('/projects/') ? 'Projects'
        : 'Seminar & Paper';
      links.forEach((link) => {
        if (link.textContent?.trim() === category) {
          link.classList.add(activeClass);
        }
      });
    }
  }, [location.pathname, location.search]);

  return null;
}

export default function Root({children}: {children: React.ReactNode}) {
  return (
    <>
      <ReadingProgressBar />
      <SidebarToggle />
      <NavbarActiveSync />
      {children}
    </>
  );
}
