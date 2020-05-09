var mongoose = require('mongoose');

var campgroundSchema = new mongoose.Schema({
	name: {type:String,
		required:"Campground name cannot be blank"},
	slug:{
		type:String,
		unique:true
	},
	img : String,
	description: String,
	cost: Number,
	likes: [
	{
		type:mongoose.Schema.Types.ObjectId,
		ref:'User'
	}
	],
	createdAt: {type: Date, default: Date.now},
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		},
		username:String
	},
	comments:[
	{
		type:mongoose.Schema.Types.ObjectId,
		ref:"Comment"
	}]
});

campgroundSchema.pre('save',async function(next){
	try{
		if (this.isNew || this.isModified('name')) {
			this.slug=await generateUniqueSlug(this._id,this.name)
		}
		next();
	}catch(error){
		next(error)
	}
});


var campGround=mongoose.model("campGround",campgroundSchema);
module.exports=campGround

async function generateUniqueSlug(id,campgroundname,slug)
{
	try{
		if (!slug) {slug=slugify(campgroundname)}
		var campground=await campGround.findOne({slug:slug});
	//if there is no campground with the above slug or if the  name has not been edited
	if (!campground || campground._id.equals(id)) {return slug}
	var newslug=slugify(campgroundname);
	return await generateUniqueSlug(id,campgroundname,newslug);
	}catch(error){
		throw new Error(error);
	}
}
function slugify(text) {
    var slug = text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '')          // Trim - from end of text
      .substring(0, 75);           // Trim at 75 characters
    return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}