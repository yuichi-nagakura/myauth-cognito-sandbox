import logo from './logo.svg';
import './App.css';
import { Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { useEffect } from 'react';

function App({ signOut, user }) {
  console.log('user', user);

  useEffect(() => {
    const getObjects = async () => {
      // クレデンシャルをCognito IdentityPoolから取得
      const { accessKeyId, secretAccessKey, sessionToken } =
        await Auth.currentCredentials();

      const s3Client = new S3Client({
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
        region: 'ap-northeast-1',
      });

      const response = await s3Client.send(
        new ListObjectsCommand({
          Bucket: 'cognitosandbox-cognitosandboxbucket453f14ae-1rjynvtwjcdyv',
        })
      );
      return response.Contents;
    };

    getObjects().then((contents) => {
      console.log('contents :>> ', contents);
    });
  }, [user]);

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>

        <button onClick={signOut}>Sign out</button>
      </header>
    </div>
  );
}

export default withAuthenticator(App);
