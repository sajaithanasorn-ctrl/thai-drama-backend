import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { pool } from "./db.js";

// Initializing the express app
const app = express();
app.use(express.json()); // read JSON request body -> req.body
app.use(cors()); // allow the Vue frontend (localhost:5173) to call this API

// ---------- Helpers ----------

// Check the fields sent by the client.
// Returns an error message (string) if something is wrong, otherwise null.
function validateDrama(body: any, titleRequired: boolean): string | null {
  if (titleRequired && body.title === undefined) {
    return "title is required";
  }
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return "title must be a non-empty string";
    }
    if (body.title.length > 100) {
      return "title must be at most 100 characters";
    }
  }
  if (body.channel !== undefined && body.channel !== null) {
    if (typeof body.channel !== "string" || body.channel.length > 50) {
      return "channel must be a string of at most 50 characters";
    }
  }
  if (body.episodes !== undefined && body.episodes !== null) {
    if (!Number.isInteger(body.episodes) || body.episodes < 1) {
      return "episodes must be a whole number greater than 0";
    }
  }
  if (body.watched !== undefined && typeof body.watched !== "boolean") {
    return "watched must be true or false";
  }
  return null;
}

// Turn "" (empty text) into null so the database stores NULL
function emptyToNull(value: unknown) {
  if (typeof value === "string" && value.trim() === "") return null;
  return value ?? null;
}

// ---------- Routes ----------

app.get("/", (req, res) => {
  res.json({ message: "Thai Drama Watchlist API is running" });
});

// READ (all) : GET /dramas  or  GET /dramas?watched=true|false
app.get("/dramas", async (req, res) => {
  try {
    const watched = req.query.watched;

    if (watched === undefined) {
      const query = await pool.query("SELECT * FROM dramas ORDER BY id;");
      res.json(query.rows);
    } else if (watched === "true" || watched === "false") {
      const query = await pool.query(
        "SELECT * FROM dramas WHERE watched = $1 ORDER BY id;",
        [watched === "true"],
      );
      res.json(query.rows);
    } else {
      res.status(400).json({
        error: "Invalid query parameter. Use 'watched=true' or 'watched=false'",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// READ (one) : GET /dramas/:id
app.get("/dramas/:id", async (req, res) => {
  try {
    const dramaId = Number(req.params.id);
    if (!Number.isInteger(dramaId)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }

    const query = await pool.query("SELECT * FROM dramas WHERE id = $1;", [
      dramaId,
    ]);

    if (query.rows.length > 0) {
      res.json(query.rows[0]);
    } else {
      res.status(404).json({ error: "Drama not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// CREATE : POST /dramas   body: { title, channel?, episodes? }
app.post("/dramas", async (req, res) => {
  try {
    const body = req.body ?? {};
    const error = validateDrama(body, true);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const query = await pool.query(
      "INSERT INTO dramas (title, channel, episodes) VALUES ($1, $2, $3) RETURNING *;",
      [body.title.trim(), emptyToNull(body.channel), emptyToNull(body.episodes)],
    );
    res.status(201).json(query.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATE (replace) : PUT /dramas/:id   body: { title, channel?, episodes? }
app.put("/dramas/:id", async (req, res) => {
  try {
    const dramaId = Number(req.params.id);
    if (!Number.isInteger(dramaId)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }

    const body = req.body ?? {};
    const error = validateDrama(body, true);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const query = await pool.query(
      "UPDATE dramas SET title = $1, channel = $2, episodes = $3 WHERE id = $4 RETURNING *;",
      [
        body.title.trim(),
        emptyToNull(body.channel),
        emptyToNull(body.episodes),
        dramaId,
      ],
    );

    if (query.rows.length > 0) {
      res.json(query.rows[0]);
    } else {
      res.status(404).json({ error: "Drama not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATE (partial) : PATCH /dramas/:id   body: any of { title, channel, episodes, watched }
app.patch("/dramas/:id", async (req, res) => {
  try {
    const dramaId = Number(req.params.id);
    if (!Number.isInteger(dramaId)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }

    const body = req.body ?? {};
    const error = validateDrama(body, false);
    if (error) {
      res.status(400).json({ error });
      return;
    }
    if (
      body.title === undefined &&
      body.channel === undefined &&
      body.episodes === undefined &&
      body.watched === undefined
    ) {
      res.status(400).json({ error: "Send at least one field to update" });
      return;
    }

    // COALESCE($1, title) = use the new value, or keep the old one if it is NULL
    const query = await pool.query(
      `UPDATE dramas
       SET title = COALESCE($1, title),
           channel = COALESCE($2, channel),
           episodes = COALESCE($3, episodes),
           watched = COALESCE($4, watched)
       WHERE id = $5
       RETURNING *;`,
      [
        body.title?.trim() ?? null,
        emptyToNull(body.channel),
        emptyToNull(body.episodes),
        body.watched ?? null,
        dramaId,
      ],
    );

    if (query.rows.length > 0) {
      res.json(query.rows[0]);
    } else {
      res.status(404).json({ error: "Drama not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE : DELETE /dramas/:id
app.delete("/dramas/:id", async (req, res) => {
  try {
    const dramaId = Number(req.params.id);
    if (!Number.isInteger(dramaId)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }

    const query = await pool.query(
      "DELETE FROM dramas WHERE id = $1 RETURNING *;",
      [dramaId],
    );

    if (query.rows.length > 0) {
      res.status(200).json({ message: "Drama deleted successfully" });
    } else {
      res.status(404).json({ error: "Drama not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Broken JSON in the request body -> 400 (instead of a default HTML error page)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: "Request body is not valid JSON" });
  } else {
    next(err);
  }
});

// Running app
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
