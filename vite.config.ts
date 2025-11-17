import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {nodePolyfills} from 'vite-plugin-node-polyfills'

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            // adds Buffer, process, etc automatically
            protocolImports: true,
        }),
    ],

    resolve: {
        alias: {
            buffer: 'buffer',
        },
    },

    optimizeDeps: {
        include: ['buffer'],
    },
})
