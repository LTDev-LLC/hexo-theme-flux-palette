'use strict';
// Markers for tab and accordion tags
const MARKER = {
    TAB_START: '@@FLUX_TAB_HEAD@@',
    TAB_SPLIT: '@@FLUX_TAB_SPLIT@@',
    TAB_END: '@@FLUX_TAB_FOOT@@',
    ACC_START: '@@FLUX_ACC_HEAD@@',
    ACC_SPLIT: '@@FLUX_ACC_SPLIT@@',
    ACC_END: '@@FLUX_ACC_FOOT@@'
};

// Helper to safely render Markdown string to HTML
function renderMd(text) {
    try {
        return hexo.render.renderSync({ text: text || '', engine: 'markdown' });
    } catch (e) {
        console.error('[Flux Tags] Render error:', e);
        return text;
    }
}

// Auto-linkify headers for permalinks
// This is a custom implementation to avoid Hexo's default behavior
hexo.extend.filter.register('after_post_render', function (data) {
    if (!data.content)
        return data;

    // Regex to capture h1-h6 with an auto-generated id
    const regex = /<h([1-6])([^>]*?)id="([^"]+)"([^>]*?)>(.*?)<\/h\1>/gi;

    // Replace with auto-linkified headers
    data.content = data.content.replace(regex, (match, level, preAttrs, id, postAttrs, text) => {
        // If the header already contains a link, strip it out
        if (text.includes('<a '))
            text = text.replace(/<a [^>]+>(.*?)<\/a>/gi, '$1');

        // Clean title for the title attribute
        const plainTitle = text.trim().replace(/<[^>]+>/g, '').replace(/"/g, '&quot;');

        return `<h${level}${preAttrs}id="${id}"${postAttrs}><a href="#${id}" class="headerlink" title="${plainTitle}">${text}</a></h${level}>`;
    });

    // Return modified data
    return data;
});

// Register child tag for tabs
hexo.extend.tag.register('tab', function (args, content) {
    return `${MARKER.TAB_START}${args.join(' ').replace(/["']/g, '')}${MARKER.TAB_SPLIT}${content || ''}${MARKER.TAB_END}`;
}, { ends: true });

// Register parent tag for tabs
hexo.extend.tag.register('tabs', function (args, content) {
    const raw = content || '',
        tabs = [],
        chunks = raw.split(MARKER.TAB_START);

    // Parse each tab block
    for (let i = 1; i < chunks.length; i++) {
        const chunk = chunks[i],
            endIdx = chunk.indexOf(MARKER.TAB_END);

        // No end marker
        if (endIdx === -1)
            continue;

        // Add tab
        const block = chunk.substring(0, endIdx),
            parts = block.split(MARKER.TAB_SPLIT);
        if (parts.length >= 2)
            tabs.push({
                title: parts[0].trim(),
                content: renderMd(parts.slice(1).join(MARKER.TAB_SPLIT))
            });
    }

    // No tabs found
    if (!tabs.length)
        return renderMd(raw);

    // Build tabs HTML
    let [
        nav,
        panels
    ] = tabs.reduce(([navAcc, panelAcc], tab, i) => ([
        navAcc += `<button type="button" class="tab-btn" :class="{ 'active': tab === ${i} }"  @click="tab = ${i}" role="tab">${tab.title}</button>`,
        panelAcc += `<div class="tab-panel" x-show="tab === ${i}"  x-cloak role="tabpanel">${tab.content}</div>`
    ]), ['<div class="tabs-nav" role="tablist">', '<div class="tabs-panels">']);

    // Return complete tabs HTML with Alpine.js logic
    return `<div class="tabs-container" x-data="${`{
        tab: 0,
        init() {
            this.check();
            window.addEventListener('hashchange', () => this.check());
        },
        check() {
            if (!window.location.hash)
                return;
            try {
                const el = document.querySelector(window.location.hash);
                if (el && this.$el.contains(el)) {
                    const panels = this.$el.querySelectorAll('.tab-panel');
                    for (let i = 0; i < panels.length; i++) {
                        if (panels[i].contains(el)) {
                            this.tab = i;
                            this.$nextTick(() => el.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            }));
                            break;
                        }
                    }
                }
            } catch (e) {}
        }
    }`.replace(/"/g, "'")}">${nav}</div>${panels}</div></div>`;
}, { ends: true });

