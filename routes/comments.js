let express = require("express"),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    router  = express.Router({mergeParams: true}), 
    middleware = require("../middleware")

//Comments new
router.get("/new", middleware.isLoggedIn, async(req, res)=>{
    try{
        let camp = await Campground.findById(req.params.id)
        res.render("comments/new", {campground: camp})
    } catch(err){
        console.log(err)
    }
})

//Comments create
router.post("/", middleware.isLoggedIn, async(req, res)=>{
    try{
        let newCamp = await Campground.findById(req.params.id)
        let newComm = await Comment.create(req.body.comment)
        newComm.author.id = req.user.id
        newComm.author.username = req.user.username
        newComm.save()
        newCamp.comments.push(newComm)
        newCamp.save()
        console.log(newComm)
        req.flash("success", "Succesfully added comment")
        res.redirect(`/campgrounds/${newCamp._id}`)
    } catch(err){
        req.flash("error", "Something went wrong!")
        console.log(err)
    }
})

//Comments edit
router.get("/:comment_id/edit", middleware.checkCommentOwnership, async (req, res)=>{
    try{
    let foundComment = await Comment.findById(req.params.comment_id)
    res.render("comments/edit", {campground_id: req.params.id, comment: foundComment})
    }catch(err){
        res.redirect("back")
    }
})

//Comments update
router.put("/:comment_id", middleware.checkCommentOwnership, async (req, res)=>{
    try {
        await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment)
        //redirect to SHOW to show changes
        res.redirect(`/campgrounds/${req.params.id}`)         
    } catch(err){
        console.log(err)
        res.redirect("back")
    }
})

//Comments destroy
router.delete("/:comment_id", middleware.checkCommentOwnership, async (req, res)=>{
    try{
        await Comment.findByIdAndDelete(req.params.comment_id)
        req.flash("success", "Comment deleted!")
        res.redirect(`/campgrounds/${req.params.id}`)
    } catch(err){
        console.log(err)
        res.redirect("back")
    }
})
module.exports = router