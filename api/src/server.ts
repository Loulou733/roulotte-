//demarre le serveur HTTP
import express from "express";
const app = express();
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.listen(3000, () => {
  console.log("API sur http://localhost:3000");
});