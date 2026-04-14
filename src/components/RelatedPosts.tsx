import React from 'react';
import Link from '@docusaurus/Link';
import {usePluginData} from '@docusaurus/useGlobalData';

interface PostItem {
  title: string;
  permalink: string;
  date: string;
  formattedDate: string;
  description: string;
  tags: {label: string; permalink: string}[];
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Library: 'var(--color-library)',
  Lab: 'var(--color-lab)',
  Projects: 'var(--color-projects)',
  Seminar: 'var(--color-seminar)',
};

export default function RelatedPosts({
  currentPermalink,
  tags,
}: {
  currentPermalink: string;
  tags: string[];
}) {
  let allPosts: PostItem[] = [];
  try {
    const data = usePluginData('recent-posts-plugin') as any;
    allPosts = (data?.recentPosts || []) as PostItem[];
  } catch {
    return null;
  }

  if (!tags.length || !allPosts.length) return null;

  const scored = allPosts
    .filter((p) => p.permalink !== currentPermalink)
    .map((p) => {
      const postTags = p.tags.map((t) => t.label);
      const overlap = tags.filter((t) => postTags.includes(t)).length;
      return {...p, score: overlap};
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (scored.length === 0) return null;

  return (
    <div className="related-posts">
      <h3 className="related-posts__title">Related Posts</h3>
      <div className="related-posts__grid">
        {scored.map((post) => {
          const accentColor = CATEGORY_COLORS[post.category] || 'var(--ifm-color-primary)';
          return (
            <Link
              key={post.permalink}
              to={post.permalink}
              className="related-posts__card"
              style={{'--accent': accentColor} as React.CSSProperties}
            >
              <div className="related-posts__card-header">
                <span className="related-posts__category" style={{color: accentColor}}>
                  {post.category}
                </span>
                <span className="related-posts__date">{post.formattedDate}</span>
              </div>
              <span className="related-posts__card-title">{post.title}</span>
              {post.description && (
                <span className="related-posts__card-desc">{post.description}</span>
              )}
              <div className="related-posts__card-tags">
                {post.tags.slice(0, 3).map((t) => (
                  <span key={t.label} className="related-posts__tag">
                    {t.label}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
