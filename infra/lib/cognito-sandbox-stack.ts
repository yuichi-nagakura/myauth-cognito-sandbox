import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AccountRecovery } from 'aws-cdk-lib/aws-cognito';
import {
  IdentityPool,
  IdentityPoolProviderUrl,
  UserPoolAuthenticationProvider,
} from '@aws-cdk/aws-cognito-identitypool-alpha';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';

export class CognitoSandboxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 検証用のバケット
    // Cognito Identity Poolで認可された場合にアクセスできるか確認するためのもの
    const bucket = new s3.Bucket(this, 'cognito-sandbox-bucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST],
          allowedOrigins: [
            'http://localhost:*',
            'https://example.com/',
            'https://*.example.com/',
          ],
        },
      ],
    });

    new cdk.CfnOutput(this, 'bucketName', {
      value: bucket.bucketName,
    });

    // ユーザプール作成
    const userPool = new cognito.UserPool(this, 'myuserpool', {
      userPoolName: 'y-nagakura-cognito-sandbox-userpool',
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email for our awesome app!',
        emailBody:
          'Hello {username}, you have been invited to join our awesome app! Your temporary password is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
        smsMessage:
          'Hello {username}, your temporary password for our awesome app is {####}',
      },
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireDigits: true,
        requireLowercase: true,
        requireSymbols: false,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      mfa: cognito.Mfa.OFF,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // アプリクライアント作成
    const client = userPool.addClient('y-nagakura-client', {
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      userPoolClientName: 'y-nagakura-client',
      oAuth: {
        callbackUrls: ['https://www.amazon.com'], // TODO
        logoutUrls: [], // TODO
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
          clientCredentials: false,
        },
        scopes: [
          cognito.OAuthScope.PHONE,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.COGNITO_ADMIN,
          cognito.OAuthScope.PROFILE,
        ],
      },
    });

    // Amazon Cognito ドメイン設定
    const domain = userPool.addDomain('y-nagakura-domain', {
      cognitoDomain: {
        domainPrefix: 'y-nagakura',
      },
    });

    new cdk.CfnOutput(this, 'client-id', {
      value: client.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'domain-name', {
      value: domain.domainName,
    });

    // アイデンティティプールの作成
    const identityPool = new IdentityPool(this, 'myidentitypool', {
      identityPoolName: 'y-nagakura-cognito-sandbox-identitypool',
      // TODO ロールマッピングがうまくいかない。手動設定で対応する
      // roleMappings: [
      //   {
      //     mappingKey: 'cognito',
      //     providerUrl: IdentityPoolProviderUrl.userPool(
      //       userPool.userPoolProviderUrl
      //     ),
      //     useToken: true,
      //   },
      // ],
    });

    // bucket.grantReadWrite(identityPool.authenticatedRole);

    new CfnOutput(this, 'identitypool-id', {
      value: identityPool.identityPoolId,
    });

    // MEMO: ロールベースアクセスで利用したいため定義
    // ユーザグループ作成
    const testUserGroupRole = new iam.Role(this, 'testUserGrouprole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': [identityPool.identityPoolId],
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });
    testUserGroupRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
    );
    // ユーザプールにロールを割り当てたグループを追加している
    new cognito.CfnUserPoolGroup(this, 'testUserGroup', {
      userPoolId: userPool.userPoolId,
      description: 'testUserGroup',
      groupName: 'testUserGroup',
      roleArn: testUserGroupRole.roleArn,
    });
  }
}
