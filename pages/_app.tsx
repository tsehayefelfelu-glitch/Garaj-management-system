import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import AppLayout from '@/components/Layout/AppLayout';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Import Bootstrap JS for dropdowns and modals
    // @ts-ignore
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <Head>
          <title>Wise Digital Garage Management System</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <AppLayout>
          <Component {...pageProps} />
        </AppLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
