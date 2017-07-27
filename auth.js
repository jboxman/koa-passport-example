const passport = require('koa-passport')

const userStore = (function() {
  const state = {}

  function fetchUser(id) {
    return new Promise((fulfill, reject) => {
      if(state[id]) {
        return fulfill(state[id])
      }
      else {
        return fulfill({id})
      }
      //reject(new Error('Not found'))
    })
  }

  function saveUser(user) {
    state[user.id] = Object.assign({}, user)
  }

  return {
    fetchUser,
    saveUser
  }
})()

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(async function(id, done) {
  try {
    const user = await userStore.fetchUser(id)
    done(null, user)
  } catch(err) {
    done(err)
  }
})

const LocalStrategy = require('passport-local').Strategy
passport.use(new LocalStrategy(function(username, password, done) {
  fetchUser()
    .then(user => {
      if (username === user.username && password === user.password) {
        done(null, user)
      } else {
        done(null, false)
      }
    })
    .catch(err => done(err))
}))

const GitHubStrategy = require('passport-github2').Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    userStore.saveUser(profile)
    done(null, profile)
  }
))
