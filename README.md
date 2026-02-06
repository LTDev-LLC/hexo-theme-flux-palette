# Flux Palette

A responsive, high-performance blog/journal [Hexo](https://hexo.io/) theme designed around the idea of multiple color palettes, privacy, and rich content features.

[DEMO](https://flux-palette.ltdev.llc/)

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Global Configuration](#global-configuration)
- [Writing Content](#writing-content)
  - [Front Matter Options](#front-matter-options)
  - [Password Protection](#password-protection)
  - [Rich Content Tags](#rich-content-tags)
    - [Alerts / Admonitions](#alerts)
    - [Tabs](#tabs)
    - [Accordions](#accordions)
    - [Image Gallery](#image-gallery)
    - [Media Embeds](#media-embeds)
    - [Social Buttons](#social-buttons-tag)
    - [Timeline](#timeline)
- [Projects System](#projects-system)
- [Search Configuration](#search-configuration)
- [Comments](#comments)

## Features

- **Dynamic Theming**: 15+ built-in color palettes with a "Flux" customizer that allows users to generate palettes from a single color.
- **Rich Markdown**: Custom tags for Galleries, Tabs, Accordions, Alerts and more.
- **Privacy First**: AES-256-GCM encrypted posts (password protected) with full encrypted image support.
- **Projects Portfolio**: Dedicated section for projects with weighting and external buttons.
- **Search**: Supports Local (offline), Upstash (Redis), and Supabase (Postgres) search backends.
- **Performance**: Pre-compiles Alpine.js and custom scripts using [swc](https://swc.rs/) for optimized assets.
- **Social**: Auto-generated OG/Twitter metadata, RSS feeds, and social linking.

## Installation

1. In the `root` directory:
   * Optionally, install `@swc/core` for use with pre-compilation.

```bash
$ git clone --depth=1 https://github.com/LTDev-LLC/hexo-theme-flux-palette.git themes/flux-palette ; rm -rf !$/.git
$ npm install @swc/core --save
```

OR updating:

```bash
$ cp themes/flux-palette/_config.yml theme-config.yml ; rm -rf themes/flux-palette$ git clone --depth=1 https://github.com/LTDev-LLC/hexo-theme-flux-palette.git themes/flux-palette ; rm -rf !$/.git
$ mv theme-config.yml themes/flux-palette/_config.yml
```

2. Change the `theme` property in the `config.yml` file.

```yml
theme: flux-palette
```

3. Run: `hexo clean ; hexo g ; hexo s`

## Writing Content

### Front Matter Options

Standard Hexo front matter is supported, plus Flux-specific extensions:

```yml
---
title: My Awesome Post
date: 2025-10-24
tags: [hexo, theme]
categories: [Updates]

# Flux Specifics:
password: "super-secret-password" # Encrypts the post
cover: /images/banner.jpg         # Used for OpenGraph/Twitter cards
comments: false                   # Disable comments for this specific post
read_time_minutes: 5              # Override auto-calculated read time
---
```

### Password Protection

You can password-protect any post or project using `AES-256-GCM` encryption.

1. The content and images are encrypted at build time.
2. The plaintext password is **removed** from the build output.
3. A JSON payload is generated; the client decrypts it in the browser.

```yml
---
title: Secret Diary
password: my_password_123
# OR use an environment variable (recommended for public repos)
password: env:MY_SECRET_VAR
---
```

### Rich Content Tags

Flux Palette extends Markdown with several powerful tags implemented in `scripts/markdown-enhancements.js`.

#### Alerts

Create callout boxes for Info, Warning, Danger, Success, or Tips.

```markdown
{% alert info Information %}
This is a standard info box.
{% endalert %}

{% alert warning "Watch Out" %}
You can use quotes for titles with spaces.
{% endalert %}

{% alert tip %}
If no title is provided, it defaults to the type name.
{% endalert %}

```

*Supported types:* `info`, `warning`, `danger`, `success`, `tip`.

#### Tabs

Organize content into tabbed interfaces.

```markdown
{% tabs %}
    {% tab "First Tab" %}
    This is the content of the first tab.
    {% endtab %}

    {% tab Second %}
    Content for the second tab.
    {% endtab %}
{% endtabs %}

```

#### Accordions

Collapsible content sections.

```markdown
{% accordions %}
    {% accordion "Click to expand" %}
    Hidden content revealed upon clicking.
    {% endaccordion %}

    {% accordion "Another Item" %}
    More hidden content.
    {% endaccordion %}
{% endaccordions %}

```

#### Image Gallery

Creates a responsive grid of images. If configured in `_config.yml`, it automatically generates thumbnails using an external service (like wsrv.nl) for performance.

```markdown
{% gallery %}
![Image 1](/images/photo1.jpg)
![Image 2](/images/photo2.jpg)
![Image 3 with Caption](/images/photo3.jpg "My Caption")
{% endgallery %}
```

*Options:* You can pass `thumb:false` to disable thumbnails for a specific gallery: `{% gallery thumb:false %}`.

#### Timeline

Create vertical timelines for project history, biographies, or changelogs.

```markdown
{% timeline %}
    {% timeline_item "Jan 2024" "Inception" %}
    The initial concept for the project was defined.
    {% endtimeline_item %}

    {% timeline_item "Mar 2024" "Alpha Release" %}
    The first internal release was made available to the team.

    * Completed core engine
    * Added basic UI components
    {% endtimeline_item %}
{% endtimeline %}
```

### Media Embeds

You can embed content from various platforms like YouTube, Spotify, Vimeo, Twitch, and TikTok within your posts using a powerful `embed` tag.

The plugin can automatically detect the platform from a URL.

**Generic `embed` tag:**

The generic `embed` tag is the most flexible way to embed content.

```
{% embed <url/id> [platform_hint] [type_hint] %}
```

* `<url/id>`: The full URL or the ID of the content to embed.
* `[platform_hint]`: (Optional) If you use an ID instead of a URL, you must provide a platform hint. Supported platforms: `youtube`, `spotify`, `vimeo`, `twitch`, `tiktok`.
* `[type_hint]`: (Optional) For Spotify, you can specify `track`, `playlist`, `artist`, or `episode`. For Twitch, you can specify `video` or `channel`.

**Examples:**

```yml
---
title: My Awesome Post
date: 2025-12-1
---

{# YouTube from URL #}
{% embed https://www.youtube.com/watch?v=dQw4w9WgXcQ %}

{# YouTube from ID #}
{% embed dQw4w9WgXcQ youtube %}

{# Spotify track from URL #}
{% embed https://open.spotify.com/track/3cLqK3LPVrTIzfENVmYLoU %}

{# Spotify playlist from ID #}
{% embed 1LcfcxzGNcselP4PIGeQ6V spotify playlist %}

{# Vimeo from URL #}
{% embed https://vimeo.com/59859181 %}

{# Twitch channel from URL #}
{% embed https://www.twitch.tv/theburntpeanut %}

{# Twitch video from ID #}
{% embed 123456789 twitch video %}

{# TikTok from URL #}
{% embed https://www.tiktok.com/@scout2015/video/6718335390845095173 %}
```

#### Social Buttons Tag

Display your social links anywhere in a post (uses the `social` config from `_config.yml`).

```yml
social:
  - name: GitHub
    url: https://github.com/LTDev-LLC/hexo-theme-flux-palette
    icon: mdi:github
  - name: Website
    url: https://flux-palette.ltdev.llc/
    icon: material-symbols:link
```

## Projects System

Flux Palette includes a dedicated portfolio system separate from the blog.

1. Create a folder: `source/_projects`.
2. Add Markdown files.
3. Use project-specific front matter.

**Example `source/_projects/my-app.md`:**

```yml
---
title: My Cool App
date: 2025-01-01
weight: 100            # Higher numbers appear first
project_tags: [swift, ios]
project_summary: "A short description shown on the index page."
buttons:
  - name: App Store
    url: [https://apple.com/](https://apple.com/)...
  - name: GitHub
    url: [https://github.com/](https://github.com/)...
---
Detailed project description goes here...
```

## Search Configuration

Flux supports three search providers. Configure in `_config.yml`.

### 1. Local (Default)

Generates a `search.json` file. Best for static hosting with no backend.

```yml
search:
  enabled: true
  service: "local"
```

### 2. Upstash (Redis)

High performance, serverless.

```yml
search:
  service: upstash
  upstash:
    url: "https://your-db.upstash.io"
    token: "your_write_token"      # Used during 'hexo g'
    read_token: "your_read_token"  # Exposed to client
    index: "flux"
```
### 3. Supabase (Postgres)

Uses Postgres Full Text Search.

```yml
search:
  service: supabase
  supabase:
    url: "https://your-proj.supabase.co"
    sec_key: "service_role_key"    # Used during 'hexo g'
    pub_key: "anon_public_key"     # Exposed to client
    table: "flux_search"
```
## Comments

Supports privacy-focused comment systems.

```yml
comments:
  enabled: true
  service: giscus # Options: 'giscus', 'utterances'
  giscus:
    repo: "username/repository" # [Required]
    repo_id: "R_..." # [Required]
    category: "General" # [Required]
    category_id: "DIC_..." # [Required]
    mapping: "pathname"
    reactions_enabled: "1"
    emit_metadata: "0"
    input_position: "top"
    theme: "preferred_color_scheme"
    lang: "en"
  utterances:
    repo: "username/repository" # [Required]
    issue_term: "pathname"
    label: "comments"
    theme: "github-light"
```

## Attribution

If you enjoy this theme, please keep the attribution in the footer enabled.

```yml
attribution:
  enabled: true
  text: Flux Palette by LTDev LLC
  link: https://ltdev.llc/projects/flux-palette/
```

### Root _config.yml

To enable syntax highlighting, use the following in your project root `_config.yml`.

```yml
# Syntax highlighting
syntax_highlighter: highlight.js
highlight:
  enable: true # set to false to turn off syntax highlighting
  line_number: true
  auto_detect: false
  tab_replace: ''
  wrap: true
  hljs: false # required to be false for Flux Palette styles
```