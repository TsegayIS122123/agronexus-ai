import Link from 'next/link';

export default function SolutionsConsumers() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🛒 For Consumers</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">🛍️</div>
            <h3 className="text-xl font-semibold mb-2">Product Catalog</h3>
            <p className="text-gray-600">Discover Ethiopian-made products</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2">Price Comparison</h3>
            <p className="text-gray-600">Compare local vs imported prices</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="text-xl font-semibold mb-2">Direct Delivery</h3>
            <p className="text-gray-600">Get products delivered to your door</p>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/auth/register?role=consumer" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
            Join as a Consumer
          </Link>
        </div>
      </div>
    </div>
  );
}
