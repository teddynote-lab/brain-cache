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
          <Link className="button button--outline button--lg" to="/lab">
            Lab
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
    id: 'lab',
    heading: 'Lab',
    description: '직접 실험하고 리서치한 결과물 — Research, Experiments, Knowledge 통합',
    link: '/lab',
    topics: [
      {title: 'RAG', link: '/lab/tags/rag'},
      {title: 'Agent', link: '/lab/tags/agent'},
      {title: 'Evaluation', link: '/lab/tags/evaluation'},
      {title: 'Monitoring', link: '/lab/tags/monitoring'},
      {title: 'Data', link: '/lab/tags/data'},
      {title: 'Infrastructure', link: '/lab/tags/infrastructure'},
    ],
  },
  {
    id: 'projects',
    heading: 'Projects',
    description: '회사 프로젝트 회고와 의사결정 기록, 아키텍처 선택 배경을 공유',
    link: '/projects',
    topics: [
      {title: 'Retrospective', link: '/projects/tags/retrospective'},
      {title: 'Architecture', link: '/projects/tags/architecture'},
      {title: 'Decision Log', link: '/projects/tags/decision-log'},
    ],
  },
  {
    id: 'seminar',
    heading: 'Seminar',
    description: '팀 내부 세미나 발표자료, 스터디 정리, 워크숍 기록',
    link: '/seminar',
    topics: [
      {title: 'All Seminars', link: '/seminar'},
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
