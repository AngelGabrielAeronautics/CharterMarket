import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Responsive Design Testing',
  description: 'Test the site at different screen sizes',
};

const breakpoints = [
  { name: 'Mobile S', width: 320, height: 568 },
  { name: 'Mobile M', width: 375, height: 667 },
  { name: 'Mobile L', width: 425, height: 812 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1024, height: 768 },
  { name: 'Laptop L', width: 1440, height: 900 },
];

export default function ResponsiveTest() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-primary p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Responsive Design Testing
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View the site at different screen sizes simultaneously
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {breakpoints.map((breakpoint) => (
            <div
              key={breakpoint.name}
              className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {breakpoint.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {breakpoint.width}x{breakpoint.height}
                </p>
              </div>
              
              <div className="relative bg-gray-800 p-2">
                <div
                  className="overflow-hidden"
                  style={{
                    width: '100%',
                    height: '500px',
                  }}
                >
                  <iframe
                    src="/"
                    style={{
                      width: `${breakpoint.width}px`,
                      height: '100%',
                      transform: `scale(${Math.min(
                        1,
                        ((100 - 16) / 100) / (breakpoint.width / 300)
                      )})`,
                      transformOrigin: '0 0',
                      border: 'none',
                    }}
                    title={`${breakpoint.name} preview`}
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-dark-accent">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Scale: {Math.round(Math.min(1, ((100 - 16) / 100) / (breakpoint.width / 300)) * 100)}%
                  </span>
                  <a
                    href={`/?viewport=${breakpoint.width}x${breakpoint.height}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Open in New Tab →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 