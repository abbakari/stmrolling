import React from 'react';
import { Database, Settings, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const SupabaseSetup: React.FC = () => {
  const isConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key-here';

  if (isConfigured) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Supabase Connected
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Your application is connected to Supabase and ready to use real data persistence.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <Database className="mx-auto h-16 w-16 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Supabase Configuration Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This application requires Supabase to be configured for real data persistence and authentication.
          </p>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Setup Instructions
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">1. Create a Supabase Project</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">supabase.com</a> and create a new project</li>
                  <li>Wait for your project to be set up (this takes a few minutes)</li>
                  <li>Note down your project URL and anon key from the project settings</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">2. Run Database Migration</h4>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Copy and paste the SQL from <code className="text-xs bg-gray-100 px-1 rounded">supabase-schema.sql</code> into your Supabase SQL editor:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Open your Supabase project dashboard</li>
                    <li>Go to the SQL Editor</li>
                    <li>Copy the contents of <code className="text-xs bg-gray-100 px-1 rounded">supabase-schema.sql</code></li>
                    <li>Paste and run the SQL to create tables, indexes, and security policies</li>
                  </ol>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">3. Configure Environment Variables</h4>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Set the following environment variables in your deployment platform or <code className="text-xs bg-gray-100 px-1 rounded">.env</code> file:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-gray-900 text-green-400 text-sm p-3 rounded font-mono">
                      VITE_SUPABASE_URL=https://your-project.supabase.co
                    </div>
                    <div className="bg-gray-900 text-green-400 text-sm p-3 rounded font-mono">
                      VITE_SUPABASE_ANON_KEY=your-anon-key-here
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">4. Application Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h5 className="font-medium text-indigo-900 mb-2">🔐 Authentication</h5>
                    <p className="text-sm text-indigo-700">Real user authentication with role-based access control</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">📊 Real Data</h5>
                    <p className="text-sm text-green-700">PostgreSQL database with optimized queries and indexing</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">⚡ Performance</h5>
                    <p className="text-sm text-blue-700">Pagination, filtering, caching, and real-time updates</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-2">🔒 Security</h5>
                    <p className="text-sm text-purple-700">Row-level security and data protection policies</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Settings className="h-4 w-4 mr-1" />
                Configuration incomplete
              </div>
              <a
                href="https://supabase.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Supabase Documentation
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Development Mode
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  The application is currently running with placeholder configuration. 
                  Complete the Supabase setup to enable full functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSetup;
