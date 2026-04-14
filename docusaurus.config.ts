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

  url: 'https://teddynote-lab.github.io',
  baseUrl: '/brain-cache/',

  organizationName: 'teddynote-lab',
  projectName: 'brain-cache',
  trailingSlash: false,

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
          authorsMapPath: '../authors.yml',
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
    'docusaurus-plugin-image-zoom',
    './plugins/recent-posts.js',
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'lab',
        path: 'lab',
        routeBasePath: 'lab',
        authorsMapPath: '../authors.yml',
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
        authorsMapPath: '../authors.yml',
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
        authorsMapPath: '../authors.yml',
        showReadingTime: true,
        blogTitle: 'Seminar & Paper',
        blogDescription: '팀 내부 세미나 발표자료, 논문 리뷰 및 스터디 정리',
        postsPerPage: 10,
        blogSidebarTitle: 'Seminar & Paper',
        blogSidebarCount: 'ALL',
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

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['ko', 'en'],
        indexBlog: true,
        indexDocs: true,
        blogRouteBasePath: ['/blog', '/lab', '/projects', '/seminar'],
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchBarShortcutHint: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
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
        {to: '/posts', label: 'All Posts', position: 'left'},
        {to: '/posts?tab=Library', label: 'Library', position: 'left'},
        {to: '/posts?tab=Lab', label: 'Lab', position: 'left'},
        {to: '/posts?tab=Projects', label: 'Projects', position: 'left'},
        {to: '/posts?tab=Seminar', label: 'Seminar & Paper', position: 'left'},
        {to: '/about', label: 'About', position: 'left'},
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
          label: 'Homepage',
          href: 'https://brain-crew.com/',
        },
        {
          label: 'Career',
          href: 'https://brain-crew.com/apply/rag',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/teddynote-lab',
        },
        {
          label: 'RSS Feed',
          href: 'https://teddynote-lab.github.io/brain-cache/blog/rss.xml',
        },
      ],
      copyright: `© ${new Date().getFullYear()} 브레인크루(주) · 대표이사 이경록<br/>경기도 성남시 분당구 정자로 2, 1602호 · dev@brain-crew.com`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash', 'yaml', 'json', 'toml'],
      magicComments: [
        {
          className: 'theme-code-block-highlighted-line',
          line: 'highlight-next-line',
          block: {start: 'highlight-start', end: 'highlight-end'},
        },
      ],
    },
    zoom: {
      selector: '.markdown img',
      background: {
        light: 'rgba(255, 255, 255, 0.9)',
        dark: 'rgba(13, 17, 23, 0.9)',
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
