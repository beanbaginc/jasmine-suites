import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';


export default [
    {
        external: [
            'jasmine',
        ],
        input: './src/index.js',
        output: [
            {
                file: `lib/index.js`,
                format: 'umd',
                name: 'JasmineSuites',
                esModule: false,
                exports: 'named',
                sourcemap: true,
            },
            {
                dir: 'lib/esm',
                format: 'esm',
                exports: 'named',
                sourcemap: true,
            },
            {
                dir: 'lib/cjs',
                format: 'cjs',
                exports: 'named',
                sourcemap: true,
            },
        ],
        plugins: [
            babel({
                babelHelpers: 'bundled',
            }),
            resolve({
                modulePaths: [],
            }),
        ],
    },
];
