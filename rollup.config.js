"use strict";

import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json'

export default {
    input: "src/index.ts",
    output: {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
    },
    external:["zlib","util","https","http","url","assert","stream","tty","os"],

    plugins: [
        clear({ targets: ["dist"] }),
        resolve({ rootDir: "src" }),
        commonjs(),
        typescript({ tsconfig: "./tsconfig.json" }),
        json({ include: '**/*.json' }),
    ]
}
