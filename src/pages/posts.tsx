import type {ReactNode} from 'react';
import {useState, useEffect, useMemo} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {useLocation} from '@docusaurus/router';
import {usePluginData} from '@docusaurus/useGlobalData';

import styles from './posts.module.css';

interface PostItem {
  title: string;
  permalink: string;
  date: string;
  formattedDate: string;
  description?: string;
  tags: {label: string; permalink: string}[];
  authors: string[];
  category: string;
}

const TABS = [
  {key: 'all', label: 'All'},
  {key: 'Library', label: 'Library'},
  {key: 'Lab', label: 'Lab'},
  {key: 'Projects', label: 'Projects'},
  {key: 'Seminar', label: 'Seminar & Paper'},
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Library: 'var(--color-library)',
  Lab: 'var(--color-lab)',
  Projects: 'var(--color-projects)',
  Seminar: 'var(--color-seminar)',
};

function useBlogPosts(): PostItem[] {
  try {
    const data = usePluginData('recent-posts-plugin') as any;
    return (data?.recentPosts || []) as PostItem[];
  } catch {
    return [];
  }
}

function groupByYear(posts: PostItem[]): [string, PostItem[]][] {
  const map = new Map<string, PostItem[]>();
  for (const post of posts) {
    const year = new Date(post.date).getFullYear().toString();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(post);
  }
  return [...map.entries()].sort(([a], [b]) => Number(b) - Number(a));
}

function PostRow({post}: {post: PostItem}) {
  const color = CATEGORY_COLORS[post.category] || 'var(--ifm-color-primary)';
  return (
    <Link to={post.permalink} className={styles.row}>
      <div className={styles.rowMeta}>
        <time className={styles.rowDate}>{post.formattedDate}</time>
        <span className={styles.rowCategory} style={{color}}>
          {post.category}
        </span>
      </div>
      <div className={styles.rowBody}>
        <h3 className={styles.rowTitle}>{post.title}</h3>
        {post.description && (
          <p className={styles.rowDesc}>{post.description}</p>
        )}
        <div className={styles.rowTags}>
          {post.tags.slice(0, 4).map((t) => (
            <span key={t.label} className={styles.rowTag}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

const VALID_TABS = new Set(TABS.map((t) => t.key));

function getTabFromSearch(search: string): string {
  try {
    const params = new URLSearchParams(search);
    return params.get('tab') || '';
  } catch {
    return '';
  }
}

export default function PostsPage(): ReactNode {
  const allPosts = useBlogPosts();
  const location = useLocation();
  const paramTab = getTabFromSearch(location.search);
  const resolvedTab = VALID_TABS.has(paramTab) ? paramTab : 'all';
  const [activeTab, setActiveTab] = useState<string>(resolvedTab);

  // Sync tab when URL query changes (navbar clicks)
  useEffect(() => {
    const t = getTabFromSearch(location.search);
    if (VALID_TABS.has(t)) {
      setActiveTab(t);
    } else if (!location.search || !t) {
      setActiveTab('all');
    }
  }, [location.search]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return allPosts;
    return allPosts.filter((p) => p.category === activeTab);
  }, [allPosts, activeTab]);

  const grouped = useMemo(() => groupByYear(filtered), [filtered]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {all: allPosts.length};
    for (const post of allPosts) {
      map[post.category] = (map[post.category] || 0) + 1;
    }
    return map;
  }, [allPosts]);

  return (
    <Layout title="Posts" description="전체 글 목록">
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Posts</h1>
            <p className={styles.pageDesc}>
              총 {allPosts.length}개의 글
            </p>
          </div>

          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  window.history.replaceState(null, '', tab.key === 'all' ? '/posts' : `/posts?tab=${tab.key}`);
                }}
              >
                {tab.label}
                <span className={styles.tabCount}>{counts[tab.key] || 0}</span>
              </button>
            ))}
          </div>

          <div className={styles.list}>
            {grouped.map(([year, posts]) => (
              <div key={year} className={styles.yearGroup}>
                <div className={styles.yearLabel}>{year}</div>
                <div className={styles.yearPosts}>
                  {posts.map((post) => (
                    <PostRow key={post.permalink} post={post} />
                  ))}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <p className={styles.empty}>아직 작성된 글이 없습니다.</p>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}
