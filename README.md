# touring_cost_app 運用メモ

## 広告のON/OFF
- 広告は **meta[name="ads"] が "on"** のページだけで表示されます。
- 審査中・違反解消中は **assets/js/config.js** の `enabled` を `false` にしておけば完全に停止します。
- 広告を出す場合は `client` と `slots` をAdSenseの値に置き換えてください。

```
window.TOURING_COST_CONFIG = {
  ads: {
    enabled: false,
    client: "",
    slots: {
      inArticle: "",
      displayBottom: ""
    }
  }
};
```

### 追加で注意すること
- `calc.html` は `meta[name="ads"] = "off"` かつ `ads.js` 未読込で固定。
- ガイド記事や入口ページは `meta[name="ads"] = "on"` + `ads.js` 読込。

## ページ追加の手順
1. `guides/` に新しいHTMLを作成。
2. `meta description / canonical / OGP` を設定。
3. `meta[name="ads"] = "on"` を入れ、`ads.js` を読み込む。
4. `sitemap.xml` にURLを追加。

## 月3,000円の目安（断定しない）
- 仮にRPM（1000PVあたりの収益）が **200円** 程度なら、**月15,000PV** 前後が必要。
- RPMが **300円** 程度なら、**月10,000PV** 前後が必要。
- 実際のRPMは季節・広告枠・ユーザー属性で変動するため、あくまで目安です。
