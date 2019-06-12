const express = require("express");
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const methodOverride = require('method-override');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({keys:["something"]}))
app.use(methodOverride('_method'))

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
  for (const key in users) {
    if (email === users[key].email) {
      return true;
    }
  }
  return false;
};

const passwordExists = (email, password) => {
  for (const key in users) {
    if (users[key].email === email && bcrypt.compareSync(password, users[key].password)) {
      return users[key].id;
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

// ############ GETS ############
// Index page
app.get("/urls", (req, res) => {
  let userID = null;
  if (req.session.user_id) {
    if (users[req.session.user_id]) {
      userID = req.session.user_id;       // Checks user against users database - extra secruity
    } else {
      userID = null;
    }
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

// Create new URL page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    userID: users[req.session.user_id]
  }
  res.render("urls_new", templateVars);
});

// Registration page
app.get("/register", (req, res) => {
  const templateVars = {
    userID: users[req.session.user_id]
  }
  res.render("register", templateVars);
});

// Login page
app.get("/login", (req, res) => {
  const templateVars = {
    userID: users[req.session.user_id]
  }
  res.render("login", templateVars);
});

// Individual URL page
app.get("/urls/:shortURL", (req, res) => {
  const userCookie = req.session.user_id;
  if (urlDatabase[req.params.shortURL]){
    if (userCookie === urlDatabase[req.params.shortURL].userID) {
      const templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        userID: users[req.session.user_id]
      };
      if (templateVars.longURL) {
        res.render("urls_show", templateVars);
      } else {
        res.redirect("/urls");
      }
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
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


// ############ POSTS ############
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
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

// Generate random string for new URL's
app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  res.redirect("/urls");
});

// Edit a link
app.put("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newurl;
  const shortURL = req.params.shortURL;
  const userCookie = req.session.user_id;
  if (isCurrentUser(userCookie)) {
    if (newURL) {
      urlDatabase[shortURL].longURL = newURL;
    }
  } else {
    res.sendStatus(403);
  }
  res.redirect(`/urls/${shortURL}`);
});

// Delete a link
app.delete("/urls/:shortURL", (req, res) => {
  const userCookie = req.session.user_id;
  if (isCurrentUser(userCookie)) {
    delete urlDatabase[req.params.shortURL];
  } else {
    res.sendStatus(403);
  }
  res.redirect("/urls");
});


// Catchall
app.get("*", (req, res) => {
  res.redirect("/urls");
});
