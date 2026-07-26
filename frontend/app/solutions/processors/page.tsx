import Link from 'next/link';

export default function SolutionsProcessors() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🏭 For Processors</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="text-xl font-semibold mb-2">Factory Feasibility</h3>
            <p className="text-gray-600">Assess if crops can be processed locally</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-xl font-semibold mb-2">Quality Control AI</h3>
            <p className="text-gray-600">Automatic grading to export standards</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">🔧</div>
            <h3 className="text-xl font-semibold mb-2">Equipment Sourcing</h3>
            <p className="text-gray-600">Find and buy processing equipment</p>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/auth/register?role=processor" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Join as a Processor
          </Link>
        </div>
      </div>
    </div>
  );
}
