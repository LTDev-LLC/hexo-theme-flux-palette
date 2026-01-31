// View Transitions API SPA-style navigation with Alpine support.
(function () {
    // Bail out when the browser doesn't support view transitions
    if (!('startViewTransition' in document))
        return;

    // Decide if a link click should be handled by the transition
    function shouldHandleLink(link, event) {
        // Basic validation & Accessibility/UX checks
        if (!link?.href || event.defaultPrevented)
            return false;

        // Ignore modified clicks (Ctrl, Command, Shift, Alt) to allow 'open in new tab'
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return false;

        // Ignore external targets or download attributes
        if (link.target && link.target !== '_self')
            return false;
        if (link.hasAttribute('download'))
            return false;

        // Manual opt-out via data attribute
        if (link.hasAttribute('data-no-view-transition'))
            return false;

        try {
            const url = new URL(link.href),
                now = window.location;

            // Check Origin (Protocol + Domain + Port)
            if (url.origin !== now.origin)
                return false;

            // Only handle standard web protocols
            if (!['http:', 'https:'].includes(url.protocol))
                return false;

            // Ignore same-page anchor links (e.g., #section-id)
            const isSamePage = url.pathname === now.pathname && url.search === now.search;
            if (url.hash && isSamePage)

                return false;
            return true;
        } catch {
            // Handle invalid URLs gracefully
            return false;
        }
    }

    // Recreate scripts so they execute after swapping the body
    function reexecuteBodyScripts(root) {
        const scripts = root.querySelectorAll('script'),
            loaders = [];

        // Loop through the scripts and recreate them
        scripts.forEach(oldScript => {
            const type = (oldScript.getAttribute('type') || '').toLowerCase();
            if (type === 'application/ld+json')
                return;

            // Create a new script element.
            const newScript = document.createElement('script');
            Array.prototype.forEach.call(oldScript.attributes, attr => {
                newScript.setAttribute(attr.name, attr.value)
            });

            // Copy the content from the old script to the new one
            if (oldScript.src)
                loaders.push(new Promise(function (resolve, reject) {
                    newScript.onload = resolve;
                    newScript.onerror = reject;
                }));
            else
                newScript.text = oldScript.text;

            // Replace the old script with the new one
            oldScript.replaceWith(newScript);
        });

        // Wait for all loaders to resolve
        return Promise.all(loaders);
    }

    // Fetch the next page, swap the body, and re-init Alpine.
    async function swapPage(url, push) {
        // Fetch the new page
        let response = await fetch(url, {
            headers: {
                'X-Requested-With': 'flux-palette/view-transitions'
            }
        });

        // Bail out if the request failed
        if (!response.ok)
            throw new Error('Failed to fetch page');

        // Parse the HTML
        let doc = new DOMParser().parseFromString(await response.text(), 'text/html');

        // Bail out if the HTML is invalid
        if (!doc || !doc.body)
            throw new Error('Invalid HTML');

        // Stop Alpine from observing mutations on the old page
        let alpine = window.Alpine;
        if (alpine && typeof alpine.stopObservingMutations === 'function')
            alpine.stopObservingMutations();

        // Swap the title and body
        document.title = doc.title || document.title;
        document.body.replaceWith(doc.body);
        await reexecuteBodyScripts(document.body);

        // Re-init Alpine
        if (alpine && typeof alpine.initTree === 'function') {
            document.dispatchEvent(new CustomEvent('alpine:init'));
            alpine.initTree(document.body);
        }

        // Start Alpine observing mutations
        if (alpine && typeof alpine.startObservingMutations === 'function')
            alpine.startObservingMutations();

        // Swap the URL and scroll
        if (push)
            history.pushState(null, '', url);
        window.scrollTo(0, 0);
    }

    // Wrap navigation in a view transition
    function navigate(url, push) {
        return document.startViewTransition(() => swapPage(url, push));
    }

    // Intercept eligible clicks
    document.addEventListener('click', function (event) {
        var link = event.target.closest('a');
        if (!shouldHandleLink(link, event))
            return;
        event.preventDefault();
        navigate(link.href, true);
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', () => navigate(window.location.href, false));
})();
