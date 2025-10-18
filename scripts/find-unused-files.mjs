#!/usr/bin/env node

import { promises as fsp } from "fs";
import { statSync } from "fs";
import path from "path";

const projectRoot = process.cwd();
const includeDirs = ["app"];
const validExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignoredExtensions = new Set([".d.ts"]);
const ignoredSuffixes = [".stories.tsx", ".stories.ts", ".test.tsx", ".test.ts", ".spec.tsx", ".spec.ts"];
const ignoredDirectories = [
    path.join(projectRoot, "app/bokfor/components/Steg/SpecialForval"),
];
const entryPointPatterns = [
    /\/page\.(ts|tsx|js|jsx|mjs|cjs)$/,
    /\/layout\.(ts|tsx|js|jsx|mjs|cjs)$/,
    /\/loading\.(ts|tsx|js|jsx|mjs|cjs)$/,
    /\/error\.(ts|tsx|js|jsx|mjs|cjs)$/,
    /\/route\.(ts|tsx|js|jsx|mjs|cjs)$/,
];
const alwaysInclude = new Set([
    path.join(projectRoot, "next.config.js"),
    path.join(projectRoot, "next.config.ts"),
    path.join(projectRoot, "middleware.ts"),
]);

async function collectFiles() {
    const files = [];
    for (const dir of includeDirs) {
        const absoluteDir = path.join(projectRoot, dir);
        files.push(...(await walkDirectory(absoluteDir)));
    }
    return files.filter((file) => {
        const ext = path.extname(file);
        if (!validExtensions.has(ext)) return false;
        if (ignoredExtensions.has(ext)) return false;
        if (ignoredSuffixes.some((suffix) => file.endsWith(suffix))) return false;
        return true;
    });
}

async function walkDirectory(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const results = [];
    for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        const fullPath = path.join(dir, entry.name);
        if (ignoredDirectories.some((ignoredDir) => fullPath.startsWith(ignoredDir))) {
            if (entry.isDirectory()) continue;
            if (!entry.isDirectory()) continue;
        }
        if (entry.isDirectory()) {
            results.push(...(await walkDirectory(fullPath)));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

async function buildDependencyGraph(files) {
    const graph = new Map();
    for (const file of files) {
        const content = await fsp.readFile(file, "utf8");
        const imports = extractImports(content);
        const resolved = imports
            .filter((specifier) => specifier.startsWith("."))
            .map((specifier) => resolveImport(file, specifier))
            .filter(Boolean);
        graph.set(file, new Set(resolved));
    }
    return graph;
}

function extractImports(source) {
    const imports = [];
    const importRegex = /import\s+(?:[^"'\n]+?from\s+)?["']([^"']+)["']/g;
    const exportRegex = /export\s+(?:[^"'\n]+?from\s+)["']([^"']+)["']/g;
    const dynamicRegex = /import\(\s*["']([^"']+)["']\s*\)/g;
    const requireRegex = /require\(\s*["']([^"']+)["']\s*\)/g;

    let match;
    while ((match = importRegex.exec(source))) {
        imports.push(match[1]);
    }
    while ((match = exportRegex.exec(source))) {
        imports.push(match[1]);
    }
    while ((match = dynamicRegex.exec(source))) {
        imports.push(match[1]);
    }
    while ((match = requireRegex.exec(source))) {
        imports.push(match[1]);
    }
    return imports;
}

function resolveImport(fromFile, specifier) {
    const basePath = path.resolve(path.dirname(fromFile), specifier);
    const candidates = [];

    if (validExtensions.has(path.extname(basePath)) && fileExistsSync(basePath)) {
        return normalizePath(basePath);
    }

    for (const ext of validExtensions) {
        candidates.push(`${basePath}${ext}`);
    }
    candidates.push(path.join(basePath, "index.ts"));
    candidates.push(path.join(basePath, "index.tsx"));
    candidates.push(path.join(basePath, "index.js"));
    candidates.push(path.join(basePath, "index.jsx"));
    candidates.push(path.join(basePath, "index.mjs"));
    candidates.push(path.join(basePath, "index.cjs"));

    for (const candidate of candidates) {
        if (fileExistsSync(candidate)) {
            return normalizePath(candidate);
        }
    }
    return null;
}

function fileExistsSync(filePath) {
    try {
        const stat = statSync(filePath);
        if (stat) return stat.isFile();
    } catch {
        // ignore
    }
    return false;
}

function normalizePath(p) {
    return path.normalize(p);
}

function determineEntryPoints(files) {
    const entries = new Set();
    for (const file of files) {
        if (alwaysInclude.has(file)) {
            entries.add(file);
            continue;
        }
        const relative = path.relative(projectRoot, file);
        if (entryPointPatterns.some((regex) => regex.test(`/${relative}`))) {
            entries.add(file);
        }
    }
    return entries;
}

function findReachable(graph, entryPoints) {
    const visited = new Set(entryPoints);
    const stack = [...entryPoints];

    while (stack.length > 0) {
        const current = stack.pop();
        const deps = graph.get(current);
        if (!deps) continue;
        for (const dep of deps) {
            if (!visited.has(dep) && graph.has(dep)) {
                visited.add(dep);
                stack.push(dep);
            }
        }
    }

    return visited;
}

async function main() {
    const files = await collectFiles();
    const graph = await buildDependencyGraph(files);
    const entryPoints = determineEntryPoints(files);
    const reachable = findReachable(graph, entryPoints);
    const unused = files.filter((file) => !reachable.has(file));

    if (unused.length === 0) {
        console.log("No potentially unused files detected.");
        return;
    }

    console.log("Potentially unused files:\n");
    for (const file of unused) {
        console.log(`- ${path.relative(projectRoot, file)}`);
    }

    console.log("\n(Heuristics based on import graph; dynamic usage may still exist.)");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
