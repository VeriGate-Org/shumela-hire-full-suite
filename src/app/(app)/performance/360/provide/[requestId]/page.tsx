import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ requestId: '_' }];
}

export default function Page() {
  return <ClientPage />;
}
