self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Ankur";
  const options = {
    body:  data.body,
    icon:  "/icon-192.png",
    badge: "/icon-192.png",
    data:  { url: data.url ?? "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const candidate = event.notification.data?.url;
  const path = typeof candidate === "string" && candidate.startsWith("/") &&
    !candidate.startsWith("//") && !/[\\\u0000-\u001f\u007f]/.test(candidate) ? candidate : "/";
  const url = new URL(path, self.location.origin);
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          client.navigate(url.href);
          return client.focus();
        }
      }
      return clients.openWindow(url.href);
    })
  );
});
