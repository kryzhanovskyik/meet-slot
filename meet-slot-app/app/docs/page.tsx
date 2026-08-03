import { getApiDocs } from '@/lib/swagger';
import ReactSwagger from './swagger-ui';

export default async function ApiDocsPage() {
  const spec = await getApiDocs();
  return (
    <main className="container mx-auto p-4">
      <ReactSwagger spec={spec} />
    </main>
  );
}