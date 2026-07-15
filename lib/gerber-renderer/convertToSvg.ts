import generateOuterSvg from "./generateOuter";

export interface ConvertResult {
    topSvg: SVGElement;
    bottomSvg: SVGElement;
    fullStackSvg: SVGElement;
    stackConfig: {
        viewbox: {
            viewboxX: number;
            viewboxY: number;
            viewboxW: number;
            viewboxH: number;
        };
        width: number;
        height: number;
    };
    id: string;
}

export default async function convertToSvg(files: File[]): Promise<ConvertResult> {
    const stackup = await stackupFromFiles(files);
    const parser = new DOMParser();

    const topxmlDoc = parser.parseFromString(stackup.top.svg, 'image/svg+xml');
    const topsvg = topxmlDoc.documentElement as unknown as SVGElement;
    const bottomxmlDoc = parser.parseFromString(stackup.bottom.svg, 'image/svg+xml');
    const bottomsvg = bottomxmlDoc.documentElement as unknown as SVGElement;

    const newTopSvg = modifiedSvg({
        svg: topsvg,
        id: 'toplayer',
        viewbox: stackup.top.viewBox,
        width: stackup.top.width,
        height: stackup.top.height,
    });
    
    const newBottomSvg = modifiedSvg({
        svg: bottomsvg,
        id: 'bottomlayer',
        viewbox: stackup.bottom.viewBox,
        width: stackup.bottom.width,
        height: stackup.bottom.height,
    });

    const fullStackSvg = buildFullStackSvg({
        topSvg: parser.parseFromString(stackup.top.svg, 'image/svg+xml').documentElement as unknown as SVGElement,
        bottomSvg: parser.parseFromString(stackup.bottom.svg, 'image/svg+xml').documentElement as unknown as SVGElement,
    });
    
    const newFullStackSvg = modifiedSvg({
        svg: fullStackSvg,
        id: 'fullstack',
        viewbox: stackup.top.viewBox,
        width: stackup.top.width,
        height: stackup.top.height,
    });

    return {
        topSvg: newTopSvg,
        bottomSvg: newBottomSvg,
        fullStackSvg: newFullStackSvg,
        stackConfig: {
            viewbox: {
                viewboxX: stackup.top.viewBox[0],
                viewboxY: stackup.top.viewBox[1],
                viewboxW: stackup.top.viewBox[2],
                viewboxH: stackup.top.viewBox[3],
            },
            width: Math.round(stackup.top.width * 100) / 100,
            height: Math.round(stackup.top.height * 100) / 100,
        },
        id: stackup.id,
    };
}

