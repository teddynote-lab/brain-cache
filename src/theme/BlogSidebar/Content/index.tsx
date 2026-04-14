import React, {memo, type ReactNode} from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {groupBlogSidebarItemsByYear} from '@docusaurus/plugin-content-blog/client';
import {useLocation} from '@docusaurus/router';
import {usePluginData} from '@docusaurus/useGlobalData';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import type {Props} from '@theme/BlogSidebar/Content';

interface PostItem {
  title: string;
  permalink: string;
  tags: {label: string}[];
}

function BlogSidebarYearGroup({
  year,
  yearGroupHeadingClassName,
  children,
}: {
  year: string;
  yearGroupHeadingClassName?: string;
  children: ReactNode;
}) {
  return (
    <div role="group">
      <Heading as="h3" className={yearGroupHeadingClassName}>
        {year}
      </Heading>
      {children}
    </div>
  );
}

function SeminarTagGroupedSidebar({items}: {items: {title: string; permalink: string}[]}) {
  let allPosts: PostItem[] = [];
  try {
    const data = usePluginData('recent-posts-plugin') as any;
    allPosts = (data?.recentPosts || []) as PostItem[];
  } catch {
    // fallback
  }

  // Build permalink → tags map from global data
  const tagMap = new Map<string, string[]>();
  for (const post of allPosts) {
    if (post.permalink.startsWith('/seminar/')) {
      tagMap.set(post.permalink, post.tags.map((t) => t.label));
    }
  }

  // Group sidebar items by their first tag
  const grouped = new Map<string, typeof items>();
  const uncategorized: typeof items = [];

  for (const item of items) {
    const tags = tagMap.get(item.permalink);
    if (tags && tags.length > 0) {
      // Use the first non-"seminar" tag, or the first tag
      const tag = tags.find((t) => t.toLowerCase() !== 'seminar') || tags[0];
      const capitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
      if (!grouped.has(capitalized)) grouped.set(capitalized, []);
      grouped.get(capitalized)!.push(item);
    } else {
      uncategorized.push(item);
    }
  }

  // Sort groups alphabetically
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (uncategorized.length > 0) {
    sortedGroups.push(['기타', uncategorized]);
  }

  return (
    <>
      {sortedGroups.map(([tag, tagItems]) => (
        <div key={tag} role="group" style={{marginBottom: '0.75rem'}}>
          <Heading
            as="h3"
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--ifm-color-primary)',
              margin: '1rem 0 0.4rem',
              fontFamily: 'var(--ifm-font-family-monospace)',
            }}
          >
            {tag}
          </Heading>
          <ul className="clean-list" style={{fontSize: '0.9rem'}}>
            {tagItems.map((item) => (
              <li key={item.permalink} style={{marginTop: '0.5rem'}}>
                <Link
                  to={item.permalink}
                  style={{
                    color: 'var(--ifm-font-color-base)',
                    display: 'block',
                    textDecoration: 'none',
                  }}
                  className="sidebar-seminar-link"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function BlogSidebarContent({
  items,
  yearGroupHeadingClassName,
  ListComponent,
}: Props): ReactNode {
  const themeConfig = useThemeConfig();
  const location = useLocation();

  // Seminar route: group by tag instead of year
  if (location.pathname.startsWith('/seminar')) {
    return <SeminarTagGroupedSidebar items={items} />;
  }

  if (themeConfig.blog.sidebar.groupByYear) {
    const itemsByYear = groupBlogSidebarItemsByYear(items);
    return (
      <>
        {itemsByYear.map(([year, yearItems]) => (
          <BlogSidebarYearGroup
            key={year}
            year={year}
            yearGroupHeadingClassName={yearGroupHeadingClassName}>
            <ListComponent items={yearItems} />
          </BlogSidebarYearGroup>
        ))}
      </>
    );
  } else {
    return <ListComponent items={items} />;
  }
}

export default memo(BlogSidebarContent);
