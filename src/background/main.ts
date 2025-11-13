chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  try {
    const urlStr = item.finalUrl || item.url;
    const url = new URL(urlStr);

    // フォルダ名用に hostname をサニタイズ
    const host = url.hostname.replace(/[:\/\\]+/g, "_");

    // 元のファイル名を拾う（なければ fallback）
    const original =
      (item.filename as string | undefined) ||
      (item.suggestedFilename as string | undefined) ||
      "download";

    // ひとまず「ドメインごとのフォルダ」ルール
    const newPath = `${host}/${original}`;

    suggest({
      filename: newPath,
      conflictAction: "uniquify", // 同名があれば自動で (1) などを付与
    });
  } catch (e) {
    console.error("Failed to build filename:", e);
  }
});
