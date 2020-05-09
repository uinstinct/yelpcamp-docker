const campGround=require("../models/campground"),
	  Comment=require("../models/comments");


var middlewareObject = {};

middlewareObject.isLoggedIn=function(req, res, next){
	if (req.isAuthenticated()) {next()}
	else 
		{
			req.flash("mishap","Please login to continue");
			res.redirect("/login");
		}
}

middlewareObject.checkCampgroundOwnership=function(req,res,next)
{
	if (req.isAuthenticated()) {
		campGround.findOne({slug:req.params.slug},function(error,foundcampground){
			if (error) {req.flash("error",error.message);res.redirect("/campgrounds")}
			else{
				if (req.user._id.equals(foundcampground.author.id) || req.user.isAdmin) {req.flash("success","Updated!");next();}
				else{req.flash("mishap","You must have created the campground to do that");res.redirect("back");}
			}
		})
	}else{req.flash("mishap","You must be loggedin to do that");res.redirect("/login")}
}

middlewareObject.checkCommentOwnership=function(req,res,next)
{
	if (req.isAuthenticated()) {

		Comment.findById(req.params.comment_id,function(error,foundcomment){
			if (error) {req.flash("error","comment not found");res.redirect("back")}
			else{
				if (req.user._id.equals(foundcomment.author.id) || req.user.isAdmin) {next();}
				else
					{req.flash("mishap","You must have created the comment to do that");res.redirect("back")}
			}
		})
	}
	else
		{
			req.flash("mishap","You must be loggedin to do that");
			res.redirect("back")
		}
}

module.exports = middlewareObject;