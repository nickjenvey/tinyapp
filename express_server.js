const express = require("express");
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({keys:["something"]}))

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "z39bw4"
  },
  "9sm5xK": {
     longURL: "http://www.google.com",
     userID: "b6UTxQ"
  }
};

const users = {
  "z39bw4": {
    id: "z39bw4",
    email: "user1@test.com",
    password: bcrypt.hashSync("123", 10)
  },
  "b6UTxQ": {
    id: "b6UTxQ",
    email: "user2@test.com",
    password: bcrypt.hashSync("456", 10)
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
    if (users[user].email === email && bcrypt.compareSync(password, users[user].password)); {
      return users[user].id;
    }
  }
  return false;
}

const isCurrentUser = (userID) => {
  for (const key in urlDatabase) {
    if (userID === urlDatabase[key].userID) {
      return true;
    }
  }
  return false;
}

const generateRandomString = () => Math.random().toString(36).replace("0.", "").substr(0, 6);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// ----------POSTS----------
// Login handler
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = passwordExists(email, password);
  if (!userID) {
    res.sendStatus(403);
  } else {
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

// Delete the cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Registration handler
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email && password) {
    res.sendStatus(400);
  } else if (emailExists(email)) {
    res.sendStatus(400);
  } else {
    const newUser = {
      id: userID,
      email,
      password: hashedPassword
    }
    users[userID] = newUser;
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
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
  const userCookie = req.session.user_id;
  if (isCurrentUser(userCookie)) {
    if (newURL) {
      urlDatabase[shortURL] = newURL;
    }
  } else {
    res.sendStatus(403);
  }
  res.redirect(`/urls/${shortURL}`);
});

// Delete a link
app.post("/urls/:shortURL/delete", (req, res) => {
  const userCookie = req.session.user_id;
  if (isCurrentUser(userCookie)) {
    delete urlDatabase[req.params.shortURL];
  } else {
    res.sendStatus(403);
  }
  res.redirect("/urls");
});


// ----------GETS----------
// Create new URL page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    userID: req.session.user_id
  }
  res.render("urls_new", templateVars);
});

// Registration page
app.get("/register", (req, res) => {
  const templateVars = {
    userID: req.session.user_id
  }
  res.render("register", templateVars);
});

// Login page
app.get("/login", (req, res) => {
  const templateVars = {
    userID: req.session.user_id
  }
  res.render("login", templateVars);
});

// Access individual URL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userID: req.session.user_id
  };
  if (templateVars.longURL) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/urls");
  }
});

// Shorter notation + redirect to actual URL
app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (url) {
    res.redirect(url.longURL);
  } else {
    res.sendStatus(404);
  }
});

// Index page
app.get("/urls", (req, res) => {
  const userCookie = req.session.user_id;
  let userID = "";
  if(userCookie) {
    userID = users[userCookie].id;
  }
  const usersUrls = [];
  if (userID) {
    for (const key in urlDatabase) {
      if (userID === urlDatabase[key].userID) {
        usersUrls.push( {shortURL: key, longURL: urlDatabase[key].longURL} );
      }
    }
  }
  const templateVars = {
    urls: usersUrls,
    userID: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Catchall
app.get("*", (req, res) => {
  res.redirect("/urls");
});