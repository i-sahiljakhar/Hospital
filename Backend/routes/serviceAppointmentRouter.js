// import express from "express";
// import { clerkMiddleware, requireAuth } from "@clerk/express";

// import {
//   cancelServiceAppointment,
//   confirmServicePayment,
//   createServiceAppointment,
//   getServiceAppointmentById,
//   getServiceAppointments,
//   getServiceAppointmentsByPatient,
//   getServiceAppointmentStats,
// } from "../controllers/serviceAppointmentControllers.js";
// import { updateAppointment } from "../controllers/appointmentController.js";

// const serviceAppointmentRouter = express.Router();

// serviceAppointmentRouter.get("/", getServiceAppointments);
// serviceAppointmentRouter.get("/confirm", confirmServicePayment);
// serviceAppointmentRouter.get("/stats/summery", getServiceAppointmentStats);

// serviceAppointmentRouter.post(
//   "/",
//   clerkMiddleware(),
//   requireAuth(),
//   createServiceAppointment,
// );

// serviceAppointmentRouter.get(
//   "/me",
//   clerkMiddleware(),
//   requireAuth(),
//   getServiceAppointmentsByPatient,
// );

// serviceAppointmentRouter.get("/:id", getServiceAppointmentById);
// serviceAppointmentRouter.put("/:id", updateAppointment);
// serviceAppointmentRouter.post("/:id/cancel", cancelServiceAppointment);

// export default serviceAppointmentRouter;


import express from "express";

import { clerkMiddleware, requireAuth } from "@clerk/express";

import {
  cancelServiceAppointment,
  confirmServicePayment,
  createServiceAppointment,
  getServiceAppointmentById,
  getServiceAppointments,
  getServiceAppointmentsByPatient,
  getServiceAppointmentStats,
  updateServiceAppointment,
} from "../controllers/serviceAppointmentControllers.js";

const serviceAppointmentRouter = express.Router();

serviceAppointmentRouter.get("/", getServiceAppointments);

serviceAppointmentRouter.get("/confirm", confirmServicePayment);

serviceAppointmentRouter.get("/stats/summery", getServiceAppointmentStats);

serviceAppointmentRouter.post(
  "/",
  clerkMiddleware(),
  requireAuth(),
  createServiceAppointment,
);

serviceAppointmentRouter.get(
  "/me",
  clerkMiddleware(),
  requireAuth(),
  getServiceAppointmentsByPatient,
);

serviceAppointmentRouter.get("/:id", getServiceAppointmentById);

serviceAppointmentRouter.put("/:id", updateServiceAppointment);

serviceAppointmentRouter.post("/:id/cancel", cancelServiceAppointment);

export default serviceAppointmentRouter;