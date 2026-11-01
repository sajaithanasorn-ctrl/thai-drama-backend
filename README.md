# Thai Drama Watchlist — Backend

Express.js + TypeScript + PostgreSQL (Docker) REST API.

## Setup
1. Start PostgreSQL with Docker
   `docker run -d --name my-postgres -e POSTGRES_PASSWORD=1234 -v pgdata:/var/lib/postgresql -p 5432:5432 postgres:latest`
2. In DBeaver run `db/01_create_database.sql`, then connect to `drama_db` and run `db/02_create_table.sql`
3. `cp .env.example .env` (change the password if you changed it in Docker)
4. `pnpm i` then `pnpm run dev` → http://localhost:3000

## Endpoints
| Method | Path | Purpose | Success | Errors |
|---|---|---|---|---|
| GET | /dramas | list all (`?watched=true/false` to filter) | 200 | 400, 500 |
| GET | /dramas/:id | get one | 200 | 400, 404, 500 |
| POST | /dramas | create `{title, channel?, episodes?}` | 201 | 400, 500 |
| PUT | /dramas/:id | replace `{title, channel?, episodes?}` | 200 | 400, 404, 500 |
| PATCH | /dramas/:id | partial update (e.g. `{watched:true}`) | 200 | 400, 404, 500 |
| DELETE | /dramas/:id | delete | 200 | 400, 404, 500 |
