# sleep-well

## 言語

- ユーザーへの返答は**必ず日本語**で書く。作業途中のひとこと（ツール実行の合間の進捗メモ）、質問、最後のまとめもすべて日本語。
- 長い作業のあとや、英語のツール出力を読んだ直後でも英語に切り替えない。
- コード中のコメントとコミットメッセージは、既存に合わせて英語のままでよい。

## デプロイ

仕様が決まったら、確認を待たずにデプロイまで終わらせる。報告はデプロイ完了後にまとめて行う。

1. `npx tsc --noEmit` と `pnpm build` が通ることを確認する
2. `main` にコミットして `git push origin main`（Vercel が自動で本番デプロイする）
3. 完了を確認する：
   `gh api repos/kenta-yos/sleep-well/commits/<sha>/status --jq '.state'` が `success` になるまで待つ
   - 数分たっても `pending` のまま（statuses が空）なら、Vercel の通知取りこぼし。次の push でまとめてデプロイされるので、空でもいいのでもう一度 push して確認する
4. 報告ではコミットの sha と、実機で確認していない点があればそれを明記する

## DB マイグレーション

- DB は Neon（Postgres）。接続先は `.env` / `.env.local` の `DATABASE_URL`（本番と共通）
- マイグレーションは `drizzle/migrations/000N_*.sql` に手書きし、`@neondatabase/serverless` を使う一時スクリプトで本番に直接流す（drizzle-kit migrate は使っていない）
- 順番に注意する：
  - **追加**（テーブル・列の追加）：先に DB に流してから、コードをデプロイする
  - **削除**（列・テーブルの削除）：先にその列を読まないコードをデプロイし、そのあとで DB から消す。消す前に中身を読み出して報告に残す
- Neon の履歴保持は6時間（無料プラン）。誤って上書きしたデータは、6時間以内なら `neonctl branches create --parent <ISO時刻>` で過去時点のブランチを作って読み出せる（`--org-id org-winter-sunset-64810393`、プロジェクト `old-river-68384308`）。使い終わったブランチは削除する
