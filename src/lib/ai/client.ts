export async function callAI(type: string, input: any) {
  const res = await fetch("/api/ai", {
    method: "POST",
    body: JSON.stringify({ type, input }),
  });

  return res.json();
}
