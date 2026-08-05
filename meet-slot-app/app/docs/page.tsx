import { getApiDocs } from '@/lib/swagger';
import { Header } from '@/components/header';
import ReactSwagger from './swagger-ui';

export default async function ApiDocsPage() {
  const spec = await getApiDocs();
  return (
    <div className="min-h-dvh bg-(--background)">
      <Header />
      <main className="container mx-auto p-4">
        <ReactSwagger spec={spec} />
      </main>
    </div>
  );
}