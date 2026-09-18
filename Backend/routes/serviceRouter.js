

import express from "express";
import multer from "multer";

import {
  createService,
  deleteService,
  getServices,
  getServiceById,
  updateService,
} from "../controllers/serviceController.js";

const upload = multer({ dest: "/tmp" });

const serviceRouter = express.Router();

// Get all services
serviceRouter.get("/", getServices);

// Get single service by ID
serviceRouter.get("/:id", getServiceById);

// Create service
serviceRouter.post("/", upload.single("image"), createService);

// Update service
serviceRouter.put("/:id", upload.single("image"), updateService);

// Delete service
serviceRouter.delete("/:id", deleteService);

export default serviceRouter;