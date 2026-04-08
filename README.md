## 星空ノート

## 開発メモ

**コミットメッセージの命名規則**
feat: 新しい機能
fix: バグの修正
docs: ドキュメントのみの変更
style: 空白、フォーマット、セミコロン追加など
refactor: 仕様に影響がないコード改善(リファクタ)
perf: パフォーマンス向上関連
test: テスト関連
chore: ビルド、補助ツール、ライブラリ関連

**ブランチ名命名規則**
mainデプロイされてるとこ永続
feature特定機能の追加・変更
develop開発の大本永続
release次にリリースする機能を置いとく所
hotfixメインブランチに対する即時修正
topic複数人での機能開発用

## 使用コマンド

pnpm create expo-app@latest react-native-expo-tutorial --template blank-typescript
(pnpm create expo-app@latest . --template blank-typescriptとすると現在のフォルダに展開される)

mkdir -p src/assets \
 src/screens

package.jsonのmainを変更
srcの中にapp.tsxを新規作成。既存のApp.tsxは削除
assetsフォルダをsrc配下に移動
app.jsonファイルの画像パスを変更
tsconfig.jsonファイル修正

pnpm add -D @biomejs/biome
（node関係でエラー吐いたとき用
rm -rf node_modules pnpm-lock.yaml
pnpm install）

pnpm biome init
