document.addEventListener('alpine:init', () => {
    Alpine.data('sidebarSection', (id) => {
        const key = `flux-sidebar-${id}`,
            stored = sessionStorage.getItem(key),
            initialOpen = stored === null ? true : (stored === 'true');
        return {
            id: id,
            open: initialOpen,
            init() {
                // XXX: Improve implementation of auto-closing sidebar
                // if (stored === null) {
                //     const onScroll = () => {
                //         if (document.body.scrollTop > 30) {
                //             this.open = false;
                //             document.body.removeEventListener('scroll', onScroll);
                //         }
                //     };
                //     document.body.addEventListener('scroll', onScroll, { passive: true });
                // }
                this.$watch('open', val => sessionStorage.setItem(key, val));
            },
            toggle() {
                this.open = !this.open;
            }
        };
    });
});