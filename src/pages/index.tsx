import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <img
          src="/img/logo.svg"
          alt="Brain Cache Logo"
          className={clsx(styles.heroLogo, styles.heroLogoLight)}
        />
        <img
          src="/img/logo-dark.svg"
          alt="Brain Cache Logo"
          className={clsx(styles.heroLogo, styles.heroLogoDark)}
        />
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/blog">
            Library
          </Link>
          <Link className="button button--outline button--lg" to="/knowledge">
            Knowledge
          </Link>
        </div>
      </div>
    </header>
  );
}

const SECTIONS = [
  {
    id: 'library',
    heading: 'Library',
    description: '외부 아티클, 논문 리뷰, 기술 레퍼런스를 AI Research Engineer 관점에서 큐레이션',
    link: '/blog',
    topics: [
      {title: 'LLM & Post Training', link: '/blog/tags/llm'},
      {title: 'RAG & Retrieval', link: '/blog/tags/retrieval'},
      {title: 'AI Agent', link: '/blog/tags/ai-agent'},
      {title: 'Evaluation', link: '/blog/tags/evaluation'},
      {title: 'Infrastructure', link: '/blog/tags/infrastructure'},
      {title: 'Backend', link: '/blog/tags/backend'},
    ],
  },
  {
    id: 'knowledge',
    heading: 'Knowledge',
    description: '프로젝트 실전 경험에서 얻은 인사이트, 문제 해결 과정, 의사결정 맥락을 공유',
    link: '/knowledge',
    topics: [
      {title: 'RAG', link: '/knowledge/tags/rag'},
      {title: 'Agent', link: '/knowledge/tags/agent'},
      {title: 'Evaluation', link: '/knowledge/tags/evaluation'},
      {title: 'Monitoring', link: '/knowledge/tags/monitoring'},
      {title: 'Data', link: '/knowledge/tags/data'},
      {title: 'Infrastructure', link: '/knowledge/tags/infrastructure'},
    ],
  },
];

function ContentSections() {
  return (
    <section className={styles.topics}>
      <div className="container">
        {SECTIONS.map((section) => (
          <div key={section.id} className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <Heading as="h2" className={styles.topicsHeading}>
                {section.heading}
              </Heading>
              <p className={styles.sectionDesc}>{section.description}</p>
            </div>
            <div className={styles.topicsGrid}>
              {section.topics.map((topic) => (
                <Link key={topic.title} to={topic.link} className={styles.topicCard}>
                  <span className={styles.topicTitle}>{topic.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Home"
      description="Brain Crew의 AI Research & Engineering 기술 블로그">
      <HomepageHeader />
      <main>
        <ContentSections />
      </main>
    </Layout>
  );
}
