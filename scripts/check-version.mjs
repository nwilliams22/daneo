import { readFileSync } from 'node:fs'

const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version
const tauriVersion = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).version
const cargoVersion = readFileSync('src-tauri/Cargo.toml', 'utf8').match(/^version\s*=\s*"([^"]+)"/m)?.[1]

if (!packageVersion || packageVersion !== tauriVersion || packageVersion !== cargoVersion) {
  console.error(`Version mismatch: package.json=${packageVersion}, tauri.conf.json=${tauriVersion}, Cargo.toml=${cargoVersion}`)
  process.exit(1)
}

console.log(`All manifests use ${packageVersion}`)
