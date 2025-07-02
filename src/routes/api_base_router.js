import express from "express";
import * as AuthController from "../controllers/auth_controller.js";
import * as Categories from "../controllers/items/categories_controller.js";
import * as Items from "../controllers/items/items_controller.js";
import * as Appointment from "../controllers/appointment_controller.js";
import * as ContactForm from "../controllers/contact_form_controller.js";
import * as OurTeams from "../controllers/our_teams_controller.js";
import * as CheckOut from "../controllers/items/checkout_controller.js";
import { isAuthenticated, isLoggedOut } from "../middleware/auth_middleware.js";
import upload from "../multer/multer.js";
const router = express.Router();

// Public routes || user authorization
router.post("/auth/register", AuthController.register)
router.post("/auth/login", AuthController.login)
router.post("/auth/admin/login", AuthController.adminLogin)
router.get("/auth/verify-email", AuthController.verifyEmail)
router.post("/auth/verify-token", AuthController.verifyToken)

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

// Private routes || premium tools
router.post("/items/premium-tools", upload.single("attachment"), Items.create)
router.get("/items/premium-tools", Items.show)
router.get("/items/premium-tools/:id", Items.single)
router.put("/items/premium-tools/:id", upload.single("attachment"), Items.update)
router.delete("/items/premium-tools/:id", Items.destroy)

// Private routes || checkout
router.post("/items/premium-tools/checkout", CheckOut.create)

// Private routes || appointment meeting
router.post("/appointment/schedule", isAuthenticated, Appointment.create)
router.get("/appointment/schedule", Appointment.show)
router.get("/appointment/schedule/:id", Appointment.single)
router.put("/appointment/schedule/:id", Appointment.update)
router.delete("/appointment/schedule/:id", Appointment.update)

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