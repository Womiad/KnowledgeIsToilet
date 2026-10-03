# 教室就是馬桶

以 Canvas 2D、Web Audio API 與瀏覽器語音合成製作的互動聲音作品。老師持續講課，文字逸出講義泡泡，資訊與水一起淹沒教室；向下拉右側沖水繩可把一切吸走。

## 執行

```bash
npm install
npm run dev
npm run build
npm run preview
```

`dist/` 是可獨立部署的靜態內容。Vite 使用 `base: './'`，可同時支援 GitHub project page 與自訂網域。

## GitHub Pages

推送 `main` 後，`.github/workflows/deploy.yml` 會執行 `npm ci`、建置、上傳 `dist/` 並部署。到 repository **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。不需要設定伺服器或路由。

## 講課內容與切換

11 科講稿在 `public/content/lectures/`，清單在 `public/content/lecture-manifest.json`。直接修改 Markdown 正文即可；新增科目時加入一個 Markdown 和 manifest 項目。用查詢參數測試，例如：

- `/?lecture=history`
- `/?lecture=chemistry`
- `/?lecture=biology`

首次載入會隨機選擇科目，沖水循環後也會從其餘科目隨機抽取下一科。若需要固定測試某科，可使用 query parameter。

## 音訊與替換

目前已有原始素材的 `public/audio/tolet.mp3`，以及新增的 `public/audio/gurgling.mp3`。lecture MP3 是刻意留空的可替換位置：把自己的檔案放在 `public/audio/lectures/physics.mp3`（或其他 manifest 指定路徑）後，作品會優先使用它，並經過 Web Audio 的 high-pass、low-pass、共振、gain 與水下 ambience graph。不存在時，會自動使用免費、無金鑰、支援 zh-TW 的瀏覽器 `SpeechSynthesis`；這能立刻出聲，但瀏覽器不允許把其輸出接入 Web Audio graph，所以 fallback 的人聲主要由逐漸增強的咕嚕聲與水下環境聲遮蔽。

`npm run generate-tts -- physics` 可用 Windows 內建 Microsoft Hanhan Desktop 重新生成指定中文科目的 MP3，英文科使用 Microsoft Zira Desktop；`npm run generate-tts -- all` 會重建全部 11 科。文字改過後需要重新執行生成指令，網站才會播放更新後的 MP3。

## 素材

已使用原始素材：教室背景、teacher1–4、pull、tolet.mp3 與 universfield-water-bubbling-278823.mp3（部署時命名為 `gurgling.mp3`）。動態水、氣泡、漂浮文字與排水漩渦均由程式產生；沒有使用 `water.png` 作升降動畫。每次沖水完成會保留 10 秒靜默，再依 manifest 順序播放下一科並重啟整個循環。

更換圖片時保留檔名，或修改 `src/main.ts` 及 `ExperienceController.ts`：`classroom.png`、`teacher1.png` 至 `teacher4.png`、`pull.png`。

## 調整

主要參數集中在 `src/config/experienceConfig.ts`：總時長、水開始及全滿進度、老師嘴部高度、波幅/波速、漂浮文字上限、濾波截止頻率、水下音量、拉繩閾值、沖水時間、排水點與吸力、結尾靜默時間。

## 已知限制

- 作業系統若沒有 zh-TW 語音，Browser TTS 會退回其他中文語音。
- 已生成的 MP3 能完整通過 Web Audio 水下濾波與 echo。若刪除某科 MP3，該科才會退回 SpeechSynthesis。
- 不同瀏覽器的 SpeechSynthesis 長文暫停行為可能不同，Chrome/Edge 的相容性最佳。
