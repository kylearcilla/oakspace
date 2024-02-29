import sass from 'rollup-plugin-sass';

export default {
    plugins: [
        svelte({
            onwarn: (warning, handler) => {
                const { code, frame } = warning;
                if (code === "css-unused-selector")
                    return;

                handler(warning);
            },
        }),
        sass({
            output: true, // This option is required to output the minified CSS
            options: {
                outputStyle: 'compressed', // This option tells Sass to output minified CSS
            },
        }),
    ],
};