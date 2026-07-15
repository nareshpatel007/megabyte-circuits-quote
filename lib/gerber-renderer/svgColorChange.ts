interface ColorChangeProps {
    id: string;
    color: string;
    soldermask?: boolean;
    svgs: SVGElement[];
}

export default function handleColorChange(props: ColorChangeProps) {
    // Basic pre-defined styles
    const stylesMap: Record<string, string> = {
        'bw': `
            .${props.id}_fr4 {color: #000000 !important;}
            .${props.id}_cu {color: #ffffff !important;}
            .${props.id}_cf {color: #ffffff !important;}
            .${props.id}_sm {color: #ffffff; opacity: ${props.soldermask ? 0.5 : 0} !important;}
            .${props.id}_ss {color: #ffffff !important;}
            .${props.id}_sp {color: #ffffff !important;}
            .${props.id}_out {color: #ffffff !important;}
        `,
        'bwInvert': `
            .${props.id}_fr4 {color: #ffffff !important;}
            .${props.id}_cu {color: #000000 !important;}
            .${props.id}_cf {color: #000000 !important;}
            .${props.id}_sm {color: #000000; opacity: ${props.soldermask ? 0.5 : 0} !important;}
            .${props.id}_ss {color: #000000 !important;}
            .${props.id}_sp {color: #000000 !important;}
            .${props.id}_out {color: #000000 !important;}
        `,
        'original': `
            .${props.id}_fr4 {color: #666666 !important;}
            .${props.id}_cu {color: #cccccc !important;}
            .${props.id}_cf {color: #cc9933 !important;}
            .${props.id}_sm {color: #004200 !important; opacity: 0.75 !important;}
            .${props.id}_ss {color: #ffffff !important;}
            .${props.id}_sp {color: #999999 !important;}
            .${props.id}_out {color: #ffffff !important;}
        `,
        'green': `
            .${props.id}_fr4 {color: #1a4c1a !important;}
            .${props.id}_cu {color: #cccccc !important;}
            .${props.id}_cf {color: #cc9933 !important;}
            .${props.id}_sm {color: #007700 !important; opacity: 0.75 !important;}
            .${props.id}_ss {color: #ffffff !important;}
            .${props.id}_sp {color: #999999 !important;}
            .${props.id}_out {color: #ffffff !important;}
        `,
        'blue': `
            .${props.id}_fr4 {color: #1a1a4c !important;}
            .${props.id}_cu {color: #cccccc !important;}
            .${props.id}_cf {color: #cc9933 !important;}
            .${props.id}_sm {color: #0000bb !important; opacity: 0.75 !important;}
            .${props.id}_ss {color: #ffffff !important;}
            .${props.id}_sp {color: #999999 !important;}
            .${props.id}_out {color: #ffffff !important;}
        `,
        'red': `
            .${props.id}_fr4 {color: #4c1a1a !important;}
            .${props.id}_cu {color: #cccccc !important;}
            .${props.id}_cf {color: #cc9933 !important;}
            .${props.id}_sm {color: #bb0000 !important; opacity: 0.75 !important;}
            .${props.id}_ss {color: #ffffff !important;}
            .${props.id}_sp {color: #999999 !important;}
            .${props.id}_out {color: #ffffff !important;}
        `,
        'black': `
            .${props.id}_fr4 {color: #111111 !important;}
            .${props.id}_cu {color: #cccccc !important;}
            .${props.id}_cf {color: #cc9933 !important;}
            .${props.id}_sm {color: #222222 !important; opacity: 0.85 !important;}
            .${props.id}_ss {color: #ffffff !important;}
            .${props.id}_sp {color: #999999 !important;}
            .${props.id}_out {color: #ffffff !important;}
        `,
        'white': `
            .${props.id}_fr4 {color: #dddddd !important;}
            .${props.id}_cu {color: #888888 !important;}
            .${props.id}_cf {color: #cc9933 !important;}
            .${props.id}_sm {color: #ffffff !important; opacity: 0.85 !important;}
            .${props.id}_ss {color: #000000 !important;}
            .${props.id}_sp {color: #999999 !important;}
            .${props.id}_out {color: #000000 !important;}
        `,
        'yellow': `
            .${props.id}_fr4 {color: #cccc1a !important;}
            .${props.id}_cu {color: #888888 !important;}
            .${props.id}_cf {color: #cc9933 !important;}
            .${props.id}_sm {color: #eeee00 !important; opacity: 0.75 !important;}
            .${props.id}_ss {color: #000000 !important;}
            .${props.id}_sp {color: #999999 !important;}
            .${props.id}_out {color: #000000 !important;}
        `
    };

    const outerColorMap: Record<string, string> = {
        'bw': '#000000',
        'bwInvert': '#ffffff',
        'original': '#1a4c1a',
        'green': '#1a4c1a',
        'blue': '#1a1a4c',
        'red': '#4c1a1a',
        'black': '#111111',
        'white': '#dddddd',
        'yellow': '#cccc1a'
    };

    const selectedColor = props.color.toLowerCase();
    const styleContent = stylesMap[selectedColor] || stylesMap['original'];
    const outerFill = outerColorMap[selectedColor] || outerColorMap['original'];

    props.svgs.forEach(svg => {
        if (!svg) return;
        const svgId = svg.getAttribute('id');
        if (!svgId) return;

        const outer = svg.querySelector(`#${svgId}outer`);
        if (outer && outer instanceof SVGElement) {
            outer.style.fill = outerFill;
        }

        const drillMask = svg.querySelector(`#drillMask`);
        if (drillMask) {
            const innerPath = drillMask.querySelector('path');
            if (innerPath) {
                innerPath.setAttribute(
                    'fill',
                    selectedColor === 'bwinvert' ? '#000000' : '#ffffff'
                );
            }
        }

        const stackStyle = svg.querySelector('style');
        if (stackStyle) {
            stackStyle.innerHTML = styleContent;
        }
    });
}
