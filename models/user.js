var mongoose =  require('mongoose'),
    passportLocalMongoose=require("passport-local-mongoose");

var UserSchema =  new mongoose.Schema({
	username: String,
	password: String,
	isAdmin: {type:Boolean, default: false},
	email: {type: String, unique: true, default: "theappinnovator@yandex.ru"},
	resetPasswordToken:String,
	resetPasswordExpires:Date,
	firstName:String,
	lastName:String,
	avatar:String,
	notifications:[
	{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Notification'
	}],
	followers:[
	{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}]
});

UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);