export default function SchedulePreview() {
  const items = [
    { time: "10:00", title: "Park" },
    { time: "11:30", title: "Nap" },
  ];

  return (
    <div className="border p-4 rounded-xl">
      <h3 className="font-semibold mb-2">Today's Schedule</h3>
      {items.map((i) => (
        <div key={i.time} className="text-sm flex justify-between">
          <span>{i.time}</span>
          <span>{i.title}</span>
        </div>
      ))}
    </div>
  );
}
