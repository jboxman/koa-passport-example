const Koa = require('koa')
const app = new Koa()

require('dotenv').config()

// trust proxy
app.proxy = true

// sessions
const session = require('koa-session')
app.keys = ['your-session-secret']
app.use(session({}, app))

// body parser
const bodyParser = require('koa-bodyparser')
app.use(bodyParser())

// authentication
require('./auth')
const passport = require('koa-passport')
app.use(passport.initialize())
app.use(passport.session())

// routes
const fs    = require('fs')
const route = require('koa-route')

const views = require('koa-views')
app.use(views(`${__dirname}/views`, {
  map: {
    html: 'ejs'
  }
}))

app.use(route.get('/', function(ctx) {
  ctx.type = 'html'
  ctx.body = fs.createReadStream('views/login.html')
}))

// POST /login
app.use(route.post('/login',
  passport.authenticate('local', {
    successRedirect: '/app',
    failureRedirect: '/'
  })
))

app.use(route.get('/logout', function(ctx) {
  ctx.logout()
  ctx.redirect('/')
}))

/*
  Upon success:
  ctx.state.user:       User object from passport.deserializeUser()
  ctx.session:          Session object
  ctx.session.passport: ID from passport.seralizeUser()
*/

app.use(route.get('/auth/github',
  passport.authenticate('github')
))

// Custom handler that returns the authenticated user object
app.use(route.get('/auth/github/callback', function(ctx) {
  return passport.authenticate('github', async function(err, user, info) {
    //ctx.type = 'json'
    //ctx.body = user
    await ctx.logIn(user)
    await ctx.render('success', {user: JSON.stringify(ctx.state.user)})
  })(ctx)
}))

/*
// Classic redirect behavior
app.use(route.get('/auth/github/callback',
  passport.authenticate('github', {
    successRedirect: '/app',
    failureRedirect: '/'
  })
))
*/

// Require authentication for now
app.use(function(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next()
  } else {
    ctx.redirect('/')
  }
})

app.use(route.get('/app', function(ctx) {
  ctx.type = 'html'
  ctx.body = fs.createReadStream('views/app.html')
}))

// start server
const port = process.env.PORT || 3000
app.listen(port, () => console.log('Server listening on', port))
