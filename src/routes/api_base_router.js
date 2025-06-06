import express from "express";
import * as AuthController from "../controllers/auth_controller.js";
import upload from "../multer/multer.js";
const router = express.Router();

// Public routes || user authorization
router.post("/auth/register", AuthController.register)
router.post("/auth/login", AuthController.login)
router.get("/auth/verify-email", AuthController.verifyEmail)

// Private routes || user authorization
router.post("/auth/users/logout", AuthController.logout)
router.get("/auth/users/access-token-generate", AuthController.tokenGenerate)
router.get("/auth/users/protected-routes", AuthController.protectedRoutes)
router.get("/auth/users/list", AuthController.show)
router.get("/auth/users/:id", AuthController.single)
router.put("/auth/users/:id", upload.single("attachment"), AuthController.update)
router.patch("/auth/users/password-change/:id", AuthController.passwordChange)
router.patch("/auth/users/role/:id", AuthController.changeRole)
router.patch("/auth/users/suspended/:id", AuthController.isSuspended)
router.delete("/auth/users/:id", AuthController.destroy)

// Private routes || premium tools
router.post("/premium/tools", AuthController.logout)






export default router;