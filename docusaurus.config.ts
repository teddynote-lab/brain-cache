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

  organizationName: 'brain-crew',
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
        id: 'knowledge',
        path: 'knowledge',
        routeBasePath: 'knowledge',
        showReadingTime: true,
        blogTitle: 'Knowledge',
        blogDescription: '프로젝트 실전 경험에서 얻은 인사이트와 노하우',
        postsPerPage: 10,
        blogSidebarTitle: 'Knowledge',
        blogSidebarCount: 15,
        feedOptions: {
          type: ['rss', 'atom'],
          xslt: true,
          title: 'Brain Cache - Knowledge',
          description: '프로젝트 실전 경험에서 얻은 인사이트와 노하우',
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
        {to: '/knowledge', label: 'Knowledge', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          href: 'https://github.com/brain-crew',
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
            {label: 'Knowledge', to: '/knowledge'},
            {label: 'Guides', to: '/docs/intro'},
          ],
        },
        {
          title: 'Popular Tags',
          items: [
            {label: 'LLM', to: '/blog/tags/llm'},
            {label: 'RAG & Retrieval', to: '/blog/tags/retrieval'},
            {label: 'AI Agent', to: '/blog/tags/ai-agent'},
            {label: 'Infrastructure', to: '/blog/tags/infrastructure'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'RSS Feed', href: '/blog/rss.xml'},
            {label: 'GitHub', href: 'https://github.com/brain-crew'},
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
