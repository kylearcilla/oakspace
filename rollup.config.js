import sass from 'rollup-plugin-sass';

export default {
    plugins: [
        sass({
            output: true, // This option is required to output the minified CSS
            options: {
                outputStyle: 'compressed', // This option tells Sass to output minified CSS
            },
        }),
    ],
};