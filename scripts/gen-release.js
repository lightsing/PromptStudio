import fs from 'fs'
import { execSync } from 'child_process'

const meta = JSON.parse(fs.readFileSync('./package.json').toString())
const commitMessage = execSync('git log -1 --pretty=%B').toString().trim()
const signature = fs
  .readFileSync(`./src-tauri/target/release/bundle/nsis/Prompt Studio_${meta.version}_x64-setup.nsis.zip.sig`)
  .toString()

const output = {
  version: meta.version,
  notes: commitMessage,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: signature,
      url: `https://prompt-studio.oss-cn-guangzhou.aliyuncs.com/download/Prompt%20Studio_${meta.version}_x64-setup.nsis.zip`,
    },
  },
}

const json = JSON.stringify(output, null, 2)
console.log(json)
fs.writeFileSync('./release.json', json)
