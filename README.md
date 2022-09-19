# Cognito のユーザプールを CDK で構築して React で Cognito 認証・認可できるか検証

## インフラ

```
yarn cdk deploy
```

構築出来たら作成済みの AWS マネコンから Cognito のユーザを作成する（`testUserGroup`グループに属するように設定する）

## フロント

```
yarn start
```

ブラウザからアクセスして作成したユーザでログインしてブラウザコンソールを確認する
