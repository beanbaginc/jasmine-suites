import beanbag from '@beanbag/eslint-plugin';
import { defineConfig } from 'eslint/config';


export default defineConfig([
    beanbag.configs.recommended,
    {
        plugins: {
            '@beanbag': beanbag,
        },
    },
]);
