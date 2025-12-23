'use strict';
let fs = require('fs'),
    path = require('path'),
    fm = require('hexo-front-matter');

// Cache to prevent infinite loops during generation
let projectsCache = null;

// Load all projects from the _projects folder
async function loadProjects(ctx) {
    if (projectsCache)
        return projectsCache;

    const base = path.join(ctx.base_dir, 'source', '_projects');
    if (!fs.existsSync(base))
        return [];

    const mdFiles = fs.readdirSync(base).filter(name => /\.(md|markdown)$/i.test(name)),
        projects = [];

    for (const filename of mdFiles) {
        const fullPath = path.join(base, filename),
            raw = fs.readFileSync(fullPath, 'utf8'),
            parsed = fm.parse(raw);

        // Prepare the data object for Hexo's internal post renderer
        const data = {
            content: parsed._content,
            full_source: fullPath,
            source: filename
        };

        // Passing 'null' prevents Hexo from trying to read the file again
        await ctx.post.render(null, data);
        const slug = parsed.slug || filename.replace(/\.(md|markdown)$/i, ''),
            stat = fs.statSync(fullPath);

        // data.content has now been transformed into HTML by Hexo
        // Store the project entry
        projects.push({
            ...parsed,
            content: data.content,   // The fully processed body HTML
            slug: slug,
            path: `projects/${slug}/`,
            date: parsed.date ? new Date(parsed.date) : stat.mtime,
            project_tags: parsed.project_tags || parsed.tags || []
        });
    }

    return (projectsCache = projects.sort((a, b) => b.date - a.date));
}

// Generator: /projects + paginated pages + project detail pages
hexo.extend.generator.register('theme_projects', async function (locals) {
    const theme = this.theme.config || {},
        projCfg = theme.projects || {},
        title = projCfg.title || 'Projects'; // Projects title, defaults to "Projects", not currently used

    // Load all projects
    let allProjects = await loadProjects(this, hexo.base_dir);
    if (!allProjects.length)
        return [];

    // Paginated listing of projects + project detail pages
    const config = this.config || {},
        perPage =
            projCfg.per_page ||
            (config.index_generator && config.index_generator.per_page) ||
            config.per_page ||
            10,
        total = allProjects.length,
        totalPages = perPage > 0 ? Math.ceil(total / perPage) : 1,
        routes = [];

    // Paginated listing: /projects/, /projects/page/2/, ...
    for (let i = 1; i <= totalPages; i++) {
        const current = i,
            listPath =
                current === 1
                    ? 'projects/index.html'
                    : `projects/page/${current}/index.html`,
            start = perPage > 0 ? perPage * (current - 1) : 0,
            end = perPage > 0 ? start + perPage : total,
            pageProjects = allProjects.slice(start, end),
            prev = current > 1 ? current - 1 : 0,
            next = current < totalPages ? current + 1 : 0,
            prev_link =
                prev > 0
                    ? (prev === 1 ? 'projects/' : `projects/page/${prev}/`)
                    : '',
            next_link =
                next > 0
                    ? `projects/page/${next}/`
                    : '';

        // Add route to collection
        routes.push({
            path: listPath,
            layout: 'projects',
            data: {
                title,
                projects: pageProjects,
                current,
                total: totalPages,
                prev,
                next,
                prev_link,
                next_link
            }
        });
    }

    // Detail pages for _projects folder entries
    allProjects.forEach(project => {
        routes.push({
            path: project.path,
            layout: 'project',
            data: {
                title: project.title,
                project
            }
        });
    });

    return routes;
});

// Helper for sidebar (Note: Helpers must be synchronous, so we use the cache)
hexo.extend.helper.register('recent_projects', function (limit = 5) {
    return (projectsCache || []).slice(0, limit);
});