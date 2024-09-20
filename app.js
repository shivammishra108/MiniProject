const express = require("express")
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/expressError.js");
const{listingSchema} = require("./schema.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wonderLust"
async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
.then(()=>{
    console.log("connected to db")
})
.catch((err)=>{
    console.log(err);
});

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,"/public")));
// use ejs-locals for all ejs templates:
app.engine('ejs', ejsMate);



app.get("/",(req,res)=>{
    res.send("Hi, I am root");
})

const validateListing = (req,res,next)=>{
    const {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
}

//index Route
app.get("/listings",wrapAsync(async(req,res)=>{
   const allListing =  await Listing.find({});
   res.render("listings/index.ejs",{allListing});
})
);

//New Route
app.get("/listings/new",wrapAsync((req,res)=>{
    res.render("listings/new.ejs")
})
);


//show route
app.get("/listings/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
})
);

//create route
app.post("/listings",validateListing, wrapAsync(async(req,res,next)=>{
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
})
);

//edit route
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
})
);

//update route
app.put("/listings/:id",validateListing,wrapAsync(async(req,res)=>{
    let {id} = req.params;
   await Listing.findByIdAndUpdate(id,{...req.body.listing});
   //redirecting to show route
   res.redirect(`/listings/${id}`);
})
);

//delete route
app.delete("/listings/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
})
);

// app.get("/testListning", async(req,res)=>{
//    let smapleListing = new Listing({
//     title: "My new Villa",
//     description: "By the beach",
//     price:1200,
//     location: "Beah Mumbai",
//     country:"india",
//    });
//    await smapleListing.save()
//    console.log("Sample saved")
//    res.send("successuly testing");
// });

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});

app.use((err,req,res,next)=>{
    let{statusCode=500, message="Somethig went wrong!"} = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{err});
})
app.listen(8080,()=>{
    console.log("Server is listening at 8080");
});