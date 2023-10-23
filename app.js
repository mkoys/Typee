import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const port = 3000;
const app = express();

app.use(morgan("tiny"));
app.use(helmet());
app.use(cors());
app.use(express.static("source"));

app.listen(port, () => console.log(`Running on http://localhost:${port}`));
