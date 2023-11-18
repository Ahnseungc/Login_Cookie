const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();

const db = new Map();
//KEY=VALUE 형태로 브라우저에 저장되는 쿠키의 KEY
const USER_COOKIE_KEY = "USER";

app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
  console.log("server is running at 3000");
});

///회원정보 JSON 저장
const fs = require("fs").promises;
const USER_JSON_FILENAME = "user.json";

async function fetchAllUsers() {
  const data = await fs.readFile(USER_JSON_FILENAME);
  const users = JSON.parse(data.toString());
  return users;
}

async function fetchUser(username) {
  const users = await fetchAllUsers();
  const user = users.find((user) => user.username === username);
  return user;
}

async function createUser(newUser) {
  const users = await fetchAllUsers();
  users.push(newUser);
  await fs.writeFile(USER_JSON_FILENAME, JSON.stringify(users));
}

app.post("/signup", async (req, res) => {
  const { username, name, password } = req.body;
  const user1 = await fetchUser(username);

  if (user1) {
    res.status(400).send(`duplicate username: ${username}`);
    return;
  }

  const newUser = {
    username,
    name,
    password,
  };

  await createUser({
    username,
    name,
    password,
  });

  res.cookie(USER_COOKIE_KEY, JSON.stringify(newUser));
  res.redirect("/");
});

app.get("/", async (req, res) => {
  const user = req.cookies[USER_COOKIE_KEY];

  if (user) {
    const userData = JSON.parse(user);
    const user1 = await fetchUser(userData.username);

    if (db.get(userData.username)) {
      res.status(200).send(
        `
                <a href="/logout">Log Out</a>
                <h1>id: ${userData.username}, name: ${userData.name}, password: ${userData.password}</h1>
            `
      );
      return;
    }
  }

  res.status(200).send(
    `
        <a href="/login.html">Log In</a>
        <a href="/signup.html">Sign Up</a>
        <h1>Not Logged In</h1>
    `
  );
});

app.get("/logout", (req, res) => {
  res.clearCookie(USER_COOKIE_KEY);
  res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await fetchUser(username);

  if (!user) {
    res.status(400).send(`not registered username: ${username}`);
    return;
  }

  if (password !== user.password) {
    res.status(400).send(`incorrect password`);
    return;
  }

  res.cookie(USER_COOKIE_KEY, JSON.stringify(user));
  res.redirect("/");
});
