import express from "express";
import * as AuthController from "../controllers/auth_controller.js";
import * as Categories from "../controllers/items/categories_controller.js";
import * as Items from "../controllers/items/items_controller.js";
import * as FreeItems from "../controllers/items/free_items_controller.js";
import * as Appointment from "../controllers/appointment_controller.js";
import * as ContactForm from "../controllers/contact_form_controller.js";
import * as OurTeams from "../controllers/our_teams_controller.js";
import * as CheckOut from "../controllers/items/checkout_controller.js";
import * as FreeCheckOut from "../controllers/items/free_checkout_controller.js";
import * as Review from "../controllers/items/reviews_controller.js";
import { isAuthenticated, isLoggedOut } from "../middleware/auth_middleware.js";
import upload from "../multer/multer.js";
const router = express.Router();

// Public routes || user authorization
router.post("/auth/register", AuthController.register)
router.post("/auth/login", AuthController.login)
router.post("/auth/admin/login", AuthController.adminLogin)
router.get("/auth/verify-email", AuthController.verifyEmail)
router.post("/auth/verify-token", AuthController.verifyToken)
router.post("/auth/forget-password", AuthController.forgetPassword)

// Private routes || user authorization
router.get("/auth/users/list", AuthController.show)
router.get("/auth/users/:id", AuthController.single)
router.put("/auth/users/update/:id", upload.single("attachment"), AuthController.update)
router.patch("/auth/users/status/:id", AuthController.changeStatus)
router.patch("/auth/users/verified/:id", AuthController.verifyManually)
router.delete("/auth/users/delete/:id", AuthController.destroy)

// Private routes || categories
router.post("/items/categories", upload.single("attachment"), Categories.create)
router.get("/items/categories", Categories.show)
router.get("/items/categories/:id", Categories.single)
router.put("/items/categories/:id", upload.single("attachment"), Categories.update)
router.delete("/items/categories/:id", Categories.destroy)

// Private routes || premium product
router.post("/items/premium/product", upload.single("attachment"), Items.create)
router.get("/items/premium/product", Items.show)
router.get("/items/premium/product/:id", Items.single)
router.put("/items/premium/product/:id", upload.single("attachment"), Items.update)
router.delete("/items/premium/product/:id", Items.destroy)

// Private routes || free product
router.post("/items/free/product", upload.single("attachment"), FreeItems.create)
router.get("/items/free/product", FreeItems.show)
router.get("/items/free/product/:id", FreeItems.single)
router.put("/items/free/product/:id", upload.single("attachment"), FreeItems.update)
router.delete("/items/free/product/:id", FreeItems.destroy)

// Private routes || product reviews
router.post("/items/:item_id/reviews", Review.create);
router.get("/items/:item_id/reviews", Review.show);
router.patch("/items/:item_id/reviews/:review_id/status", Review.update);
router.delete("/items/:item_id/reviews/:review_id", Review.destroy);
router.post("/items/:item_id/reviews/:review_id/reply", Review.replyToReview);

// Private routes || free checkout
router.post("/items/free/product/checkout", FreeCheckOut.create)
router.get("/items/free/product/checkout", FreeCheckOut.show)
router.put("/items/free/product/checkout/:id", FreeCheckOut.update)
router.delete("/items/free/product/checkout", FreeCheckOut.destroy)

// Private routes || checkout
router.post("/items/product/checkout", CheckOut.create)
router.get("/items/product/checkout", CheckOut.show)
router.put("/items/product/checkout/:id", CheckOut.update)
router.delete("/items/product/checkout", CheckOut.destroy)

// Private routes || appointment meeting
router.post("/appointment/schedule", isAuthenticated, Appointment.create)
router.get("/appointment/schedule", Appointment.show)
router.get("/appointment/schedule/:id", Appointment.single)
router.put("/appointment/schedule/:id", Appointment.update)
router.delete("/appointment/schedule/:id", Appointment.destroy)

// Private routes || contact from
router.post("/users/contact-form", ContactForm.create)
router.get("/users/contact-form", ContactForm.show)
router.get("/users/contact-form/:id", ContactForm.single)
router.put("/users/contact-form/:id", ContactForm.update)
router.delete("/users/contact-form/:id", ContactForm.destroy)

// Private routes || our teams
router.post("/users/our-teams", upload.single("attachment"), OurTeams.create)
router.get("/users/our-teams", OurTeams.show)
router.get("/users/our-teams/:id", OurTeams.single)
router.put("/users/our-teams/:id", upload.single("attachment"), OurTeams.update)
router.delete("/users/our-teams/:id", OurTeams.destroy)



export default router;