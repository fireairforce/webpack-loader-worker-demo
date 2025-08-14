import { defineConfig } from '@rsbuild/core';

export default defineConfig({
    source: {
        entry: {
            'loader-runner-worker': './public_worker_test/js/worker.js',
        }
    },
    output: {
        target: 'web-worker',
        minify: false,
        filenameHash: false,
    },
    performance: {
        chunkSplit: {
            strategy: 'all-in-one'
        }
    },
});
