import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ postId: '_' }];
}

export default function Page() {
  return <ClientPage />;
}
