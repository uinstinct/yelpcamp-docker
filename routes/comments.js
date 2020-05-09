const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  campGround=require("../models/campground"),
	  Comments=require("../models/comments"),
	  middleware=require("../middleware");


/*=========================
COMMENTS ROUTE
===========================*/


router.get("/new",middleware.isLoggedIn,function(req,res){
	campGround.findOne({slug:req.params.slug},function(error,campground){
		if (error) {res.send(error);}
		else{res.render("Comments/new",{campgrounds:campground})}
	})

})

router.post("/",middleware.isLoggedIn,function(req,res){
	campGround.findOne({slug:req.params.slug},function(error,campground){
		if (error) {res.send(error);}
		else{
			Comments.create(req.body.comment,function(error,comment){
				if (error) 
					{
						req.flash("error","error creating comment");
						res.render("Comments/new",{campgrounds:campground})
					}
				else
				{
					comment.author.id=req.user._id;
					comment.author.username=req.user.username;
					comment.save();
					campground.comments.push(comment);
					campground.save();
					res.redirect('/campgrounds/'+campground.slug);
				}
			})
		}
	})
})


//edit route

router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
	Comments.findById(req.params.comment_id,function(error,comment){
		if (error) {res.redirect("back")}
		else{res.render("Comments/edit",{campgrounds_slug:req.params.slug,comment:comment})}
	})
})

router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comments.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(error,comment){
		if (error) {req.flash("error","error while updating");res.redirect("back")}
		else{res.redirect("/campgrounds/"+req.params.slug)}
	})
})

//destroy route

router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comments.findByIdAndRemove(req.params.comment_id,function(error){
		if (error) {res.send("error while deleting comment")}
		else{req.flash("success","comment removed");res.redirect("/campgrounds/"+req.params.id)}
	})
})

module.exports = router;