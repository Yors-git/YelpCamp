let mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose")

let UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: String,
    avatar: String,
    firstName: String,
    lastName: String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: String,
    isAdmin: {type: Boolean, default: false}
})

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema)