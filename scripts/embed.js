'use strict';
// Detect platform from URL
function detectPlatformFromUrl(url) {
    if (/(?:youtube\.com|youtu\.be)/.test(url))
        return 'youtube';
    if (/spotify\.com/.test(url))
        return 'spotify';
    if (/vimeo\.com/.test(url))
        return 'vimeo';
    if (/twitch\.tv/.test(url))
        return 'twitch';
    if (/tiktok\.com/.test(url))
        return 'tiktok';
    if (/gist\.github\.com/.test(url))
        return 'gist';
    if (/jsfiddle\.net/.test(url))
        return 'jsfiddle';
    if (/codesandbox\.io/.test(url))
        return 'codesandbox';
    return null;
}

// Extract YouTube video ID
function extractYouTubeId(input) {
    if (!input)
        return null;
    const str = String(input).trim();

    // Regular expression patterns
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = str.match(pattern);
        if (match)
            return match[1];
    }

    return null;
}

// Generate YouTube embed
function generateYouTubeEmbed(input) {
    const videoId = extractYouTubeId(input);
    if (!videoId)
        return '';

    // Return the embed
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return [
        '<div class="video-embed-container">',
        '  <iframe',
        '    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"',
        '    src="' + embedUrl + '"',
        '    frameborder="0"',
        '    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"',
        '    allowfullscreen',
        '    loading="lazy"',
        '  ></iframe>',
        '</div>'
    ].join('\n');
}

// Spotify track, playlist, and artist types
const SPOTIFY_TYPES = new Set(['track', 'playlist', 'artist', 'episode']);

// Extract Spotify track, playlist, and artist IDs
function extractSpotifyRef(input, forcedType) {
    if (!input)
        return null;
    const str = String(input).trim(),
        typeHint = forcedType && SPOTIFY_TYPES.has(forcedType) ? forcedType : null;

    // Regular expression patterns
    const patterns = [
        { regex: /^spotify:(track|playlist|artist|episode):([a-zA-Z0-9]+)$/, typeIndex: 1, idIndex: 2 },
        { regex: /open\.spotify\.com\/(track|playlist|artist|episode)\/([a-zA-Z0-9]+)/, typeIndex: 1, idIndex: 2 },
        { regex: /open\.spotify\.com\/embed\/(track|playlist|artist|episode)\/([a-zA-Z0-9]+)/, typeIndex: 1, idIndex: 2 }
    ];

    // Check each pattern
    for (const pattern of patterns) {
        const match = str.match(pattern.regex);
        if (match)
            return { type: match[pattern.typeIndex], id: match[pattern.idIndex] };
    }

    // Check for short IDs
    if (/^[a-zA-Z0-9]{22}$/.test(str))
        return { type: typeHint || 'track', id: str };

    return null;
}

// Generate Spotify embed
function generateSpotifyEmbed(input, forcedType) {
    const ref = extractSpotifyRef(input, forcedType);
    if (!ref)
        return '';

    // Extract type and ID
    const { type, id } = ref,
        embedUrl = `https://open.spotify.com/embed/${type}/${id}`,
        height = type === 'track' ? 80 : 352;

    // Return the embed
    return [
        '<div class="spotify-embed-inline">',
        '  <iframe',
        '    src="' + embedUrl + '"',
        '    width="100%"',
        '    height="' + height + '"',
        '    frameborder="0"',
        '    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"',
        '    loading="lazy"',
        '  ></iframe>',
        '</div>'
    ].join('\n');
}

// Extract Vimeo video ID
function extractVimeoId(input) {
    if (!input)
        return null;
    const str = String(input).trim(),
        match = str.match(/vimeo\.com\/(\d+)/);
    if (match)
        return match[1];
    if (/^(\d+)$/.test(str))
        return str;
    return null;
}

// Generate Vimeo embed
function generateVimeoEmbed(input) {
    const videoId = extractVimeoId(input);
    if (!videoId)
        return '';

    // Return the embed
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    return [
        '<div class="video-embed-container">',
        '  <iframe',
        '    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"',
        '    src="' + embedUrl + '"',
        '    frameborder="0"',
        '    allow="autoplay; fullscreen; picture-in-picture"',
        '    allowfullscreen',
        '    loading="lazy"',
        '  ></iframe>',
        '</div>'
    ].join('\n');
}

// Twitch video and channel types
const TWITCH_TYPES = new Set(['video', 'channel']);

// Extract Twitch video or channel reference
function extractTwitchRef(input, forcedType) {
    if (!input)
        return null;
    const str = String(input).trim(),
        typeHint = forcedType && TWITCH_TYPES.has(forcedType) ? forcedType : null;

    // Video URL
    let match = str.match(/twitch\.tv\/videos\/(\d+)/);
    if (match)
        return { type: 'video', id: match[1] };

    // Channel URL
    match = str.match(/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/);
    if (match) {
        const id = match[1];
        if (id.toLowerCase() !== 'videos')
            return { type: 'channel', id: id };
    }

    if (typeHint) {
        if (typeHint === 'video' && /^\d+$/.test(str))
            return { type: 'video', id: str };
        if (typeHint === 'channel' && /^[a-zA-Z0-9_]+$/.test(str))
            return { type: 'channel', id: str };
    }

    // Guess type for naked IDs
    if (/^\d+$/.test(str))
        return { type: 'video', id: str };
    if (/^[a-zA-Z0-9_]+$/.test(str))
        return { type: 'channel', id: str };

    return null;
}

// Generate Twitch embed
function generateTwitchEmbed(input, forcedType) {
    const ref = extractTwitchRef(input, forcedType);
    if (!ref)
        return '';

    // Extract type and ID
    const { type, id } = ref,
        url = new URL(hexo.config.url),
        parent = url.hostname;

    // Build embed URL
    let embedUrl;
    if (type === 'video') {
        embedUrl = `https://player.twitch.tv/?video=${id}&parent=${parent}`;
    } else { // channel
        embedUrl = `https://player.twitch.tv/?channel=${id}&parent=${parent}`;
    }

    // Return the embed
    return [
        '<div class="video-embed-container">',
        '  <iframe',
        '    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"',
        '    src="' + embedUrl + '"',
        '    frameborder="0"',
        '    allow="autoplay; fullscreen"',
        '    allowfullscreen',
        '    loading="lazy"',
        '  ></iframe>',
        '</div>'
    ].join('\n');
}

// Extract TikTok video info
function extractTikTokInfo(input) {
    if (!input) return null;
    const str = String(input).trim();
    let match;

    match = str.match(/(https?:\/\/(?:www\.)?tiktok\.com\/@.+?\/video\/(\d+))/);
    if (match)
        return { url: match[1], id: match[2] };

    if (/^\d+$/.test(str))
        return { url: null, id: str };

    return null;
}

// Generate TikTok embed
function generateTikTokEmbed(input) {
    const info = extractTikTokInfo(input);
    if (!info)
        return '';

    // Return the embed
    const citeAttr = info.url ? `cite="${info.url}"` : '';
    return [
        `<blockquote class="tiktok-embed" ${citeAttr} data-video-id="${info.id}" style="max-width: 605px;min-width: 325px;" >`,
        `<section></section>`,
        `</blockquote>`,
        `<script async src="https://www.tiktok.com/embed.js"></script>`
    ].join('');
}

// Extract GitHub Gist reference
function extractGistRef(input) {
    if (!input)
        return null;
    const str = String(input).trim();

    // Full URL
    try {
        const url = new URL(str);
        if (url.hostname === 'gist.github.com') {
            const parts = url.pathname.split('/').filter(Boolean);
            if (parts.length >= 1) {
                const id = parts[parts.length - 1];
                if (/^[a-f0-9]+$/i.test(id)) {
                    const user = parts.length >= 2 ? parts[0] : null,
                        file = url.searchParams.get('file');
                    return { user, id, file };
                }
            }
        }
    } catch {
        // Ignore URL parse errors; we still support shorthand formats below.
    }

    // user/id shorthand
    let match = str.match(/^([a-zA-Z0-9-]+)\/([a-f0-9]+)$/i);
    if (match)
        return { user: match[1], id: match[2], file: null };

    // id shorthand
    if (/^[a-f0-9]+$/i.test(str))
        return { user: null, id: str, file: null };

    return null;
}

// Generate GitHub Gist embed
function generateGistEmbed(input) {
    const ref = extractGistRef(input);
    if (!ref)
        return '';

    const base = ref.user
            ? `https://gist.github.com/${ref.user}/${ref.id}.js`
            : `https://gist.github.com/${ref.id}.js`,
        scriptUrl = ref.file ? `${base}?file=${encodeURIComponent(ref.file)}` : base;

    return [
        '<div class="gist-embed-inline">',
        '  <script src="' + scriptUrl + '"></script>',
        '</div>'
    ].join('\n');
}

// Extract JSFiddle reference
function extractJsFiddleRef(input) {
    if (!input)
        return null;
    const str = String(input).trim();

    // Full URL
    try {
        const url = new URL(str);
        if (url.hostname === 'jsfiddle.net' || url.hostname.endsWith('.jsfiddle.net')) {
            const parts = url.pathname.split('/').filter(Boolean);
            if (!parts.length)
                return null;

            const embeddedIndex = parts.indexOf('embedded'),
                trimmed = embeddedIndex === -1 ? parts : parts.slice(0, embeddedIndex);
            if (!trimmed.length)
                return null;

            if (trimmed.length === 1)
                return { user: null, id: trimmed[0], revision: null };

            const user = trimmed[0],
                id = trimmed[1],
                revision = trimmed.length > 2 && /^\d+$/.test(trimmed[2]) ? trimmed[2] : null;

            return { user, id, revision };
        }
    } catch {
        // Ignore URL parse errors; we still support shorthand formats below.
    }

    // user/id shorthand, with optional revision
    let match = str.match(/^([a-zA-Z0-9-_]+)\/([a-zA-Z0-9]+)(?:\/(\d+))?$/);
    if (match)
        return { user: match[1], id: match[2], revision: match[3] || null };

    // id shorthand
    if (/^[a-zA-Z0-9]+$/.test(str))
        return { user: null, id: str, revision: null };

    return null;
}

// Generate JSFiddle embed
function generateJsFiddleEmbed(input) {
    const ref = extractJsFiddleRef(input);
    if (!ref)
        return '';

    let embedUrl = ref.user
        ? `https://jsfiddle.net/${ref.user}/${ref.id}`
        : `https://jsfiddle.net/${ref.id}`;
    if (ref.revision)
        embedUrl += `/${ref.revision}`;
    embedUrl += '/embedded/';

    return [
        '<div class="video-embed-container" style="padding-top: 62.5%;">',
        '  <iframe',
        '    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"',
        '    src="' + embedUrl + '"',
        '    frameborder="0"',
        '    allowfullscreen',
        '    loading="lazy"',
        '  ></iframe>',
        '</div>'
    ].join('\n');
}

// Extract CodeSandbox reference
function extractCodeSandboxRef(input) {
    if (!input)
        return null;
    const str = String(input).trim();

    // Full URL
    try {
        const url = new URL(str);
        if (url.hostname === 'codesandbox.io' || url.hostname.endsWith('.codesandbox.io')) {
            const parts = url.pathname.split('/').filter(Boolean),
                search = url.search || '';
            if (!parts.length)
                return null;

            // Already an embed URL
            if (parts[0] === 'embed' && parts[1])
                return { mode: 'embed', slug: parts[1], search: search };

            // Legacy short links: /s/<slug>
            if (parts[0] === 's' && parts[1])
                return { mode: 'short', slug: parts[1], search: search };

            // New project links: /p/<kind>/<slug>
            if (parts[0] === 'p' && parts[1] && parts[2])
                return { mode: 'project', kind: parts[1], slug: parts[2], search: search };
        }
    } catch {
        // Ignore URL parse errors; we still support shorthand formats below.
    }

    // /p/<kind>/<slug> shorthand
    let match = str.match(/^p\/([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_]+)$/);
    if (match)
        return { mode: 'project', kind: match[1], slug: match[2], search: '' };

    // /s/<slug> shorthand
    match = str.match(/^s\/([a-zA-Z0-9-_]+)$/);
    if (match)
        return { mode: 'short', slug: match[1], search: '' };

    // Raw slug shorthand
    if (/^[a-zA-Z0-9-_]+$/.test(str))
        return { mode: 'short', slug: str, search: '' };

    return null;
}

