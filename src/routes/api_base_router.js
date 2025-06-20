import express from "express";
import * as AuthController from "../controllers/auth_controller.js";
import * as PremiumTools from "../controllers/premium_tools.controller.js";
import * as Appointment from "../controllers/appointment_controller.js";
import * as ContactForm from "../controllers/contact_form_controller.js";
import * as OurTeams from "../controllers/teams_controller.js";
import upload from "../multer/multer.js";
import { isAuthenticated, isLoggedOut } from "../middleware/auth_middleware.js";
const router = express.Router();

// Public routes || user authorization
router.post("/auth/register", AuthController.register)
router.post("/auth/login", AuthController.login)
router.post("/auth/admin/login", AuthController.adminLogin)
router.get("/auth/verify-email", AuthController.verifyEmail)
router.post("/auth/verify-token", AuthController.verifyToken)

// Private routes || user authorization
// router.post("/auth/users/logout", AuthController.logout)
// router.get("/auth/users/access-token-generate", AuthController.tokenGenerate)
// router.get("/auth/users/protected-routes", AuthController.protectedRoutes)
router.get("/auth/users/list", AuthController.show)
router.get("/auth/users/:id", AuthController.single)
router.put("/auth/users/update/:id", upload.single("attachment"), AuthController.update)
// router.patch("/auth/users/password-change/:id", AuthController.passwordChange)
// router.patch("/auth/users/role/:id", AuthController.changeRole)
router.patch("/auth/users/status/:id", AuthController.changeStatus)
router.patch("/auth/users/verified/:id", AuthController.verifyManually)
router.delete("/auth/users/delete/:id", AuthController.destroy)

// Private routes || premium tools
router.post("/premium/tools", upload.single("attachment"), PremiumTools.create)
router.get("/premium/tools", PremiumTools.show)
router.get("/premium/tools/:id", PremiumTools.single)
router.put("/premium/tools/:id", upload.single("attachment"), PremiumTools.update)
router.delete("/premium/tools/:id", PremiumTools.destroy)

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