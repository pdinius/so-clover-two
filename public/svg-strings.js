const svgString = (type, width, classes) => {
    let paths
    switch(type) {
        case 'corner':
            paths = `<polyline points="15 14 20 9 15 4" />
            <path d="M4 20v-7a4 4 0 014-4h12" />`
            break
        case 'rotate':
            paths = `<path d="M21 2v6h-6" />
            <path d="M21 13a9 9 0 11-3-7.7L21 8" />`
            break
    }
    return `<svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="${width}"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="${classes.join(' ')}">
        ${paths}
    </svg>`
}