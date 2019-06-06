const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = () => Math.random().toString(36).replace("0.", "").substr(0, 6);

const cookieParser = require("cookie-parser");
app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "z39bw4": {
    id: "z39bw4",
    email: "test@test.com",
    password: "123"
  }
};

const emailExists = (email) => {
  for (const user in users) {
    if (email === users[user].email) {
      return true;
    }
  }
  return false;
};

const passwordExists = (email, password) => {
  for (const user in users) {
    if (users[user].email === email && password === users[user].password) {
      return users[user].id;
    }
  }
  return false;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Login handler
app.post("/login", (req, res) => {
  const emailAddress = req.body.email;
  const pass = req.body.password;
  const userID = passwordExists(emailAddress, pass);
  if (!userID) {
    res.sendStatus(403);
  } else {
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});

// Delete the cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// Index page
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    userID: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

// Create new URL page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    userID: req.cookies["user_id"]
  }
  res.render("urls_new", templateVars);
});

// Registration page
app.get("/register", (req, res) => {
  const templateVars = {
    userID: req.cookies["user_id"]
  }
  res.render("register", templateVars);
});

// Login page
app.get("/login", (req, res) => {
  const templateVars = {
    userID: req.cookies["user_id"]
  }
  res.render("login", templateVars);
});

// Access individual URL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userID: req.cookies["user_id"]
  };
  if (templateVars.longURL) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/urls");
  }
});

// Shorter notation + redirect to actual URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Generate random string for new URL's
app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

// Edit a link
app.post("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newurl;
  const shortURL = req.params.shortURL;
  if (newURL) {
    urlDatabase[shortURL] = newURL;
  }
  res.redirect(`/urls/${shortURL}`);
});

// Delete a link
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Registration handler
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const emailAddress = req.body.email;
  const pass = req.body.password;
  if (!emailAddress && pass) {
    res.sendStatus(400);
  } else if (emailExists(emailAddress)) {
    res.sendStatus(400);
  } else {
    const newUser = {
      id: userID,
      email: emailAddress,
      password: pass,
    }
    users[userID] = newUser;
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});

// Catchall
app.get("*", (req, res) => {
  res.redirect("/urls");
});