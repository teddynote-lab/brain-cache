import React from 'react';
import BlogPostItem from '@theme-original/BlogPostItem';
import type BlogPostItemType from '@theme/BlogPostItem';
import type {WrapperProps} from '@docusaurus/types';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import RelatedPosts from '@site/src/components/RelatedPosts';
import ShareButtons from '@site/src/components/ShareButtons';

type Props = WrapperProps<typeof BlogPostItemType>;

const CATEGORY_COLORS: Record<string, string> = {
  Library: 'var(--color-library)',
  Lab: 'var(--color-lab)',
  Projects: 'var(--color-projects)',
  Seminar: 'var(--color-seminar)',
};

function detectCategory(permalink: string): string {
  if (permalink.startsWith('/lab')) return 'Lab';
  if (permalink.startsWith('/projects')) return 'Projects';
  if (permalink.startsWith('/seminar')) return 'Seminar';
  return 'Library';
}

export default function BlogPostItemWrapper(props: Props): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const location = useLocation();
  const {metadata, isBlogPostPage} = useBlogPost();

  if (!isBlogPostPage) {
    return <BlogPostItem {...props} />;
  }

  const title = metadata.title || '';
  const tags = (metadata.tags || []).map((t) => t.label);
  const permalink = metadata.permalink || location.pathname;
  const fullUrl = `${siteConfig.url}${permalink}`;
  const category = detectCategory(permalink);
  const accentColor = CATEGORY_COLORS[category] || 'var(--ifm-color-primary)';

  return (
    <div className="blog-post-enhanced">

      {/* Source URL banner */}
      {(metadata as any).frontMatter?.source_url && (() => {
        const sourceUrl = (metadata as any).frontMatter.source_url;
        let hostname = sourceUrl;
        try {
          hostname = new URL(sourceUrl).hostname;
        } catch {
          // fallback to raw URL if parsing fails
        }
        return (
          <div className="blog-post-source">
            <span className="blog-post-source__label">Source</span>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="blog-post-source__link"
            >
              {hostname}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '4px'}}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        );
      })()}

      <BlogPostItem {...props} />

      <div className="blog-post-footer">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="blog-post-footer__tags">
            {tags.map((tag) => (
              <span key={tag} className="blog-post-footer__tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <ShareButtons title={title} url={fullUrl} />
        <RelatedPosts currentPermalink={permalink} tags={tags} />
      </div>
    </div>
  );
}
