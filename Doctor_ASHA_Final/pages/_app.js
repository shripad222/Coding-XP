
import '../styles/globals.css';
import SyncService from '../components/SyncService';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <SyncService />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
