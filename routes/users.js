import express from 'express';
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  const session = req.session;
  if (session.isAuthenticated) {
    res.type("txt").send(`
      Name: ${session.account.name},
      Username: ${session.account.username}
    `);
  } else {
    res.send('You are not logged in');
  }
});

router.post("/login", function(req, res, next) {
  //check username and password
  if(req.body.username == "bta" && req.body.password == "asdf"){
    let session = req.session;
    session.userId = "bta";
    res.send("you logged in");
  } else{
    //not start session
    res.send("wrong login info");
  }
});

router.post("/logout", function(req, res, next) {
  req.session.destroy();
  res.send("You logged out");
});

export default router;
