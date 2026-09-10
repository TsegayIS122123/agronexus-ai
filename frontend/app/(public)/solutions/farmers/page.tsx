import Link from 'next/link';

export default function SolutionsFarmers() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🌾 For Farmers</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">🔬</div>
            <h3 className="text-xl font-semibold mb-2">Disease Detection</h3>
            <p className="text-gray-600">Upload photos and get instant AI diagnosis</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600">24/7 farming advice in your language</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-semibold mb-2">Price Prediction</h3>
            <p className="text-gray-600">Know when to sell for maximum profit</p>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/auth/register?role=farmer" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
            Join as a Farmer
          </Link>
        </div>
      </div>
    </div>
  );
}
