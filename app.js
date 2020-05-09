require('dotenv').config();
const express = require('express');
const app=express();
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const passport=require("passport");
const LocalStrategy=require('passport-local');
const passportLocalMongoose=require("passport-local-mongoose");
var campGround=require("./models/campground");
var Comments=require("./models/comments");
const seedDB=require("./seeds");
var User=require("./models/user");
const methodOverride = require("method-override");
const flash= require('connect-flash');
const path=require('path');

/*=====================
REQUIRING ROUTES
=======================*/

var campgroundRoutes = require("./routes/campgrounds"),
    commentsRoutes = require("./routes/comments"),
    indexRoutes = require("./routes/index"),
    userRoutes=require("./routes/users");

/*===============
APP CONFIGURATION
=================*/

mongoose.set("useFindAndModify",false)
mongoose.set('useCreateIndex',true)
// seedDB();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine",'ejs');
app.use(express.static(path.resolve("./public")));
app.use(methodOverride("_method"));
app.use(flash());

mongoose.connect( "mongodb://mongo:27017" ,{useNewUrlParser : true, useUnifiedTopology: true});

app.locals.moment=require('moment');

/*=================
PASSPORT CONFIGURATION
===================*/

app.use(require("express-session")({
	secret: "this is the thing that needs to be a secret",
	resave: false,
	saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req,res,next){
	res.locals.currentUser=req.user;
	if (req.user) {
		try{
			let user=await User.findById(req.user._id).populate('notifications',null,{isRead:false}).exec()
			res.locals.notifications=user.notifications.reverse();
		}catch(error){
			console.log(error);
		}
	}
	res.locals.error=req.flash("error");
	res.locals.loggedout=req.flash("loggedout");
	res.locals.success=req.flash("success");
	res.locals.mishap=req.flash("mishap");
	next();
})

app.use("/",indexRoutes);
app.use("/",userRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:slug/comments",commentsRoutes);


app.listen( 8000,function(){
	console.log("YelpCamp Server Started ...");
})