const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = () => Math.random().toString(36).replace('0.', '').substr(0, 6);

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Index Page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Create new URL page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Access individual URL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
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

// Catchall
app.get("*", (req, res) => {
  res.redirect("/urls");
});