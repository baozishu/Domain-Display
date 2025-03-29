import { DatabaseProvider } from '@/contexts/database-context';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DatabaseProvider>
      {/* 其他上下文提供者... */}
      <Component {...pageProps} />
    </DatabaseProvider>
  )
} 