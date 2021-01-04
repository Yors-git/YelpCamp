let express = require("express"),
    router  = express.Router(),
    passport = require("passport"),
    dotenv = require('dotenv').config(),
    User     = require("../models/user"), 
    Campground = require("../models/campground"),
    async    = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto")
    

//root route
router.get("/", (req, res)=>{
    res.render("landing")
})

//show register form
router.get("/register", (req, res)=>{
    res.render("auth/register", {page: 'register'})
})

//handle sign up logic
router.post("/register", (req, res)=>{
    let newUser = new User(
        {
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email
        })
    if(req.body.adminCode === "secretcode123"){
        newUser.isAdmin = true
    }
    User.register(newUser, req.body.password, (err, user)=>{
        if(err){
            return res.render("auth/register", {"error": err.message})
        }
        passport.authenticate("local")(req, res, ()=>{
            req.flash("success", "Welcome to YelpCamp "+ user.username)
            res.redirect("/campgrounds")
        })
    })
})

//show login form
router.get("/login", (req, res)=>{
    res.render("auth/login", {page: 'login'})
})

//handle login logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true
    }),
        (req, res)=>{
})

//logout route
router.get("/logout", (req, res)=>{
    req.logout()
    req.flash("success", "Logged you out")
    res.redirect("/campgrounds")
})

// forgot password
router.get('/forgot', function(req, res) {
    res.render('users/forgot');
  });
  
router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'vale.torresb.82@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'vale.torresb.82@gmail.com',
          subject: 'Node.js Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });
  
router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('users/reset', {token: req.params.token});
    });
  });
  
router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'vale.torresb.82@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'learntocodeinfo@mail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/campgrounds');
    });
  });

//Users profiles
router.get("/users/:id", async(req, res)=>{
    try{
    let foundUser = await User.findById(req.params.id)
    let foundCampgrounds = await Campground.find().where("author.id").equals(foundUser.id)
    res.render("users/show", {user: foundUser, campgrounds: foundCampgrounds})
    } catch(err) {
        req.flash("error", "Something went wrong!")
        res.redirect("/")
    }
})

module.exports = router