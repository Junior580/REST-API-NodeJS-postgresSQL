const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const PORT = 3000;

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    console.log("Olá Mundo");
});

app.get("/users", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users;");
        return res.status(200).json(rows);
    } catch (error) {
        return res.status(400).json(error);
    }
});

app.post("/session", async (req, res) => {
    const { userName } = req.body;
    let user = "";
    try {
        user = await pool.query("SELECT * FROM users WHERE user_name=($1)", [
            userName,
        ]);
        if (!user.rows[0]) {
            user = await pool.query(
                "INSERT INTO users(user_name) VALUES ($1) RETURNING *",
                [userName]
            );
        }

        return res.status(200).json(user.rows);
    } catch (error) {
        return res.status(400).json(error);
    }
});

app.post("/todo/:user_id", async (req, res) => {
    const { description, done } = req.body;
    const { user_id } = req.params;
    try {
        const newTodo = await pool.query(
            "INSERT INTO todos (todo_description, todo_done, user_id) VALUES ($1,$2,$3) RETURNING *",
            [description, done, user_id]
        );
        return res.status(201).json(newTodo.rows);
    } catch (error) {
        return res.status(400).json(error);
    }
});

app.get("/todo/:user_id", async (req, res) => {
    const { user_id } = req.params;
    try {
        const allTodos = await pool.query(
            "SELECT * FROM todos WHERE user_id = ($1)",
            [user_id]
        );
        return res.status(201).json(allTodos.rows);
    } catch (error) {
        return res.status(400).json(error);
    }
});

app.patch("/todos/:user_id/:todo_id/", async (req, res) => {
    const { todo_id, user_id } = req.params;
    const data = req.body;
    try {
        const belongsToUser = await pool.query(
            "SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)",
            [user_id, todo_id]
        );
        if (!belongsToUser.rows[0]) {
            return res.status(400).json({ error: "Operation not allowed" });
        }
        const updateTodo = await pool.query(
            "UPDATE todos SET todo_description = ($1),todo_done=($2) WHERE todo_id = ($3) RETURNING * ",
            [data.description, data.done, todo_id]
        );
        return res.status(201).json(updateTodo.rows);
    } catch (error) {
        return res.status(400).json(error);
    }
});

app.delete("/todo/:user_id/:todo_id/", async (req, res) => {
    const { user_id, todo_id } = req.params;
    try {
        const belongsToUser = await pool.query(
            "SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)",
            [user_id, todo_id]
        );

        if (!belongsToUser.rows[0]) {
            return res.status(400).json({ error: "Operation not allowed" });
        }
        const deletedTodo = await pool.query(
            "DELETE FROM todos WHERE todo_id = ($1) RETURNING *",
            [todo_id]
        );
        return res
            .status(200)
            .json({ msg: "todo sucessfully deleted", deletedTodo });
    } catch (error) {
        return res.status(400).json(error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
