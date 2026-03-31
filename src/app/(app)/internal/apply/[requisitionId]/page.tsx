import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ requisitionId: '_' }];
}

export default function Page() {
  return <ClientPage />;
}
