#!/usr/bin/env bun

import { $ } from 'bun';
import { resolve } from 'node:path';

const INPUT = resolve(import.meta.dir, '../tmp/openapi.json');
const OUTPUT = resolve(import.meta.dir, '../src/lib/types/openapi.ts');

console.log(`Generating OpenAPI types...`);

await $`mkdir -p tmp && apir openapi -c ./apir -o ${INPUT}`;

await $`bunx openapi-typescript ${INPUT} --output ${OUTPUT} --default-non-nullable false --alphabetize`;

console.log(`[OK] ${OUTPUT}`);