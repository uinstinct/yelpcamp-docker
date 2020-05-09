const express = require("express"),
	  router = express.Router(),
	  campGround=require("../models/campground"),
	  middleware=require("../middleware"),
	  Notification=require("../models/notification"),
	  User=require("../models/user");

/*==================
CAMPGROUNDS ROUTE
====================*/
router.post('/',middleware.isLoggedIn,async function(req,res){

	var nameValue=req.body.name;
	var imageValue=req.body.imageURL;
	var desc=req.body.description;
	var cost=req.body.cost;
	var author={
		id:req.user.id,
		username:req.user.username
	}
	var newValue={name:nameValue , img: imageValue, description:desc, cost:cost,author:author};

	try{
		let campground=await campGround.create(newValue);
		let user=await User.findById(req.user.id).populate('followers').exec();
		let newNotification= {
			username:req.user.username,
			campgroundId:campground.slug
		}
		for(const follower of user.followers){
			let notification=await Notification.create(newNotification);
			follower.notifications.push(notification);
			follower.save();
		}
		res.redirect(`/campgrounds/${campground.slug}`);
	}catch(error)
	{
		req.flash("error",error.message);
		return res.redirect("back")
	}
})

//to do search while typing, AJAX is required
router.get('/',function(req,res){
	if (req.query.search) {
		const regex=new RegExp(escapeRegex(req.query.search),'gi');
		campGround.find({name:regex},function(error,foundcampground){
			if (error) {res.render('Campgrounds/index',{variableCampingGrounds:null,error:error.message})}
			if (foundcampground.length===0) {noMatch="No campgrounds matching the query found"}
			res.render("Campgrounds/index",{variableCampingGrounds:foundcampground, page:"campgrounds"})
		})
	}
	let perPage=8;
	let pageQuery=parseInt(req.query.page)
	let pageNumber=pageQuery?pageQuery:1;
	campGround.find({}).skip((perPage*(pageNumber-1))).limit(perPage).exec(function(error,variableCampingGrounds){
		campGround.countDocuments().exec(function(error,count){	
			if(error){res.render('Campgrounds/index',{variableCampingGrounds:null,error:error.message})}
			else{
				res.render('Campgrounds/index',{ variableCampingGrounds:variableCampingGrounds, 
					page:"campgrounds",
					current:pageNumber,
					pages:Math.ceil(count/perPage)});
			}
		})
	})
})

router.get('/new',middleware.isLoggedIn,function(req,res){
	res.render('Campgrounds/newPost');
})

router.get('/:slug',function(req,res){
	campGround.findOne({slug:req.params.slug}).populate("comments likes").exec(function(err,foundcampground){
		if(err){res.render("showDescription", {cmpground:foundcampground,error:"Campground not found"});}
		else{res.render("showDescription", {cmpground:foundcampground});}
	})
})

//edit routes

router.get("/:slug/edit",middleware.checkCampgroundOwnership,function(req,res){
	campGround.findOne({slug:req.params.slug},function(error,foundcampground){
		if (error) {req.flash("error","campground not found");res.redirect("/campgrounds");}
		else{res.render("Campgrounds/edit",{campground:foundcampground} )}
	})
})

router.put("/:slug",middleware.checkCampgroundOwnership,function(req,res){
	campGround.findOneAndUpdate({slug:req.params.slug},req.body.cmpground,function(error,foundcampground){
	if (error) {req.flash("error","not found campground");res.redirect("/campgrounds")}
	else{
		res.redirect("/campgrounds/"+foundcampground.slug)}
	})
})

//destroy route

router.delete("/:slug",middleware.checkCampgroundOwnership,function(req,res){
	campGround.findOneAndRemove({slug:req.params.slug} ,function(error){
		if (error) {req.flash("error","campground not found");res.redirect("/campgrounds/"+req.params.id)}
		else{req.flash("success","campground removed");res.redirect("/campgrounds");}
	})
})

/*================================
LIKES ROUTES
==================================*/

router.post('/:slug/like',middleware.isLoggedIn,function(req,res){
	campGround.findOne({slug:req.params.slug},function(error,foundcampground){
		if (error) {res.render("Campgrounds/index",{"error":error.message})}

		//check if req.user._id exists in foundcampground.likes
		var userGaveLike=foundcampground.likes.some(function(like){
			return like.equals(req.user._id)
		})
		if (userGaveLike) {foundcampground.likes.pull(req.user._id)}
		else{foundcampground.likes.push(req.user._id)}
		foundcampground.save()
		return res.redirect("/campgrounds/"+foundcampground.slug)
	})
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;