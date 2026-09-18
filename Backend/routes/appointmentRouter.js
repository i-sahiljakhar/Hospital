// import express from "express";
// import { clerkMiddleware } from "@clerk/express";

// import {
//   cancelAppointment,
//   confirmPayment,
//   createAppointment,
//   getAppointments,
//   getAppointmentsByDoctor,
//   getAppointmentsByPatient,
//   getRegisteredUserCount,
//   getStats,
//   updateAppointment,
// } from "../controllers/appointmentController.js";
// import { requireAuth } from "@clerk/clerk-sdk-node";

// const appointmentRouter = express.Router();

// appointmentRouter.get("/", getAppointments);
// appointmentRouter.get("/confirm", confirmPayment);
// appointmentRouter.get("/stats/summary", getStats);

// //authentic routes

// appointmentRouter.post(
//   "/",
//   clerkMiddleware(),
//   requireAuth(),
//   createAppointment,
// );
// appointmentRouter.get(
//   "/me",
//   clerkMiddleware(),
//   requireAuth(),
//   getAppointmentsByPatient,
// );

// appointmentRouter.get("/doctor/:doctorId", getAppointmentsByDoctor);

// appointmentRouter.post("/:id/cancel", cancelAppointment);
// appointmentRouter.get("/paitents/count", getRegisteredUserCount);
// appointmentRouter.put("/:id", updateAppointment);

// export default appointmentRouter;


import express from "express";

import {
  cancelAppointment,
  confirmPayment,
  createAppointment,
  getAppointments,
  getAppointmentsByDoctor,
  getAppointmentsByPatient,
  getRegisteredUserCount,
  getStats,
  updateAppointment,
} from "../controllers/appointmentController.js";

import { requireAuth } from "@clerk/express";

const appointmentRouter = express.Router();

appointmentRouter.get("/", getAppointments);
appointmentRouter.get("/confirm", confirmPayment);
appointmentRouter.get("/stats/summary", getStats);

// auth routes

appointmentRouter.post(
  "/",
  requireAuth(),
  createAppointment
);

appointmentRouter.get(
  "/me",
  requireAuth(),
  getAppointmentsByPatient
);

appointmentRouter.get("/doctor/:doctorId", getAppointmentsByDoctor);
appointmentRouter.post("/:id/cancel", cancelAppointment);
appointmentRouter.get("/patients/count", getRegisteredUserCount);
appointmentRouter.put("/:id", updateAppointment);

export default appointmentRouter;