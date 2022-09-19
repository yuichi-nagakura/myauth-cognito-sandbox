# Cognito のユーザプールを CDK で構築するプロジェクト

## デプロイ

```
yarn cdk deploy
```

## 試す

ユーザプールで 1 ユーザ生成後にブラウザから以下の方法でアクセス

### OAuth フロー"Implicit Grant"

```
https://<ドメイン>.ap-northeast-1.amazoncognito.com/login?response_type=token&client_id=<クライアントID>&redirect_uri=<コールバックURL>
```

サインイン後のりダイクレト先 URL ハッシュの中に「ID トークン」と「アクセストークン」が格納されている

```
https://<コールバックURL>/#id_token=<IDトークン>&access_token=<アクセストークン>&expires_in=3600&token_type=Bearer
```

「ID トークン」と「アクセストークン」ををフロントエンド側で取得・保存してアプリ内で利用する

### Authorization Code Grant

```
https://<ドメイン>.ap-northeast-1.amazoncognito.com/login?response_type=code&client_id=<クライアントID>&redirect_uri=<コールバックURL>
```

サインイン後のりダイクレト先 URL の中に「認可コード」が格納されている

```
https://<コールバックURL>?code=<認可コード>
```

「認可コード」をフロントエンド側で取得・保存してアプリ内で利用する
