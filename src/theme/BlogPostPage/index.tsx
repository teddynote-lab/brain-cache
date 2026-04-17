import React from 'react';
import Head from '@docusaurus/Head';
import BlogPostPage from '@theme-original/BlogPostPage';
import type BlogPostPageType from '@theme/BlogPostPage';
import type {WrapperProps} from '@docusaurus/types';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Comments from '@site/src/components/Comments';

type Props = WrapperProps<typeof BlogPostPageType>;

export default function BlogPostPageWrapper(props: Props): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const location = useLocation();

  const metadata = (props as any).content?.metadata;
  const title = metadata?.title || '';
  const description = metadata?.description || '';
  const tags = (metadata?.tags || []).map((t: any) => t.label || t);
  const permalink = metadata?.permalink || location.pathname;
  const fullUrl = `${siteConfig.url}${permalink}`;
  const date = metadata?.date || '';
  const authors = metadata?.authors || [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    url: fullUrl,
    datePublished: date,
    dateModified: metadata?.lastUpdatedAt
      ? new Date(metadata.lastUpdatedAt * 1000).toISOString()
      : date,
    author: authors.map((a: any) => ({
      '@type': 'Person',
      name: a.name || a,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'Brain Crew',
      url: 'https://brain-crew.com',
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/img/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    keywords: tags.join(', '),
  };

  return (
    <>
      <Head>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      <BlogPostPage {...props} />
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <Comments />
          </div>
        </div>
      </div>
    </>
  );
}
