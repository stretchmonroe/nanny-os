export default function TodaySummary() {
  return (
    <div className="p-4 border rounded-xl">
      <h2 className="text-lg font-semibold">Today</h2>
      <p className="text-sm text-gray-600">Nap completed • Next: Snack</p>

      <div className="mt-2 text-sm">
        Mood: <span>🙂</span>
      </div>
    </div>
  );
}
