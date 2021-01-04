let Campground = require("../models/campground"), 
    Comment = require("../models/comment")
let middlewareObj = {}

middlewareObj.checkCampgroundOwnership = async (req, res, next) => {
    try {
        //is user logged in?
        if(req.isAuthenticated()){
            let foundCampground = await Campground.findById(req.params.id)
            //does user owns campground?
            if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                next()
            } else {
                req.flash("error", "You don't have permission to do that")
                res.redirect("back")
            }
        } else {
            req.flash("error", "You need to be logged in to do that")
            res.redirect("back")
        }
    } catch(err) {
        req.flash("error", "Campground fot found")
        res.redirect("back")
    }
}

middlewareObj.checkCommentOwnership = async (req, res, next) => {
    try {
        //is user logged in?
        if(req.isAuthenticated()){
            let foundComment = await Comment.findById(req.params.comment_id)
            //does user owns comment?
            if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                next()
            } else {
                req.flash("error", "You don't have permission to do that")
                res.redirect("back")
            }
        } else {
            req.flash("error", "You need to be logged in to do that")
            res.redirect("back")
        }
    } catch(err) {
        req.flash("error", "Something went wrong")
        res.redirect("back")
    }
}

middlewareObj.isLoggedIn = (req, res, next)=>{
    if(req.isAuthenticated()){
        return next()
    }
    req.flash("error", "You need to be logged in to do that")
    res.redirect("/login") 
}

module.exports = middlewareObj