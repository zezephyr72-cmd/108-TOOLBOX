import { Analytics } from '@vercel/analytics/next';

type AppProps = {
  Component: any;
  pageProps: any;
};
 
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
 
export default MyApp;