// Generate CodeSandbox embed
function generateCodeSandboxEmbed(input) {
    const ref = extractCodeSandboxRef(input);
    if (!ref)
        return '';

    const params = new URLSearchParams(ref.search);
    params.set('view', 'editor + preview');

    let embedUrl;
    if (ref.mode === 'project') {
        if (!params.has('embed'))
            params.set('embed', '1');
        const query = params.toString();
        embedUrl = `https://codesandbox.io/p/${ref.kind}/${ref.slug}${query ? '?' + query : ''}`;
    } else {
        const query = params.toString();
        embedUrl = `https://codesandbox.io/embed/${ref.slug}${query ? '?' + query : ''}`;
    }

    return [
        '<div class="video-embed-container" style="padding-top: 62.5%;">',
        '  <iframe',
        '    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"',
        '    src="' + embedUrl + '"',
        '    frameborder="0"',
        '    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"',
        '    allowfullscreen',
        '    loading="lazy"',
        '  ></iframe>',
        '</div>'
    ].join('\n');
}


// Generic 'embed' tag
//      {% embed <url/id> [hint] %}
//      {% embed <url/id> youtube %}
//      {% embed <url/id> vimeo %}
//      {% embed <url/id> spotify [track/playlist/artist/episode] %}
//      {% embed <url/id> gist %}
//      {% embed <url/id> jsfiddle %}
//      {% embed <url/id> codesandbox %}
hexo.extend.tag.register('embed', function (args) {
    if (!args || !args.length)
        return '';

    // Parse arguments
    const input = args[0],
        hint = (args.length > 1) ? args[1].toLowerCase() : null,
        platform = detectPlatformFromUrl(input) || hint;

    // Switch on platform
    switch (platform) {
        case 'youtube':
            return generateYouTubeEmbed(input);
        case 'spotify':
            // For {% embed <id> spotify track %}
            const forcedSpotifyType = (args.length > 2 && SPOTIFY_TYPES.has(args[2].toLowerCase())) ? args[2].toLowerCase() : null;
            return generateSpotifyEmbed(input, forcedSpotifyType);
        case 'vimeo':
            return generateVimeoEmbed(input);
        case 'twitch':
            const forcedTwitchType = (args.length > 2 && TWITCH_TYPES.has(args[2].toLowerCase())) ? args[2].toLowerCase() : null;
            return generateTwitchEmbed(input, forcedTwitchType);
        case 'tiktok':
            return generateTikTokEmbed(input);
        case 'gist':
            return generateGistEmbed(input);
        case 'jsfiddle':
            return generateJsFiddleEmbed(input);
        case 'codesandbox':
            return generateCodeSandboxEmbed(input);
        default:
            return '';
    }
}, { ends: false });

// A list of embed tags to support
const embedTags = {
    youtube: (args) => generateYouTubeEmbed(args.join(' ')),
    spotify: (args) => {
        const forcedType = (args.length == 2 && SPOTIFY_TYPES.has(args[1].toLowerCase())) ? args[1].toLowerCase() : null;
        return generateSpotifyEmbed(args[0], forcedType);
    },
    vimeo: (args) => generateVimeoEmbed(args.join(' ')),
    twitch: (args) => {
        const forcedType = (args.length == 2 && TWITCH_TYPES.has(args[1].toLowerCase())) ? args[1].toLowerCase() : null;
        return generateTwitchEmbed(args[0], forcedType);
    },
    tiktok: (args) => generateTikTokEmbed(args.join(' ')),
    gist: (args) => generateGistEmbed(args.join(' ')),
    jsfiddle: (args) => generateJsFiddleEmbed(args.join(' ')),
    codesandbox: (args) => generateCodeSandboxEmbed(args.join(' ')),
};

// Loop the embed tags and register them
for (const tag of Object.keys(embedTags))
    hexo.extend.tag.register(tag, (args) => embedTags[tag](args), { ends: false });
