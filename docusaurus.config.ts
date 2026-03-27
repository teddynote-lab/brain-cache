import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Brain Cache',
  tagline: 'AI Research & Engineering Insights by Brain Crew',
  favicon: 'img/logo.png',

  future: {
    v4: true,
  },

  url: 'https://tech.brain-crew.com',
  baseUrl: '/',

  organizationName: 'teddynote-lab',
  projectName: 'brain-cache',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },

  markdown: {
    format: 'md',
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: {
          path: 'blog',
          routeBasePath: 'blog',
          showReadingTime: true,
          blogTitle: 'Library',
          blogDescription: '외부 아티클, 논문 리뷰, 기술 레퍼런스 큐레이션',
          postsPerPage: 10,
          blogSidebarTitle: 'Library',
          blogSidebarCount: 15,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            title: 'Brain Cache - Library',
            description: '외부 아티클, 논문 리뷰, 기술 레퍼런스 큐레이션',
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'lab',
        path: 'lab',
        routeBasePath: 'lab',
        showReadingTime: true,
        blogTitle: 'Lab',
        blogDescription: '직접 실험하고 리서치한 결과물 — Research, Experiments, Knowledge 통합',
        postsPerPage: 10,
        blogSidebarTitle: 'Lab',
        blogSidebarCount: 15,
        feedOptions: {
          type: ['rss', 'atom'],
          xslt: true,
          title: 'Brain Cache - Lab',
          description: '직접 실험하고 리서치한 결과물',
        },
        onInlineTags: 'warn',
        onInlineAuthors: 'warn',
        onUntruncatedBlogPosts: 'ignore',
      },
    ],
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'projects',
        path: 'projects',
        routeBasePath: 'projects',
        showReadingTime: true,
        blogTitle: 'Projects',
        blogDescription: '회사 프로젝트 회고와 의사결정 기록',
        postsPerPage: 10,
        blogSidebarTitle: 'Projects',
        blogSidebarCount: 15,
        feedOptions: {
          type: ['rss', 'atom'],
          xslt: true,
          title: 'Brain Cache - Projects',
          description: '회사 프로젝트 회고와 의사결정 기록',
        },
        onInlineTags: 'warn',
        onInlineAuthors: 'warn',
        onUntruncatedBlogPosts: 'ignore',
      },
    ],
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'seminar',
        path: 'seminar',
        routeBasePath: 'seminar',
        showReadingTime: true,
        blogTitle: 'Seminar',
        blogDescription: '팀 내부 세미나 발표자료 및 스터디 정리',
        postsPerPage: 10,
        blogSidebarTitle: 'Seminar',
        blogSidebarCount: 15,
        feedOptions: {
          type: ['rss', 'atom'],
          xslt: true,
          title: 'Brain Cache - Seminar',
          description: '팀 내부 세미나 발표자료 및 스터디 정리',
        },
        onInlineTags: 'warn',
        onInlineAuthors: 'warn',
        onUntruncatedBlogPosts: 'ignore',
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'Braincrew',
        src: 'img/logo-wordmark.svg',
        srcDark: 'img/logo-wordmark-dark.svg',
        style: {height: '28px'},
      },
      items: [
        {to: '/blog', label: 'Library', position: 'left'},
        {to: '/lab', label: 'Lab', position: 'left'},
        {to: '/projects', label: 'Projects', position: 'left'},
        {to: '/seminar', label: 'Seminar', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          href: 'https://github.com/teddynote-lab',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Content',
          items: [
            {label: 'Library', to: '/blog'},
            {label: 'Lab', to: '/lab'},
            {label: 'Projects', to: '/projects'},
            {label: 'Seminar', to: '/seminar'},
            {label: 'Guides', to: '/docs/intro'},
          ],
        },
        {
          title: 'Brain Crew',
          items: [
            {label: 'Homepage', href: 'https://brain-crew.com'},
            {label: 'Careers', href: 'https://brain-crew.com/apply'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'RSS Feed', href: '/blog/rss.xml'},
            {label: 'GitHub', href: 'https://github.com/teddynote-lab'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Brain Crew. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash', 'yaml', 'json', 'toml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
