# atcoder-schedule
AtCoderの今後の開催予定をGoogle Calendarに追加する。
## 利用方法
1. google drive上でGASのプロジェクトを作成し、scriptIDを取得
2. ルート下に.clasp.jsonを作成
```.clasp.json
{
  "scriptId":"************",
  "rootDir": "src"
}
```
3. src/config_json.htmlを作成し、google calendar IDを記載
```src/config_json.html
{
    "calendar_id": "************"
}
```
4. GASのプロジェクトにpush
```
clasp login
clasp push
```
5. デプロイし、get_atcoder_schedule.tsのmain関数に時間によるトリガーを設定する。

