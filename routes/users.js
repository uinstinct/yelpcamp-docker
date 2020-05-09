	  express = require('express'),
	  router  = express.Router(),
	  User = require("../models/user"),
	  passport=require("passport"),
	  async=require("async"),
	  nodemailer=require("nodemailer"),
	  crypto=require("crypto"),
	  campGround=require("../models/campground"),
	  middleware=require("../middleware/index")

//for nodemailer other services include sendgrid, sendpulse, godaddy


/*===========================
FORGOT ROUTES
=============================*/

router.get("/forgot",function(req,res){
	res.render("User/newPassword");
})

router.post("/forgot",function(req,res,next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20, function(error,buf){
				var token=buf.toString('hex')
				done(error,token)
			})
		},
		function(token,done){
			User.findOne({email:req.body.email},function(error,user){
				if (!user) {
					req.flash("error","No account with the email address exists.");
					return res.redirect("/forgot");
				}
				user.resetPasswordToken=token;
				user.resetPasswordExpires=Date.now() + 3600000;

				user.save(function(error){
					done(error,token,user);
				})
			})
		},
		function(token,user,done){
			var smtpTransport=nodemailer.createTransport({
				service:process.env.MAIL_SERVICE,
				auth:{
					user:process.env.MAIL_USER,
					pass:process.env.MAIL_PASSWORD
				}
			});
			var mailOptions = {
			        to: user.email,
			        from: process.env.MAIL_SERVICE,
			        subject: 'Node.js Password Reset',
			        html:'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
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

router.get("/reset/:token",function(req,res){
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('User/resetPassword', {token: req.params.token});
  });
})

router.post("/reset/:token",function(req,res){
 //async.waterfall executes the functions in the array in the written sequence. If any on the function returns an error, the next function is not executed
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
        service: process.env.MAIL_SERVICE, 
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.MAIL_USER,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        res.redirect("/campgrounds")
        done(err);
      });
    }
  ], function(err) {
  	req.flash("error",err.message)
    res.redirect('/campgrounds');
  });
});

/*=======================
USER PROFILE
=========================*/

router.get("/user/:id",function(req,res){
	// this is also possible in try catch block
	// let user = User.findById(req.params.id).populate('followers').exec();

	User.findById(req.params.id).populate('followers').exec(function(error,founduser){
		if (error) {req.flash("error",error.message);return res.redirect("back");}
		else{
			campGround.find().where('author.id').equals(founduser._id).exec(function(error,foundcampground){
				if (error) {req.flash("error",error.message);return res.redirect("back")}
				res.render("User/userprofile",{user:founduser,campgrounds:foundcampground})
			})
		}
	})
})


//follow user

router.post('/follow/:id',middleware.isLoggedIn, async function(req,res){
	try{
		let user=await User.findById(req.params.id)
		for(const follower of user.followers)
		{
			if (req.user.id==follower._id) {
				req.flash("mishap","You are already following "+user.username);
				return res.redirect("back");
			}
		}
		user.followers.push(req.user._id);// req.user is the person which is logged in
		user.save();
		req.flash('success','You followed '+user.username)
		res.redirect("/user/"+req.params.id);
	}catch(error){
		req.flash("error",error.message)
		res.redirect('back')
	}
})

module.exports=router;