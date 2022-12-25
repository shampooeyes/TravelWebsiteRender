const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const path = require("path");
const MongoClient = require("mongodb").MongoClient;

const app = express();

const PORT = process.env.PORT || 3000;

// your code

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
function generateSessionSecret() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

app.use(
  sessions({
    secret: generateSessionSecret(),
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static(__dirname));

// cookie parser middleware
app.use(cookieParser());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const locations = ["Annapurna", "Bali", "Inca", "Paris", "Rome", "Santorini"];

app.get("/", function (req, res) {
  res.render("login", { regMsg: "", error: "" });
});

app.get("/login", function (req, res) {
  res.render("login", { regMsg: "", error: "" });
});

app.post("/login", function (req, res) {
  let u = req.body.username;
  let p = req.body.password;
  let found = false;
  if ((u.length == 0) | (p.length == 0)) {
    res.render("/login", { regMsg: "", error: "please fill in all fields" });
  } else {
    if (u == "admin" && p == "admin") {
      req.session.userid = u;
      res.render("home");
    } else {
      MongoClient.connect(
        "mongodb://localhost:27017",
        function (error, client) {
          if (error) throw error;
          const db = client.db("TravelWebsite");

          db.collection("Collection 1")
            .find()
            .toArray(function (err, results) {
              results.forEach((user) => {
                if (user.username == u) {
                  found = true;
                  if (user.password != p) {
                    res.render("login", {
                      regMsg: "",
                      error: "incorrect password",
                    });
                  } else {
                    //session
                    req.session.userid = u;
                    res.render("home");
                  }
                }
              });
              if (!found) {
                res.render("login", {
                  regMsg: "",
                  error: "username not found",
                });
              }
            });
        }
      );
    }
  }
})

app.get("/registration", function (req, res) {
  res.render("registration", { error: "" });
});

app.post("/register", function (req, res) {
  let u = req.body.username;
  let p = req.body.password;
  let e = "";
  if ((u.length == 0) | (p.length == 0)) {
    res.render("registration", { error: "please fill in all fields" });
  } else {
    MongoClient.connect("mongodb://localhost:27017", function (error, client) {
      if (error) throw error;
      const db = client.db("TravelWebsite");

      db.collection("Collection 1")
        .find()
        .toArray(function (err, results) {
          results.forEach((user) => {
            if (user.username == u) {
              e = true;
            }
          });
          if (e) {
            res.render("registration", { error: "username taken" });
          } else {
            MongoClient.connect(
              "mongodb://localhost:27017",
              function (error, client) {
                if (error) throw error;
                const db = client.db("TravelWebsite");
                db.collection("Collection 1").insertOne({
                  username: u,
                  password: p,
                  wanttogo: [],
                });
              }
            );
            res.render("login", {
              regMsg: "registration successful",
              error: "",
            });
          }
        });
    });
  }
});

app.get("/hiking", function (req, res) {
  if (isLoggedIn(req, res)) res.render("hiking");
});

app.get("/inca", function (req, res) {
  if (isLoggedIn(req, res)) getWishList("inca", req, res);
});

app.post("/inca", function (req, res) {
  if (isLoggedIn(req, res)) insert("inca", req, res);
});

app.get("/annapurna", function (req, res) {
  if (isLoggedIn(req, res)) getWishList("annapurna", req, res);
});

app.post("/annapurna", function (req, res) {
  if (isLoggedIn(req, res)) insert("annapurna", req, res);
});

app.get("/cities", function (req, res) {
  if (isLoggedIn(req, res)) res.render("cities");
});

app.get("/paris", function (req, res) {
  if (isLoggedIn(req, res)) getWishList("paris", req, res);
});

app.post("/paris", function (req, res) {
  if (isLoggedIn(req, res)) insert("paris", req, res);
});

app.get("/rome", function (req, res) {
  if (isLoggedIn(req, res)) getWishList("rome", req, res);
});

app.post("/rome", function (req, res) {
  if (isLoggedIn(req, res)) insert("rome", req, res);
});

app.get("/islands", function (req, res) {
  if (isLoggedIn(req, res)) res.render("islands");
});

app.get("/bali", function (req, res) {
  if (isLoggedIn(req, res)) getWishList("bali", req, res);
});

app.post("/bali", function (req, res) {
  if (isLoggedIn(req, res)) insert("bali", req, res);
});

app.get("/santorini", function (req, res) {
  if (isLoggedIn(req, res)) getWishList("santorini", req, res);
});

app.post("/santorini", function (req, res) {
  if (isLoggedIn(req, res)) insert("santorini", req, res);
});

app.get("/home", function (req, res) {
  if (isLoggedIn(req, res)) res.render("home");
});

app.post("/search", function (req, res) {
  if (isLoggedIn(req, res)) {
    const searchWord = req.body.Search;
    const results = [];
    if (searchWord != "") {
      locations.forEach(function (element) {
        if (element.toLowerCase().includes(searchWord.toLowerCase()))
          results.push(element);
      });
    }
    res.render("searchresults", { results: results });
  }
});

app.get("/searchresults", function (req, res) {
  if (isLoggedIn(req, res)) res.render("searchresults");
});

app.get("/wanttogo", function (req, res) {
  if (isLoggedIn(req, res)) {
    MongoClient.connect("mongodb://localhost:27017", function (error, client) {
      if (error) throw error;
      const db = client.db("TravelWebsite");
      let wishlist = [];

      db.collection("Collection 1")
        .find()
        .toArray(function (err, results) {
          results.forEach((user) => {
            if (user.username == getCurrentUsername(req)) {
              wishlist = user.wanttogo;
            }
          });
          res.render("wanttogo", { results: wishlist });
        });
    });
  }
});

function getCurrentUsername(req) {
  return req.session.userid;
}

function getWishList(value, req, res) {
  MongoClient.connect("mongodb://localhost:27017", function (error, client) {
    if (error) throw error;
    const db = client.db("TravelWebsite");
    let wishlist = [];

    db.collection("Collection 1")
      .find()
      .toArray(function (err, results) {
        results.forEach((user) => {
          if (user.username == getCurrentUsername(req)) {
            wishlist = user.wanttogo;
          }
        });
        res.render(value, { list: wishlist, error: false });
      });
  });
}

function insert(value, req, res) {
  MongoClient.connect("mongodb://localhost:27017", function (error, client) {
    if (error) throw error;
    const db = client.db("TravelWebsite");
    let wishlist = [];
    let e = false;
    let thisUser;

    db.collection("Collection 1")
      .find()
      .toArray(function (err, results) {
        results.forEach((user) => {
          if (user.username == getCurrentUsername(req)) {
            thisUser = user;
            user.wanttogo.forEach((place) => {
              if (place == value) {
                e = true;
              }
            });
          }
        });
        if (!e) {
          let newList = thisUser.wanttogo;
          newList.push(value);
          db.collection("Collection 1").updateOne(
            { username: thisUser.username },
            { $set: { wanttogo: thisUser.wanttogo } }
          );
        }
        res.render(value, { error: e });
      });
  });
}

function isLoggedIn(req, res) {
  let session = req.session;
  if (!session.userid) {
    res.render("login", {
      regMsg: "",
      error: "please login first",
    });
    return false;
  }
  return true;
}