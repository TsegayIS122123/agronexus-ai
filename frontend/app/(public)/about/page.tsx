export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About AgroNexus AI</h1>
        <div className="bg-white p-8 rounded-xl shadow">
          <p className="text-gray-600 mb-4">
            AgroNexus AI is an AI-powered platform connecting Ethiopian agriculture to industry.
          </p>
          <p className="text-gray-600 mb-4">
            Our mission is to transform Ethiopia from a raw material exporter to a manufacturing hub.
          </p>
          <p className="text-gray-600">
            Built by Tsegay Assefa, a 3rd-year Information Science student at Addis Ababa University.
          </p>
        </div>
      </div>
    </div>
  );
}
