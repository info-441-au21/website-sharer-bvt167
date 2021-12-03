import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import sessions from 'express-session';
import MsIdExpress from 'microsoft-identity-express';

import indexRouter from './routes/index.js';
import apiv3Router from './routes/api/v3/apiv3.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { resolveSoa } from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ONE_DAY = 1000 * 60 * 60 * 24;

const appSettings = {
  appCredentials: {
    tenantId: "f6b6dd5b-f02f-441a-99a0-162ac5060bd2",
    clientId: "22e30f1e-5230-4c4f-a69f-a7438d9b10fd",
    clientSecret: "IyC7Q~Jc53oxjLM4ciDLZf7PsDlDAx_xAFn2x",
  },
  authRoutes: {
    redirect: "https://bta167.me/",
    error: "/error",
    unauthorized: "/unauthorized",
  }
}

const MS_ID = new MsIdExpress.WebAppAuthClientBuilder(appSettings).build()

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sessions({
  secret: "supersecret",
  saveUnintialized: true,
  cookie: { maxAge: ONE_DAY },
  resave: false,
}));
app.use(MS_ID.initialize());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v3', apiv3Router);

app.get('/signin',
  MS_ID.signIn({
    postLoginRedirect: "/",
  })
);

app.get('/signout',
  MS_ID.signOut({
    postLogoutRedirect: "/",
  })
);

app.get('/error', (req, res) => {
  res.status("500").send("Server Error");
});

app.get('unauthorized', (req, res) => {
  res.status("401").send("Permission Denied");
});

// // use this by going to urls like:
// // http://localhost:3000/fakelogin?name=anotheruser
// app.get('/fakelogin', (req, res) => {
//   let newName = req.query.name;
//   let session=req.session;
//   session.isAuthenticated = true;
//   if(!session.account){
//       session.account = {};
//   }
//   session.account.name = newName;
//   session.account.username = newName;
//   console.log("set session");
//   res.redirect("/api/v3/getIdentity");
// });

// // use this by going to a url like:
// // http://localhost:3000/fakelogout
// app.get('/fakelogout', (req, res) => {
//   let newName = req.query.name;
//   let session=req.session;
//   session.isAuthenticated = false;
//   session.account = {};
//   console.log("you have fake logged out");
//   res.redirect("/api/v3/getIdentity");
// });

export default app;
