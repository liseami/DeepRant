<!--
[INPUT]: 游戏输入、模型配置、设置持久化、原版演示资源与交付入口。
[OUTPUT]: 与根 README 对应的英文产品入口：插图、下载、使用步骤与开发导航。
[POS]: 独立英文首页，技术实现与需求记录转交 CLAUDE.md 和 issues.md。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
<div align="center">
  <img src="../src/assets/app-icon.png" width="96" height="96" alt="DeepRant app icon" />
  <h1>DeepRant</h1>
  <p><strong>Trash talk in-game, automatically translated across languages.</strong></p>
  <p>In-game translation · Game terminology · Your choice of model</p>
  <p>
    <a href="https://github.com/liseami/DeepRant/releases/latest"><img src="https://img.shields.io/github/v/release/liseami/DeepRant?style=flat-square&amp;color=111827" alt="Latest public release" /></a>
    <img src="https://img.shields.io/badge/macOS-12%2B-111827?style=flat-square&amp;logo=apple&amp;logoColor=white" alt="macOS 12 and later" />
    <img src="https://img.shields.io/badge/Windows-10%2F11-111827?style=flat-square" alt="Windows 10/11" />
  </p>
  <p><a href="../README.md">简体中文</a> · <strong>English</strong></p>
  <p><a href="#download">Download</a> · <a href="#start-translating">Start translating</a> · <a href="#development">Development</a></p>
</div>

[![Original DeepRant in-game translation demo](../src/assets/preview.png)](../src/assets/demovideo.mp4)

<p align="center"><a href="../src/assets/demovideo.mp4">▶ Watch / download the original gameplay recording</a> · Original demo preserved; the current interface uses CCBaga's Laper App and Pika.</p>

## Download

**[Open the latest release](https://github.com/liseami/DeepRant/releases/latest)** and choose your platform. Available versions and packages are listed there; this README describes the current source.

| Platform | Download | Install |
| --- | --- | --- |
| macOS 12+ · Apple Silicon | [ARM64 / aarch64 DMG](https://github.com/liseami/DeepRant/releases/latest) | Drag `DeepRant.app` into Applications |
| macOS 12+ · Intel | [x64 DMG](https://github.com/liseami/DeepRant/releases/latest) | Drag `DeepRant.app` into Applications |
| Windows 10/11 · x86_64 | [Windows installer](https://github.com/liseami/DeepRant/releases/latest) | Run the installer |

Use **About → Check for updates** in the app, then confirm to download, install and restart.

## Start translating

1. **Add your Key:** if no DeepSeek Key is saved, the banner at the top lets you enter and save one or visit the [DeepSeek platform](https://platform.deepseek.com/). View, show/hide and edit your current Key in AI models.
2. **Allow input:** on macOS, click **Open Accessibility settings** in the app and allow DeepRant. On Windows, run DeepRant and the game at matching privilege levels.
3. **Prepare your game:** select translation languages, game context and shortcut on Home; choose automatic, professional or toxic expression in Modes.
4. **Translate:** for in-place mode, write your message, put the cursor at the end and press the shortcut (`⌘ + T` by default on macOS); the translating placeholder is replaced with your translation. For Star Citizen / LoL in automatic mode, open an empty chat field, press the shortcut, then write, translate and confirm insertion in the message window.
5. **Send yourself:** check the result, then press Enter. DeepRant does not send messages for you.

| Input method | How to use it |
| --- | --- |
| **In-place translation** | For chat boxes that support copying. Select backward to the start of the current line, copy, insert the placeholder, then verify focus and placeholder before replacement. New edits are preserved. |
| **Game input window** | Automatic mode uses this for Star Citizen / LoL, without relying on chat-box copying. Open an empty chat box, trigger the shortcut, write in the window, translate, edit and confirm insertion. |
| **Daily mode** | Translates already-selected text. In document apps such as Pages, select the passage first. |

The input window supports `Ctrl / ⌘ + Enter` to translate or insert, and `Esc` to cancel. For restricted inputs, use the translation helper in Modes and copy the result manually.

## Make it yours

- **Game context:** Star Citizen, LoL, Dota 2, CS2, Valorant and more, plus custom scenes, terminology and shared instructions.
- **Languages and tone:** bidirectional translation and rewriting; West Coast battle / diss in Trash talk, editable custom instructions and the complete effective prompt. Switch the interface independently between Chinese and English, and let the appearance follow the system or stay light / dark.
- **Model choice:** DeepSeek, OpenAI-compatible services, Anthropic, Tencent TokenHub, SiliconFlow, 302.AI or local Ollama without a Key; a self-hosted LAN relay can use a plain http URL such as `http://192.168.1.20:3000`.
- **Quick phrases:** add, edit and delete phrases; configure individual shortcuts and switches, including numpad digits and function keys.

Rust owns translation, shortcuts, clipboard and system operations; the interface owns input and presentation. All settings stay in local SQLite, with migration from older configurations. Keys stay in the system credential vault; viewing returns a Key only to the current model editor, never the database or logs. Translation requests go to your chosen model service.

## Development

Node.js 22.12+, Python 3 and the repository's pinned Rust toolchain; prepare the [Tauri native prerequisites](https://v2.tauri.app/start/prerequisites/) first.

```sh
npm ci
npm run tauri dev
```

On macOS Apple Silicon, run `npm run dev:install` from `release` to rebuild, replace and start `/Applications/DeepRant.app`; delivery archives go to `releases/`. Local installation does not publish. Official packaging uses the [release workflow](../.github/workflows/release.yml).

[Module map](../CLAUDE.md) · [Requirements and validation](issues.md) · [Report an issue](https://github.com/liseami/DeepRant/issues)

Built with [Rust / Tauri](https://tauri.app/), [React](https://react.dev/) and [enigo](https://github.com/enigo-rs/enigo). Components, the Laper App theme and Pika icons come from the author's [CCBaga](https://github.com/liseami/CCBaga) project.
