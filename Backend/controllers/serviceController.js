import Service from "../models/Service.js";

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

// ===============================
// Helper: Parse Array
// ===============================

const parseJsonArrayField = (field) => {
  if (!field) return [];

  if (Array.isArray(field)) {
    return field;
  }

  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      return typeof parsed === "string" ? [parsed] : [];
    } catch {
      return field
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

// ===============================
// Helper: Normalize Slots
// ===============================

const normalizeSlotsToMap = (slotStrings = []) => {
  const map = {};

  slotStrings.forEach((raw) => {
    const m = raw.match(
      /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*•\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );

    if (!m) {
      map["unspecified"] = map["unspecified"] || [];
      map["unspecified"].push(raw);
      return;
    }

    const [, day, monShort, year, hour, minute, ampm] = m;

    const monthIdx = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].findIndex(
      (month) => month.toLowerCase() === monShort.toLowerCase()
    );

    const mm = String(monthIdx + 1).padStart(2, "0");
    const dd = String(Number(day)).padStart(2, "0");

    const dateKey = `${year}-${mm}-${dd}`;

    const timeStr = `${String(Number(hour)).padStart(
      2,
      "0"
    )}:${String(minute)} ${ampm.toUpperCase()}`;

    map[dateKey] = map[dateKey] || [];
    map[dateKey].push(timeStr);
  });

  return map;
};

// ===============================
// Helper: Sanitize Price
// ===============================

const sanitizePrice = (value) => {
  return Number(String(value ?? "0").replace(/[^\d.-]/g, "")) || 0;
};

// ===============================
// Helper: Parse Availability
// ===============================

const parseAvailability = (value) => {
  const s = String(value ?? "available").toLowerCase();

  return s === "available" || s === "true";
};

// ===============================
// CREATE SERVICE
// POST /api/services
// ===============================

export async function createService(req, res) {
  try {
    const b = req.body || {};

    const instructions = parseJsonArrayField(b.instructions);

    const rawSlots = parseJsonArrayField(b.slots);

    const slots = normalizeSlotsToMap(rawSlots);

    const numericPrice = sanitizePrice(b.price);

    const available = parseAvailability(b.availability);

    let imageUrl = null;
    let imagePublicId = null;

    // Upload image
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.path,
          "services"
        );

        imageUrl = uploadResult?.secure_url || null;

        imagePublicId = uploadResult?.public_id || null;
      } catch (error) {
        console.error("Cloudinary upload error:", error);
      }
    }

    const service = new Service({
      name: b.name,

      about: b.about || "",

      shortDescription: b.shortDescription || "",

      price: numericPrice,

      available,

      instructions,

      slots,

      imageUrl,

      imagePublicId,
    });

    const savedService = await service.save();

    return res.status(201).json({
      success: true,

      data: savedService,

      message: "Service Created",
    });
  } catch (error) {
    console.error("createService Error:", error);

    return res.status(500).json({
      success: false,

      message: "Server Error",
    });
  }
}

// ===============================
// GET ALL SERVICES
// GET /api/services
// ===============================

export async function getServices(req, res) {
  try {
    const list = await Service.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,

      data: list,
    });
  } catch (error) {
    console.error("getServices Error:", error);

    return res.status(500).json({
      success: false,

      message: "Server Error",
    });
  }
}

// ===============================
// GET SERVICE BY ID
// GET /api/services/:id
// ===============================

export async function getServiceById(req, res) {
  try {
    const { id } = req.params;

    const service = await Service.findById(id).lean();

    if (!service) {
      return res.status(404).json({
        success: false,

        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: service,
    });
  } catch (error) {
    console.error("getServiceById Error:", error);

    return res.status(500).json({
      success: false,

      message: "Server Error",
    });
  }
}

// ===============================
// UPDATE SERVICE
// PUT /api/services/:id
// ===============================

export async function updateService(req, res) {
  try {
    const { id } = req.params;

    // Find existing service
    const existing = await Service.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,

        message: "Service not found",
      });
    }

    const b = req.body || {};

    const updateData = {};

    // Update name
    if (b.name !== undefined) {
      updateData.name = b.name;
    }

    // Update about
    if (b.about !== undefined) {
      updateData.about = b.about;
    }

    // Update short description
    if (b.shortDescription !== undefined) {
      updateData.shortDescription = b.shortDescription;
    }

    // Update price
    if (b.price !== undefined) {
      updateData.price = sanitizePrice(b.price);
    }

    // Update availability
    if (b.availability !== undefined) {
      updateData.available = parseAvailability(
        b.availability
      );
    }

    // Update instructions
    if (b.instructions !== undefined) {
      updateData.instructions =
        parseJsonArrayField(b.instructions);
    }

    // Update slots
    if (b.slots !== undefined) {
      updateData.slots = normalizeSlotsToMap(
        parseJsonArrayField(b.slots)
      );
    }

    // ===============================
    // Update Image
    // ===============================

    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.path,
          "services"
        );

        if (uploadResult?.secure_url) {
          updateData.imageUrl =
            uploadResult.secure_url;

          updateData.imagePublicId =
            uploadResult.public_id || null;

          // Delete old image
          if (existing.imagePublicId) {
            try {
              await deleteFromCloudinary(
                existing.imagePublicId
              );
            } catch (error) {
              console.warn(
                "Cloudinary old image delete failed:",
                error?.message || error
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Cloudinary upload error:",
          error
        );
      }
    }

    // Update database
    const updatedService =
      await Service.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,

          runValidators: true,
        }
      );

    return res.status(200).json({
      success: true,

      data: updatedService,

      message: "Service Updated",
    });
  } catch (error) {
    console.error("updateService Error:", error);

    return res.status(500).json({
      success: false,

      message: "Server Error",
    });
  }
}

// ===============================
// DELETE SERVICE
// DELETE /api/services/:id
// ===============================

export async function deleteService(req, res) {
  try {
    const { id } = req.params;

    const existing = await Service.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,

        message: "Service not found",
      });
    }

    // Delete image from Cloudinary
    if (existing.imagePublicId) {
      try {
        await deleteFromCloudinary(
          existing.imagePublicId
        );
      } catch (error) {
        console.warn(
          "Failed to delete image from Cloudinary:",
          error?.message || error
        );
      }
    }

    // Delete service from MongoDB
    await existing.deleteOne();

    return res.status(200).json({
      success: true,

      message: "Service Deleted",
    });
  } catch (error) {
    console.error("deleteService Error:", error);

    return res.status(500).json({
      success: false,

      message: "Server Error",
    });
  }
}