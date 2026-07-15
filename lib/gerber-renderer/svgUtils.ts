import generateOuterSvg from "./generateOuter";

export interface SvgStack {
    id: string | null;
    svg: SVGElement | null;
}

export interface StackConfig {
    width: number;
    height: number;
    viewbox: {
        viewboxX: number;
        viewboxY: number;
        viewboxW: number;
        viewboxH: number;
    };
}

export const updateToolWidth = (
    svgs: { stack: SvgStack; name: string }[],
    width: string,
    stackConfig: StackConfig,
    correction = 0
) => {
    const toolwidth = parseFloat(width);
    let dimension = null;

    svgs.forEach(({ stack, name }) => {
        if (!stack.svg) return;
        const outer = stack.svg.querySelector(`#${name}outer`);
        const main = stack.svg.querySelector(`#${name}MainG`);

        if (!outer || !main) return;

        const newOuter = generateOuterSvg(
            stackConfig.width,
            stackConfig.height,
            toolwidth,
            { viewboxX: stackConfig.viewbox.viewboxX, viewboxY: stackConfig.viewbox.viewboxY },
            name === 'bottomlayer'
        );
        newOuter.svg.setAttribute('id', `${name}outer-svg`);
        stack.svg.setAttribute('width', `${newOuter.width}mm`);
        stack.svg.setAttribute('height', `${newOuter.height}mm`);

        const existingSvg = outer.querySelector('svg');
        if (existingSvg) {
            existingSvg.replaceWith(newOuter.svg);
        }
        
        const offset = toolwidth === 0 ? 0 : correction;
        main.setAttribute('transform', `translate(${offset} ${offset})`);

        dimension = { width: newOuter.width, height: newOuter.height };
    });

    return dimension;
};

export const updateSvg = (
    svg: SVGElement,
    option: string,
    setup: { layerid: string; stack: SvgStack },
    machine = 'general',
    topstack: SvgStack,
    doubleSide: boolean
) => {
    const gerberSvgs = svg.querySelectorAll('svg');
    if (gerberSvgs.length < 2) return;
    const gerberSvg = Array.from(gerberSvgs).find(el => el.getAttribute('id')?.endsWith('svg')) || gerberSvgs[1];

    gerberSvg.querySelectorAll('g').forEach(g => {
        if (g.hasAttribute('id')) {
            const id = g.getAttribute('id') || '';
            g.style.display = id.includes(setup.layerid)
                ? 'block'
                : setup.stack.id && id.includes(setup.stack.id)
                ? 'none'
                : id.includes('drillMask')
                ? 'none'
                : '';

            if (option.includes('outline') && machine === 'carvera') {
                g.style.display = id.includes('drill')
                    ? doubleSide && option === 'bottom-outline'
                        ? 'none'
                        : 'block'
                    : g.style.display;
            }
        }
    });

    const clipPath = gerberSvg.querySelector('clipPath');
    if (clipPath && clipPath instanceof SVGElement) {
        clipPath.style.display = setup.layerid === 'outline'
            ? option === 'top-outline' && doubleSide
                ? 'none'
                : 'block'
            : 'none';
    }

    const outerSide = setup.stack === topstack ? 'toplayer' : 'bottomlayer';
    const outerG = svg.querySelector(`#${outerSide}outer`);
    if (outerG && outerG instanceof SVGElement) {
        outerG.style.display = option === 'top-outline'
            ? doubleSide
                ? 'block'
                : 'none'
            : 'none';
    }
};
