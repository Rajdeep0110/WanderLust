const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Home Route
app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

// ================= INDEX ROUTE =================
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

// ================= NEW ROUTE =================
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// ================= SHOW ROUTE =================
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      throw new ExpressError(404, "Listing Not Found");
    }

    res.render("listings/show.ejs", { listing });
  })
);

// ================= CREATE ROUTE =================
app.post(
  "/listings",
  wrapAsync(async (req, res) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Full req.body:", req.body);
    console.log("req.body.listing:", req.body.listing);
    console.log(
      "Title:",
      req.body.listing ? req.body.listing.title : "Listing object missing"
    );
    console.log("=============================");

    const newListing = new Listing(req.body.listing);
    await newListing.save();

    res.redirect("/listings");
  })
);

// ================= EDIT ROUTE =================
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      throw new ExpressError(404, "Listing Not Found");
    }

    res.render("listings/edit.ejs", { listing });
  })
);

// ================= UPDATE ROUTE =================
app.put(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    req.body.listing.image = {
      filename: "listingimage",
      url: req.body.listing.image,
    };

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      req.body.listing,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedListing) {
      throw new ExpressError(404, "Listing Not Found");
    }

    res.redirect(`/listings/${id}`);
  })
);

// ================= DELETE ROUTE =================
app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
      throw new ExpressError(404, "Listing Not Found");
    }

    res.redirect("/listings");
  })
);

// ================= 404 ROUTE =================
app.all("/{*any}", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something Went Wrong!" } = err;
  res.status(statusCode).send(message);
});

// ================= SERVER =================
app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});