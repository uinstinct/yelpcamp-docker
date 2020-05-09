const express = require('express'),
	  router  = express.Router(),
	  User = require("../models/user"),
	  passport=require("passport"),
	  async=require("async"),
	  nodemailer=require("nodemailer"),
	  crypto=require("crypto"),
	  {isLoggedIn}=require("../middleware"),
	  Notification=require("../models/notification");


router.get('/',function(req,res){
	res.render('homepage');
})


/*==========================
AUTHENTICATION ROUTES
============================*/

router.get("/register",function(req,res){
	res.render("User/register",{page:"register"});
})

router.post("/register",function(req,res){
	var newUser = new User(req.body);
	delete newUser.password;
	User.register(newUser,req.body.password,function(error,user){
		if(error)
			{
				req.flash("mishap",error.message);
				return res.render("User/register")
			}
			passport.authenticate("local")(req,res,function(){
			req.flash("success","Welcome to YelpCamp "+user.username)
			res.redirect("/campgrounds");
		});
	});
})

router.get("/login",function(req,res){
	res.render("User/login",{page:"login"});
})

router.post("/login",passport.authenticate("local",
{
	successRedirect: "/campgrounds",
	failureRedirect: "/login",
	successFlash:"Logged you in",
	failureFlash: true
}),function(req,res){});

router.get("/logout",function(req,res){
	req.logout();
	req.flash("loggedout","Successfully logged you out!")
	res.redirect("/campgrounds");
})

/*=========================
ADMIN ROLES
===========================*/

router.get("/newadmin",function(req,res){
	res.render("User/newAdmin");
})

router.post("/newadmin",function(req,res){

	if (req.body.admincode===process.env.ADMIN_CODE) {
		var newUser = new User(req.body);
		delete newUser.password;
		newUser.isAdmin=true;
		User.register(newUser,req.body.password,function(error,user){
			if(error)
				{
					req.flash("mishap",error.message);
					res.redirect("/newadmin")
				}
				passport.authenticate("local")(req,res,function(){
				req.flash("success","Welcome to YelpCamp "+user.username+" .... Admin")
				res.redirect("/campgrounds");
			});
		});
	}
	else{
		req.flash("mishap","Press enter the correct AdminCode");
		res.redirect("/newadmin")
	}
})

router.get("/admin",function(req,res){
	res.render("User/adminLogin",{page:"login"})
})

router.post("/admin",passport.authenticate("local",
{
	successRedirect: "/campgrounds",
	successFlash:"Welcome Admin",
	failureRedirect: "/admin",
	failureFlash:true
}),function(req,res){});


/*========================
NOTIFICATIONS ROUTE
==========================*/

//view all notifications

router.get('/notifications',isLoggedIn,async function(req,res){
	try{
		let user=await User.findById(req.user.id).populate({
			path:'notifications',
			options:{sort:{"_id":-1}}
		}).exec();
		let allNotifications=user.notifications;
		res.render("notifications",{allNotifications});
	}catch(error){
		req.flash("error",error.message)
		res.redirect("back")
	}
})

//handle notifications

router.get('/notifications/:id',isLoggedIn,async function(req,res){
	try{
		let notification=await Notification.findById(req.params.id);
		notification.isRead=true;
		notification.save()
		res.redirect("/campgrounds/"+notification.campgroundId)
	}
	catch(error){
		req.flash("error",error.message);
		res.redirect("back")
	}
})

module.exports=router;