// Child tag for accordion items
hexo.extend.tag.register('accordion', function (args, content) {
    return `${MARKER.ACC_START}${args.join(' ').replace(/["']/g, '')}${MARKER.ACC_SPLIT}${content || ''}${MARKER.ACC_END}`;
}, { ends: true });

// Parent tag for accordion
hexo.extend.tag.register('accordions', function (args, content) {
    const raw = content || '',
        items = [],
        chunks = raw.split(MARKER.ACC_START);

    // Parse each accordion block
    for (let i = 1; i < chunks.length; i++) {
        const chunk = chunks[i],
            endIdx = chunk.indexOf(MARKER.ACC_END);
        if (endIdx === -1)
            continue;

        // Add item
        const block = chunk.substring(0, endIdx),
            parts = block.split(MARKER.ACC_SPLIT);
        if (parts.length >= 2)
            items.push({
                title: parts[0].trim(),
                content: renderMd(parts.slice(1).join(MARKER.ACC_SPLIT))
            });
    }

    // No items found
    if (!items.length)
        return renderMd(raw);

    // Build accordion HTML
    let html = items.reduce((htmlAcc, item, i) => ([
        ...htmlAcc,
        `<div class="accordion-item">
            <button type="button"
                class="accordion-header"
                @click="active = (active === ${i} ? null : ${i})"
                :class="{ 'active': active === ${i} }">
                <span>${item.title}</span>
                <span x-text="active === ${i} ? '-' : '+'">+</span>
            </button>
            <div class="accordion-content" x-show="active === ${i}" x-collapse x-cloak>
                <div class="accordion-inner">${item.content}</div>
            </div>
        </div>`
    ]), ['<div class="accordion-group" x-data="{ active: null }">']).join('');

    // Replace the opening div with the robust x-data
    return html.replace(
        '<div class="accordion-group" x-data="{ active: null }">',
        `<div class="accordion-group" x-data="${`{
        active: null,
        init() {
            this.check();
            window.addEventListener('hashchange', () => this.check());
        },
        check() {
            if (!window.location.hash)
                return;
            try {
                const el = document.querySelector(window.location.hash);
                if (el && this.$el.contains(el)) {
                    const items = this.$el.querySelectorAll('.accordion-item');
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].contains(el)) {
                            this.$nextTick(() => items[i].scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            }));
                            break;
                        }
                    }
                }
            } catch (e) {}
        }
    }`.replace(/"/g, "'")}">`) + '</div>';
}, { ends: true });

