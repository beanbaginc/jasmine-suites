import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import externalGlobals from 'rollup-plugin-external-globals';


const extensions = ['.ts'];
const globalsMap = {
    'jasmine-core': 'globalThis',
};


export default [
    {
        external: [
            'jasmine-core',
        ],
        input: './src/index.ts',
        output: [
            {
                esModule: false,
                exports: 'named',
                file: 'lib/index.js',
                format: 'umd',
                globals: globalsMap,
                name: 'JasmineSuites',
                sourcemap: true,
            },
            {
                dir: 'lib/esm',
                exports: 'named',
                format: 'esm',
                globals: globalsMap,
                sourcemap: true,
            },
            {
                dir: 'lib/cjs',
                exports: 'named',
                format: 'cjs',
                globals: globalsMap,
                sourcemap: true,
            },
        ],
        plugins: [
            babel({
                babelHelpers: 'bundled',
                extensions: extensions,
            }),
            externalGlobals(globalsMap),
            resolve({
                extensions: extensions,
                modulePaths: [],
            }),
        ],
    },
    {
        input: './_build/dts/index.d.ts',
        output: [
            {
                'file': 'lib/index.d.ts',
                'format': 'es',
            },
            {
                'file': 'lib/index.d.mts',
                'format': 'es',
            },
        ],
        plugins: [
            dts.default(),
        ],
    },
];
