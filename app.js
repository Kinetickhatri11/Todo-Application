const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => console.log("Server Running"));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
};

initializeDbAndServer();

//API 1

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasSearch_q = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

app.get("/todos/", async (request, response) => {
  const queryPara = request.query;
  const { search_q = "", priority, status } = queryPara;
  let query = "";
  switch (true) {
    case hasStatus(queryPara):
      query = `SELECT * FROM TODO
          WHERE TODO LIKE '%${search_q}%' 
          AND STATUS='${status}';`;
      break;
    case hasPriority(queryPara):
      query = `SELECT * FROM TODO
          WHERE TODO LIKE '%${search_q}%' 
          AND priority='${priority}';`;
      break;
    case hasStatusAndPriority(queryPara):
      query = `SELECT * FROM TODO
          WHERE TODO LIKE '%${search_q}%' 
          AND STATUS='${status}'
          AND PRIORITY='${priority}';`;
      break;
    case hasSearch_q(queryPara):
      query = `SELECT * FROM TODO 
        WHERE TODO LIKE '%${search_q}%';`;
      break;
  }
  console.log(query);
  const result = await db.all(query);
  response.send(result);
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    SELECT * FROM TODO
    WHERE ID=${todoId};`;
  const result = await db.get(query);
  response.send(result);
});

//API 3
app.use(express.json());
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;

  const query = `
    insert INTO TODO(id,TODO,PRIORITY,STATUS) VALUES(
        ${id},'${todo}','${priority}','${status}'
    );`;

  const result = await db.run(query);
  response.send("Todo Successfully Added");
});

//API 4

app.use(express.json());
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
    SELECT * FROM TODO
    WHERE ID=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateQuery = `
    UPDATE TODO
    SET TODO='${todo}',
    PRIORITY='${priority}',
    STATUS='${status}';`;
  const update = await db.run(updateQuery);

  response.send(`${updateColumn} Updated`);
});

//API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    DELETE FROM TODO
    WHERE ID=${todoId};`;

  const result = await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
