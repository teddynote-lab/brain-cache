import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './about.module.css';

/* ── Data ──────────────────────────────────── */

const TEAM = [
  {
    name: '김성연',
    nameEn: 'Sungyeon',
    role: 'AI Research Engineer',
    image: '/img/authors/sungyeon.jpeg',
    github: 'https://github.com/seongyeon1',
  },
  {
    name: '최재훈',
    nameEn: 'Jaehun',
    role: 'Team Lead',
    image: '/img/authors/jaehun.png',
  },
  {
    name: '강민석',
    nameEn: 'Mason',
    role: 'AI Research Engineer',
    image: '/img/authors/mason.jpeg',
  },
  {
    name: '김태한',
    nameEn: 'Hank',
    role: 'AI Research Engineer',
    image: '/img/authors/hank.png',
  },
  {
    name: '신승엽',
    nameEn: 'Dante',
    role: 'AI Research Engineer',
    image: '/img/authors/dante.png',
  },
];

const TECH_CATEGORIES = [
  {
    title: 'LLM & AI',
    items: ['Claude', 'GPT-4o', 'AWS Bedrock', 'LangChain', 'LangGraph', 'vLLM'],
  },
  {
    title: 'Retrieval',
    items: ['Pinecone', 'Weaviate', 'Milvus', 'Elasticsearch', 'OpenSearch'],
  },
  {
    title: 'Backend',
    items: ['FastAPI', 'Python', 'PostgreSQL', 'Redis', 'Docker'],
  },
  {
    title: 'Infrastructure',
    items: ['AWS', 'Kubernetes', 'GitHub Actions', 'Grafana'],
  },
];

const FOCUS_AREAS = [
  {title: 'RAG & Retrieval', desc: '기업 내부 문서 기반 검색 증강 생성'},
  {title: 'LLM Agent', desc: '복잡한 업무를 자율적으로 수행하는 AI 에이전트'},
  {title: 'Evaluation', desc: 'LLM 애플리케이션 품질 측정 및 개선 시스템'},
  {title: 'Infrastructure', desc: '모델 서빙, GPU 최적화, 프로덕션 인프라'},
];

/* ── Components ────────────────────────────── */

function HeroSection() {
  const logoLight = useBaseUrl('/img/braincrew-wordmark.svg');
  const logoDark = useBaseUrl('/img/braincrew-wordmark-white.svg');
  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <img
          src={logoLight}
          alt="Brain Crew"
          className={`${styles.heroLogo} ${styles.heroLogoLight}`}
        />
        <img
          src={logoDark}
          alt="Brain Crew"
          className={`${styles.heroLogo} ${styles.heroLogoDark}`}
        />
        <p className={styles.heroDesc}>
          기업이 AI를 실질적으로 활용할 수 있도록 돕는 AI 전문 기업입니다.
          <br />
          RAG, LLM Agent, 평가 시스템 등 핵심 기술을 연구하고 엔터프라이즈 솔루션을 구축합니다.
        </p>
        <div className={styles.heroLinks}>
          <a href="https://brain-crew.com" target="_blank" rel="noopener noreferrer" className={styles.heroLink}>
            Homepage
          </a>
          <a href="https://github.com/teddynote-lab" target="_blank" rel="noopener noreferrer" className={styles.heroLink}>
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function FocusSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Focus Areas</div>
        <div className={styles.focusGrid}>
          {FOCUS_AREAS.map((area) => (
            <div key={area.title} className={styles.focusCard}>
              <h3 className={styles.focusTitle}>{area.title}</h3>
              <p className={styles.focusDesc}>{area.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamCard({member}: {member: typeof TEAM[number]}) {
  const imgSrc = useBaseUrl(member.image);
  return (
    <div className={styles.teamCard}>
      <img src={imgSrc} alt={member.name} className={styles.teamAvatar} />
      <div className={styles.teamInfo}>
        <h3 className={styles.teamName}>
          {member.name}
          <span className={styles.teamNameEn}>{member.nameEn}</span>
        </h3>
        <span className={styles.teamRole}>{member.role}</span>
        {member.github && (
          <a href={member.github} target="_blank" rel="noopener noreferrer" className={styles.teamLink}>
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}

function TeamSection() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Team</div>
        <p className={styles.sectionDesc}>Research & Engineering 팀을 소개합니다.</p>
        <div className={styles.teamGrid}>
          {TEAM.map((member) => (
            <TeamCard key={member.nameEn} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TechSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionLabel}>Tech Stack</div>
        <div className={styles.techGrid}>
          {TECH_CATEGORIES.map((cat) => (
            <div key={cat.title} className={styles.techCategory}>
              <h3 className={styles.techCatTitle}>{cat.title}</h3>
              <div className={styles.techItems}>
                {cat.items.map((item) => (
                  <span key={item} className={styles.techBadge}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CareerSection() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.container}>
        <div className={styles.careerInner}>
          <div>
            <div className={styles.sectionLabel}>Career</div>
            <h2 className={styles.careerTitle}>함께 성장할 동료를 찾습니다</h2>
            <p className={styles.careerDesc}>
              AI에 열정을 가진 엔지니어를 찾고 있습니다.
              최신 기술을 실무에 적용하고, 팀과 함께 성장하고 싶다면 지원해주세요.
            </p>
          </div>
          <a
            href="https://brain-crew.com/apply"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.careerBtn}
          >
            채용 페이지 보기
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Page ───────────────────────────────────── */

export default function AboutPage(): ReactNode {
  return (
    <Layout title="About" description="Brain Crew 소개">
      <main>
        <HeroSection />
        <FocusSection />
        <TeamSection />
        <TechSection />
        <CareerSection />
      </main>
    </Layout>
  );
}
