import post from "@mkoys/post";

const app = post.application();

const port = 3000;

app.use(post.fileHandler("source"));

app.get("/", (_, res) => res.redirect("index.html"));

app.listen(port, () => console.log(`Running on http://localhost:${port}`));