// Inject Alpine.js copy button into Hexo's code blocks
hexo.extend.filter.register('after_post_render', function (data) {
    if (!data.content)
        return data;

    // Regex to match the opening tag of the figure and optional caption
    const regex = /(<figure class="highlight.*?>)(?:<figcaption>.*?<\/figcaption>)?/gi;

    // Inject Alpine.js copy button and language label
    data.content = data.content.replace(regex, (match, openTag) => {
        // Extract language from class="highlight language"
        let lang = 'code';
        const classMatch = /class=["']highlight\s+([a-zA-Z0-9\-_]+)/.exec(openTag);

        // Extract language from class="highlight"
        if (classMatch && classMatch[1])
            lang = classMatch[1];

        // Clean up display text
        if (lang === 'plain')
            lang = 'text';

        // Inject container with language label and copy button
        return `${match}
        <div class="code-actions">
            <button class="code-copy-btn" x-data="codeCopy" @click="copy" aria-label="Copy code">
                <template x-if="!copied">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span class="copy-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        </span>
                        <span class="copy-text">Copy</span>
                    </div>
                </template>
                <template x-if="copied">
                    <div style="display: flex; align-items: center; gap: 4px;" x-cloak>
                        <span class="copy-success-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        </span>
                        <span class="copy-success">Copied!</span>
                    </div>
                </template>
            </button>
            <span class="code-lang">${lang.toUpperCase()}</span>
        </div>`;
    });

    // Return modified data
    return data;
});

// Standard icons for alert types
const ICONS = {
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    danger: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    tip: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
};

// Register alert tag
hexo.extend.tag.register('alert', function (args, content) {
    const type = (args[0] || 'info').toLowerCase(),
        title = args.length > 1 ? args.slice(1).join(' ') : type.charAt(0).toUpperCase() + type.slice(1);

    // Return alert HTML
    return `
    <div class="alert alert-${type}">
        <div class="alert-title">
            <span class="alert-icon">${ICONS[type] || ICONS['info']}</span>
            <span>${title}</span>
        </div>
        <div class="alert-content">${renderMd(content || '')}</div>
    </div>`;
}, { ends: true });

// Register the gallery tag
hexo.extend.tag.register('gallery', function (args, content) {
    const config = hexo.theme.config.gallery || {},
        siteUrl = hexo.config.url;

    // Determine if thumbnails are enabled (default to config, fallback to true)
    let useThumbs = config.thumbnails !== false;

    // Parse arguments to determine if thumbnails are enabled/disabled
    args.forEach(arg => {
        const [key, val] = arg.split(':');
        if (key === 'thumb' || key === 'thumbnails')
            useThumbs = val !== 'false' && val !== '0' && val !== 'off';
    });

    // Get service pattern, default wsrv.nl
    const servicePattern = config.service_pattern || "https://wsrv.nl/?url=%s&w=300&h=300&fit=inside&q=80";

    // Render markdown, strip <p> tags, and process images
    let rendered = renderMd(content || '')
        .replace(/<\/?p[^>]*>/g, '')
        .replace(/<img([^>]*)>/gi, (match, attr) => {
            const srcMatch = attr.match(/src=["']([^"']+)["']/),
                originalSrc = srcMatch ? srcMatch[1] : '';
            let thumbSrc = originalSrc;

            // Generate thumbnail URL if enabled
            if (useThumbs && originalSrc) {
                try {
                    let fullUrl = originalSrc;

                    // Check if the image source is a local path (not starting with http/https)
                    // and if the user has defined a site URL in _config.yml
                    if (!/^https?:\/\//.test(originalSrc) && siteUrl)
                        fullUrl = new URL(originalSrc, siteUrl).href;
                    else if (/^https?:\/\//.test(originalSrc))
                        fullUrl = originalSrc;

                    // Only apply the thumbnail service pattern if we have a valid absolute URL
                    if (/^https?:\/\//.test(fullUrl))
                        thumbSrc = servicePattern.replace('%s', encodeURIComponent(fullUrl));
                } catch { }
            }

            // Replace src with the generated thumbnail
            let newAttr = attr.replace(/src=["']([^"']+)["']/, `src="${thumbSrc}"`);

            // Add data-original-src pointing to the original image for the lightbox
            newAttr += ` data-original-src="${originalSrc}"`;

            // Extract Alt Text
            const altMatch = newAttr.match(/alt=["']([^"']*)["']/),
                altText = altMatch ? altMatch[1] : '';

            // Ensure lazy loading is enabled
            if (!newAttr.includes('loading='))
                newAttr += ' loading="lazy"';

            // Return the wrapped image component
            return `<div class="gallery-item" x-data="{ loaded: false }" x-init="loaded = $refs.img.complete">
                <img${newAttr} x-ref="img" @load="loaded = true">
                ${altText ? `<span class="gallery-tag" x-show="loaded">${altText}</span>` : ''}
            </div>`;
        });

    // Return gallery HTML
    return `<div class="gallery-grid">${rendered}</div>`;
}, { ends: true });