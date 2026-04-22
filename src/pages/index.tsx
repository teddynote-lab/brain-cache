import type {ReactNode} from 'react';
import {useState, useEffect} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {usePluginData} from '@docusaurus/useGlobalData';

import styles from './index.module.css';

/* ── Types ─────────────────────────────────── */

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

/* ── Data helpers ──────────────────────────── */

function useBlogPosts(): PostItem[] {
  try {
    const data = usePluginData('recent-posts-plugin') as any;
    return (data?.recentPosts || []) as PostItem[];
  } catch {
    return [];
  }
}

const CATEGORY_META: Record<string, {color: string; icon: string; desc: string; link: string}> = {
  Library: {
    color: 'var(--color-library)',
    icon: '📚',
    desc: '외부 아티클, 논문 리뷰, 기술 레퍼런스 큐레이션',
    link: '/blog',
  },
  Lab: {
    color: 'var(--color-lab)',
    icon: '🧪',
    desc: '직접 실험하고 리서치한 결과물',
    link: '/lab',
  },
  Projects: {
    color: 'var(--color-projects)',
    icon: '🚀',
    desc: '회사 프로젝트 회고와 의사결정 기록',
    link: '/projects',
  },
  Seminar: {
    color: 'var(--color-seminar)',
    icon: '🎓',
    desc: '팀 내부 세미나 발표자료, 논문 리뷰 및 스터디 정리',
    link: '/seminar',
  },
};

/* ── Components ────────────────────────────── */

function TypingText({texts}: {texts: string[]}) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 40);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIndex((prev) => (prev + 1) % texts.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, index, texts]);

  return (
    <span className={styles.typingText}>
      {displayed}
      <span className={styles.cursor}>|</span>
    </span>
  );
}

function HomepageHero() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.heroGlow} />
      <div className={styles.heroGrid} />
      <div className={clsx('container', styles.heroContent)}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Brain Crew Tech Blog
        </div>
        <Heading as="h1" className={styles.heroTitle}>
          <span className={styles.heroTitleAccent}>Brain</span>cache
        </Heading>
        <p className={styles.heroSubtitle}>
          <span className={styles.heroPrompt}>$</span>{' '}
          <TypingText
            texts={[
              'AI Research & Engineering Insights',
              'LLM · RAG · Agent · MLOps',
              '실험하고, 기록하고, 공유합니다',
            ]}
          />
        </p>
        {/* No CTA buttons — navigation via navbar */}
      </div>
    </header>
  );
}

function LatestSection({posts}: {posts: PostItem[]}) {
  if (posts.length === 0) return null;
  const featured = posts[0];
  const recent = posts.slice(1, 5);
  const featuredMeta = CATEGORY_META[featured.category];

  return (
    <section className={styles.latest}>
      <div className="container">
        <div className={styles.sectionLabel}>Latest</div>
        <div className={styles.latestGrid}>
          {/* Featured */}
          <Link to={featured.permalink} className={styles.featuredCard}>
            <div className={styles.featuredInner}>
              <span
                className={styles.featuredBadge}
                style={{
                  color: featuredMeta?.color,
                  borderColor: featuredMeta?.color,
                }}
              >
                {featured.category}
              </span>
              <Heading as="h2" className={styles.featuredTitle}>
                {featured.title}
              </Heading>
              {featured.description && (
                <p className={styles.featuredDesc}>{featured.description}</p>
              )}
              <div className={styles.featuredMeta}>
                <time>{featured.formattedDate}</time>
                {featured.authors?.[0] && <span>{featured.authors[0]}</span>}
              </div>
              <div className={styles.featuredReadMore}>
                Read article <span aria-hidden>→</span>
              </div>
            </div>
          </Link>

          {/* Recent list */}
          <div className={styles.recentList}>
            {recent.map((post) => {
              const meta = CATEGORY_META[post.category];
              return (
                <Link key={post.permalink} to={post.permalink} className={styles.recentItem}>
                  <div className={styles.recentCategoryDot} style={{background: meta?.color}} />
                  <div className={styles.recentContent}>
                    <span className={styles.recentCategory} style={{color: meta?.color}}>
                      {post.category}
                    </span>
                    <h3 className={styles.recentTitle}>{post.title}</h3>
                    <time className={styles.recentDate}>{post.formattedDate}</time>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryHub({posts}: {posts: PostItem[]}) {
  const categories = ['Library', 'Lab', 'Projects', 'Seminar'] as const;

  return (
    <section className={styles.categoryHub}>
      <div className="container">
        <div className={styles.sectionLabel}>Categories</div>
        <div className={styles.categoryGrid}>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const catPosts = posts.filter((p) => p.category === cat);
            const count = catPosts.length;
            const latestPosts = catPosts.slice(0, 3);

            return (
              <div key={cat} className={styles.categoryCard}>
                <Link to={meta.link} className={styles.categoryCardHeader}>
                  <div className={styles.categoryIcon} style={{background: meta.color}}>
                    {meta.icon}
                  </div>
                  <div>
                    <h3 className={styles.categoryName}>{cat}</h3>
                    <span className={styles.categoryCount}>{count} posts</span>
                  </div>
                  <span className={styles.categoryArrow}>→</span>
                </Link>
                <p className={styles.categoryDesc}>{meta.desc}</p>
                {latestPosts.length > 0 && (
                  <ul className={styles.categoryPosts}>
                    {latestPosts.map((post) => (
                      <li key={post.permalink}>
                        <Link to={post.permalink} className={styles.categoryPostLink}>
                          {post.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AllPostsGrid({posts}: {posts: PostItem[]}) {
  const display = posts.slice(0, 9);
  if (display.length === 0) return null;

  return (
    <section className={styles.allPosts}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>All Posts</div>
          <Link to="/blog" className={styles.viewAll}>
            View all →
          </Link>
        </div>
        <div className={styles.postGrid}>
          {display.map((post) => {
            const meta = CATEGORY_META[post.category];
            return (
              <Link key={post.permalink} to={post.permalink} className={styles.postCard}>
                <div className={styles.postCardTop}>
                  <span className={styles.postCardCategory} style={{color: meta?.color}}>
                    {post.category}
                  </span>
                  <time className={styles.postCardDate}>{post.formattedDate}</time>
                </div>
                <h3 className={styles.postCardTitle}>{post.title}</h3>
                {post.description && (
                  <p className={styles.postCardDesc}>
                    {post.description.length > 100
                      ? post.description.slice(0, 100) + '...'
                      : post.description}
                  </p>
                )}
                <div className={styles.postCardTags}>
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag.label} className={styles.postCardTag}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Page ───────────────────────────────────── */

export default function Home(): ReactNode {
  const allPosts = useBlogPosts();

  return (
    <Layout title="Home" description="Brain Crew의 AI Research & Engineering 기술 블로그">
      <HomepageHero />
      <main>
        <LatestSection posts={allPosts} />
        <CategoryHub posts={allPosts} />
        <AllPostsGrid posts={allPosts} />
      </main>
    </Layout>
  );
}
