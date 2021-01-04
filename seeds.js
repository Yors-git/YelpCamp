let mongoose   = require("mongoose"),
    Campground = require("./models/campground"),
    Comment    = require("./models/comment")

let seeds = [
    {
        name: "Rocky Mountain",
        image: "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
        description: "Bacon ipsum dolor amet short ribs landjaeger brisket capicola. Short loin pork loin chicken, swine landjaeger meatloaf short ribs pig kielbasa andouille shank. Landjaeger flank jowl, meatloaf ham hock picanha shank frankfurter beef ribs rump turducken. Buffalo andouille burgdoggen strip steak cow.",
        author:{
            id : "588c2e092403d111454fff76",
            username: "Jack"
        }
    },
    {
        name: "Cloud's Rest",
        image: "https://images.unsplash.com/photo-1536516797197-234485ed38f7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
        description: "Bacon ipsum dolor amet short ribs landjaeger brisket capicola. Short loin pork loin chicken, swine landjaeger meatloaf short ribs pig kielbasa andouille shank. Landjaeger flank jowl, meatloaf ham hock picanha shank frankfurter beef ribs rump turducken. Buffalo andouille burgdoggen strip steak cow.",
        author:{
            id : "588c2e092403d111454fff71",
            username: "Jill"
        }
    },
    {
        name: "Aurora Valley",
        image: "https://images.unsplash.com/photo-1493810329807-db131c118da5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
        description: "Bacon ipsum dolor amet short ribs landjaeger brisket capicola. Short loin pork loin chicken, swine landjaeger meatloaf short ribs pig kielbasa andouille shank. Landjaeger flank jowl, meatloaf ham hock picanha shank frankfurter beef ribs rump turducken. Buffalo andouille burgdoggen strip steak cow.",
        author:{
            id : "588c2e092403d111454fff77",
            username: "Jane"
        }
    }
]

const seedDB = async () => {
    try {
        //Remove all campgrounds
        await Campground.deleteMany({})
        await Comment.deleteMany({})
        console.log("Removed campgrounds!")
        //Add a few campgrounds
        for(const seed of seeds){
            let campground = await Campground.create(seed)
            console.log("Campground created!!")
            let comment = await Comment.create(
                {
                    text: "This place is great but I wish there was internet",
                    author: "Homer"
                }
            )
            campground.comments.push(comment)
            campground.save()
        }
    } catch(err){
        console.log(err)
    }
}

module.exports = seedDB
