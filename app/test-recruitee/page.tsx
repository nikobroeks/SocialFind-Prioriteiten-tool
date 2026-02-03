'use client';

import { useState } from 'react';

export default function TestRecruiteePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Test credentials first
      const credentialsResponse = await fetch('/api/recruitee/test');
      const credentialsData = await credentialsResponse.json();
      
      setData({ credentials: credentialsData });

      // Then test jobs endpoint
      const response = await fetch('/api/recruitee/jobs?status=published');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch');
      }

      setData((prev: any) => ({ ...prev, jobs: result }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Recruitee API Test</h1>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testen...' : 'Test Recruitee API'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success!</strong> {data.jobs?.length || 0} jobs gevonden
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Raw Response:</h2>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

          {data.jobs && data.jobs.length > 0 && (
            <div className="bg-blue-50 p-4 rounded">
              <h2 className="font-semibold mb-2">First Job Analysis:</h2>
              <pre className="text-xs overflow-auto">
                {JSON.stringify({
                  id: data.jobs[0].id,
                  title: data.jobs[0].title,
                  company_id: data.jobs[0].company_id,
                  hasCompany: !!data.jobs[0].company,
                  company: data.jobs[0].company,
                  allKeys: Object.keys(data.jobs[0])
                }, null, 2)}
              </pre>
            </div>
          )}

          {data.jobs && data.jobs.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded">
              <h2 className="font-semibold mb-2">Unique Companies:</h2>
              <ul className="list-disc list-inside">
                {Array.from(new Set(data.jobs.map((j: any) => {
                  const companyId = j.company_id || j.companyId;
                  const companyName = j.company?.name || j.company_name || `Company ${companyId}`;
                  return `${companyId}: ${companyName}`;
                }))).map((item: any, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

