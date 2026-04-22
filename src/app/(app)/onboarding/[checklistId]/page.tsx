import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ checklistId: '_' }];
}

export default function Page() {
  return <ClientPage />;
}
