const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function collectPosts(dir, routeBase) {
  const posts = [];
  if (!fs.existsSync(dir)) return posts;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const {data} = matter(content);
      if (!data.title || !data.date) continue;
      const slug = data.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.mdx?$/, '');
      posts.push({
        title: data.title,
        description: data.description || '',
        date: new Date(data.date).toISOString(),
        formattedDate: new Date(data.date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        permalink: `/${routeBase}/${slug}`,
        tags: (data.tags || []).map((t) => ({label: t, permalink: `/${routeBase}/tags/${t}`})),
        authors: Array.isArray(data.authors) ? data.authors : [],
        category: routeBase === 'blog' ? 'Library' : routeBase.charAt(0).toUpperCase() + routeBase.slice(1),
      });
    } catch (e) {
      // skip malformed files
    }
  }
  return posts;
}

module.exports = function recentPostsPlugin(context) {
  return {
    name: 'recent-posts-plugin',
    async contentLoaded({actions}) {
      const {setGlobalData} = actions;
      const siteDir = context.siteDir;
      const allPosts = [
        ...collectPosts(path.join(siteDir, 'blog'), 'blog'),
        ...collectPosts(path.join(siteDir, 'lab'), 'lab'),
        ...collectPosts(path.join(siteDir, 'projects'), 'projects'),
        ...collectPosts(path.join(siteDir, 'seminar'), 'seminar'),
      ];
      allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setGlobalData({recentPosts: allPosts});
    },
  };
};
