let express = require("express"),
    router  = express.Router(),
    Campground = require("../models/campground"), 
    Comment = require("../models/comment"),
    middleware = require("../middleware")
    
let NodeGeocoder = require('node-geocoder');

let multer = require('multer');
let storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
let imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
let upload = multer({ storage: storage, fileFilter: imageFilter})

let cloudinary = require('cloudinary').v2
cloudinary.config({ 
  cloud_name: 'dedrnidit', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 
let options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};
     
let geocoder = NodeGeocoder(options); 

const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


// INDEX shows all campgrounds
router.get("/", (req, res)=>{
    let noMatch = null
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi')
        Campground.find({name: regex}, (err, allCampgrounds)=>{
            if(err){
                console.log(err)
            } else {
                if(allCampgrounds.length < 1){
                    noMatch = "No campgrounds found! Please try again"
                }
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch})
            }
        })
    } else {
        Campground.find({}, (err, allCampgrounds)=>{
            if(err){
                console.log(err)
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch})
            }
        })
    }
})

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var price = req.body.price;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
      if (err || !data.length) {
        console.log(err)
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }
      var lat = data[0].latitude;
      var lng = data[0].longitude;
      var location = data[0].formattedAddress;
        cloudinary.uploader.upload(req.file.path, function(err, result) {
            // add cloudinary url for the image to the campground object under image property
            let image = result.secure_url;
            let imageId = result.public_id;

        var newCampground = {name: name, image: image, imageId: imageId, price: price, description: desc, author:author, location: location, lat: lat, lng: lng};
        // Create a new campground and save to DB
            Campground.create(newCampground, function(err, newlyCreated){
                if(err){
                    console.log(err);
                } else {
                    //redirect back to campgrounds page
                    console.log(newlyCreated);
                    res.redirect("/campgrounds/" +newlyCreated.id);
                }
            });
        });
    });
});

//NEW show form to create new campground
router.get("/new", middleware.isLoggedIn, (req, res)=>{
    res.render("campgrounds/new")
})

//SHOW shows more info about one campground
router.get("/:id", async (req, res)=>{
    try {
    let foundCampground = await Campground.findById(req.params.id).populate("comments")
        if(!foundCampground){
            req.flash("error", "Campground NOT FOUND")
            res.redirect("back")
        } else {
        res.render("campgrounds/show", {campground: foundCampground})
        }
    } catch(err) {
        req.flash("error", "Campground NOT FOUND")
        res.redirect("back")
    }        
})

//EDIT campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, async (req, res)=>{
    try {
        let foundCampground = await Campground.findById(req.params.id)
        res.render("campgrounds/edit", {campground: foundCampground})
    } catch(err) {
        res.redirect("/campgrounds")
    }
})

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), (req, res)=>{
    geocoder.geocode(req.body.location, (err, data) => {
            if (err || !data.length) {
              console.log(err)
            req.flash('error', 'Invalid address');
            return res.redirect('back');
          }
          req.body.lat = data[0].latitude;
          req.body.lng = data[0].longitude;
          req.body.location = data[0].formattedAddress;
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.uploader.destroy(campground.imageId);
                  var result = await cloudinary.uploader.upload(req.file.path);
                  console.log(result)
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.lat = req.body.lat;
            campground.lng = req.body.lng;
            campground.location = req.body.location;
            campground.name = req.body.name;
            campground.price = req.body.price;
            campground.description = req.body.description;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id); 
        }
     })
    })        
})
//DESTROY campground route
router.delete("/:id", middleware.checkCampgroundOwnership, async (req, res)=>{
    try{
        let campgroundRemoved = await Campground.findByIdAndDelete(req.params.id)
        await Comment.deleteMany({_id: { $in: campgroundRemoved.comments } })
        await cloudinary.v2.uploader.destroy(campgroundRemoved.imageId);
        req.flash("error", "Campground successfully deleted!")
        res.redirect("/campgrounds")
    } catch(err){
        console.log(err)
        res.redirect("/campgrounds")
    }
})

module.exports = router