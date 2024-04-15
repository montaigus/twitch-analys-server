import express from "express";
import cors from "cors";

const app = express();
const port = 3000;
const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
app.use(cors());

app.get("/", (req, res) => {
  res.send("Express on Vercel");
});

module.exports = app;
