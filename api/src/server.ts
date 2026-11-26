// Démarre le serveur HTTP
import { createApp } from "./app.js";
import { container } from "./container.js";

const app = createApp(container);

app.listen(container.config.PORT, () => {
  console.log("API sur http://localhost:" + container.config.PORT);
});