async function stackupFromFiles(filesList: File[]): Promise<any> {
    const layers = await Promise.all(
        filesList.map(file => {
            const reader = new FileReader();
            return new Promise<{ filename: string; gerber: string }>((resolve, reject) => {
                reader.onload = ({ target }) => {
                    resolve({ filename: file.name, gerber: (target?.result as string) || "" });
                };
                reader.onerror = error => reject(error);
                reader.readAsText(file);
            });
        })
    );

    const win = window as any;
    if (!win.pcbStackup) {
        throw new Error("pcb-stackup library not loaded. Please ensure script is loaded.");
    }

    return new Promise((resolve, reject) => {
        try {
            win.pcbStackup(layers, { maskWithOutline: false, outlineGapFill: 0.011 }, (err: any, stackup: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stackup);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

function buildFullStackSvg({ topSvg, bottomSvg }: { topSvg: SVGElement; bottomSvg: SVGElement }): SVGElement {
    const namespacedTopSvg = namespaceSvgTree(topSvg.cloneNode(true) as SVGElement, 'full-top');
    const namespacedBottomSvg = namespaceSvgTree(bottomSvg.cloneNode(true) as SVGElement, 'full-bottom');
    const fullLayerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    copyAttributes(namespacedTopSvg, fullLayerSvg);

    const fullLayerDef = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const fullLayerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    appendDefs(fullLayerDef, getDirectChildByTagName(namespacedTopSvg, 'defs'));
    appendDefs(fullLayerDef, getDirectChildByTagName(namespacedBottomSvg, 'defs'));

    const topRootGroup = buildLayerGroup(
        getDirectChildByTagName(namespacedTopSvg, 'g'),
        (id) => !id.includes('bottom_')
    );
    const bottomRootGroup = buildLayerGroup(
        getDirectChildByTagName(namespacedBottomSvg, 'g'),
        (id) => id.includes('bottom_')
    );

    if (topRootGroup) {
        topRootGroup.classList.add('fullstack-top-layer');
        fullLayerG.appendChild(topRootGroup);
    }
    if (bottomRootGroup) {
        normalizeBottomOverlay(bottomRootGroup);
        bottomRootGroup.classList.add('fullstack-bottom-layer');
        fullLayerG.appendChild(bottomRootGroup);
    }

    appendFullLayerStyles(fullLayerDef);

    fullLayerSvg.appendChild(fullLayerDef);
    fullLayerSvg.appendChild(fullLayerG);

    return fullLayerSvg;
}

function copyAttributes(source: SVGElement, target: SVGElement) {
    Array.from(source.attributes).forEach(({ name, value }) => {
        target.setAttribute(name, value);
    });
}

function getDirectChildByTagName(node: SVGElement, tagName: string): SVGElement | null {
    return (Array.from(node.children).find((child) => child.tagName.toLowerCase() === tagName) as SVGElement) || null;
}

function appendDefs(targetDefs: SVGElement, sourceDefs: SVGElement | null) {
    if (!sourceDefs) return;

    Array.from(sourceDefs.children).forEach((child) => {
        targetDefs.appendChild(child.cloneNode(true));
    });
}

function buildLayerGroup(rootGroup: SVGElement | null, shouldKeep: (id: string) => boolean): SVGElement | null {
    if (!rootGroup) return null;

    const clonedRoot = rootGroup.cloneNode(true) as SVGElement;
    clonedRoot.querySelectorAll('g[id]').forEach((child) => {
        const childId = child.getAttribute('id') || '';
        if (!shouldKeep(childId)) {
            child.remove();
        }
    });

    return clonedRoot;
}

function normalizeBottomOverlay(rootGroup: SVGElement) {
    rootGroup.querySelectorAll('[transform]').forEach((element) => {
        const transform = element.getAttribute('transform') || '';

        if (transform.includes('scale(-1,1)') || transform.includes('scale(-1 1)')) {
            element.removeAttribute('transform');
        }
    });
}

function namespaceSvgTree(svg: SVGElement, prefix: string): SVGElement {
    const idMap = new Map<string, string>();
    const classMap = new Map<string, string>();

    svg.querySelectorAll('[id]').forEach((element) => {
        const previousId = element.getAttribute('id');
        if (previousId) {
            const nextId = `${prefix}-${previousId}`;
            idMap.set(previousId, nextId);
            element.setAttribute('id', nextId);
        }
    });

    svg.querySelectorAll('[class]').forEach((element) => {
        const prevAttr = element.getAttribute('class');
        if (prevAttr) {
            const previousClasses = prevAttr.split(/\s+/).filter(Boolean);
            const nextClasses = previousClasses.map((className) => {
                if (!classMap.has(className)) {
                    classMap.set(className, `${prefix}-${className}`);
                }
                return classMap.get(className)!;
            });
            element.setAttribute('class', nextClasses.join(' '));
        }
    });

    svg.querySelectorAll('style').forEach((styleElement) => {
        let nextStyle = styleElement.textContent || '';
        Array.from(classMap.entries())
            .sort((a, b) => b[0].length - a[0].length)
            .forEach(([previousClass, nextClass]) => {
                nextStyle = nextStyle.replaceAll(`.${previousClass}`, `.${nextClass}`);
            });
        styleElement.textContent = nextStyle;
    });

    svg.querySelectorAll('*').forEach((element) => {
        Array.from(element.attributes).forEach(({ name, value }) => {
            let nextValue = value;

            idMap.forEach((nextId, previousId) => {
                nextValue = nextValue.replaceAll(`url(#${previousId})`, `url(#${nextId})`);
                if ((name === 'href' || name === 'xlink:href') && nextValue === `#${previousId}`) {
                    nextValue = `#${nextId}`;
                }
            });

            if (nextValue !== value) {
                element.setAttribute(name, nextValue);
            }
        });
    });

    return svg;
}

function appendFullLayerStyles(defs: SVGElement) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
        .fullstack-top-layer [class*="_fr4"],
        .fullstack-bottom-layer [class*="_fr4"] { display: none !important; }

        .fullstack-top-layer [class*="_cu"] {
            color: #d3346e !important;
            opacity: 0.48 !important;
        }

        .fullstack-bottom-layer [class*="_cu"] {
            color: #0f9f73 !important;
            opacity: 0.48 !important;
        }

        .fullstack-top-layer [class*="_cf"] {
            color: #f59e0b !important;
            opacity: 0.38 !important;
        }

        .fullstack-bottom-layer [class*="_cf"] {
            color: #22c55e !important;
            opacity: 0.38 !important;
        }

        .fullstack-top-layer [class*="_sm"] {
            color: #f472b6 !important;
            opacity: 0.2 !important;
        }

        .fullstack-bottom-layer [class*="_sm"] {
            color: #38bdf8 !important;
            opacity: 0.2 !important;
        }

        .fullstack-top-layer [class*="_ss"] {
            color: #f8fafc !important;
            opacity: 0.88 !important;
        }

        .fullstack-bottom-layer [class*="_ss"] {
            color: #93c5fd !important;
            opacity: 0.88 !important;
        }

        .fullstack-top-layer [class*="_sp"] {
            color: #f9a8d4 !important;
            opacity: 0.55 !important;
        }

        .fullstack-bottom-layer [class*="_sp"] {
            color: #86efac !important;
            opacity: 0.55 !important;
        }

        .fullstack-top-layer [class*="_out"],
        .fullstack-bottom-layer [class*="_out"] {
            color: #ffffff !important;
            opacity: 0.7 !important;
        }
    `;
    defs.appendChild(style);
}

interface ModifiedSvgProps {
    svg: SVGElement;
    id: string;
    viewbox: number[];
    width: number;
    height: number;
}

function modifiedSvg(props: ModifiedSvgProps): SVGElement {
    const { svg, id, viewbox, width, height } = props;
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const mainG = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    if (id !== 'fullstack') {
        const Gs = svg.querySelectorAll('g');
        Gs.forEach((g) => {
            if (g.hasAttribute('id')) {
                const gid = g.getAttribute('id');
                if (gid && gid.includes('soldermask')) {
                    g.style.display = g.style.display === 'none' ? 'block' : 'none';
                }
            }
        });
    }

    svg.style.setProperty('shape-rendering', 'crispEdges');

    const clipPath = svg.querySelector('clipPath');
    if (clipPath) {
        const pathEl = clipPath.querySelector('path');
        if (pathEl) {
            const d = pathEl.getAttribute('d') || '';

            const outlineG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('shape-rendering', 'crispEdges');
            path.setAttribute('stroke', '#ffffff');
            path.setAttribute('stroke-width', '1rem');
            outlineG.setAttribute('id', 'drillMask');

            const cx = viewbox[0] + viewbox[2] / 2;
            const cy = viewbox[1] + viewbox[3] / 2;
            const scale = id === 'bottomlayer' ? '-1 -1' : '1 -1';

            const flipY = `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`;
            outlineG.setAttribute('transform', flipY);

            outlineG.appendChild(path);

            svg.insertBefore(outlineG, svg.firstChild);
        }
    }

    const outer = generateOuterSvg(width, height, 0.0, { viewboxX: viewbox[0], viewboxY: viewbox[1] }, id === 'bottomlayer');

    outer.svg.setAttribute('id', `${id}outer-svg`);
    outerG.setAttribute('id', `${id}outer`);
    outerG.setAttribute('style', `display: none; fill: ${id === 'fullstack' ? '#3c94d930' : '#1a4c1a'}`);

    newSvg.setAttribute('id', `${id}`);
    newSvg.setAttribute('width', `${outer.width}mm`);
    newSvg.setAttribute('height', `${outer.height}mm`);

    svg.setAttribute('id', `${id}svg`);
    mainG.setAttribute('id', `${id}MainG`);
    mainG.setAttribute('transform', 'translate(0, 0)');

    outerG.appendChild(outer.svg);
    mainG.appendChild(svg);
    newSvg.appendChild(outerG);
    newSvg.appendChild(mainG);

    return newSvg;
}
