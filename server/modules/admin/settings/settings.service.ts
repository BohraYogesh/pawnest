
import { prisma } from "../../../config/db";
import type { UpdateSettingsInput } from "./settings.schema";

const defaultSettings = {
  id: 1,
  storeName: "PawNest",
  supportEmail: "support@pawnest.com",
  phone: "+91 98765 43210",
  address:
    "H-102, Maple Apartments, Ajmer Road, Vaishali Nagar, Jaipur, Rajasthan 302021, India",
  lowStockThreshold: 5,
  shippingFlatPaise: 8000,
  freeShippingAbovePaise: 99900,
};

export async function getGeneralSettings() {
  return prisma.storeSetting.upsert({
    where: { id: 1 },
    update: {},
    create: defaultSettings,
  });
}

export async function updateGeneralSettings(
  input: UpdateSettingsInput,
  userId: string,
) {
  const previousSettings = await getGeneralSettings();

  const settings = await prisma.storeSetting.update({
    where: { id: 1 },
    data: input,
  });

  const changes: Record<
    string,
    { old: string | number; new: string | number }
  > = {};

  const fields = [
    "storeName",
    "supportEmail",
    "phone",
    "address",
    "lowStockThreshold",
  ] as const;

  for (const field of fields) {
    if (previousSettings[field] !== settings[field]) {
      changes[field] = {
        old: previousSettings[field],
        new: settings[field],
      };
    }
  }

  if (Object.keys(changes).length > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "UPDATE",
        entity: "STORE_SETTINGS",
        entityId: String(settings.id),
        metadata: changes,
      },
    });
  }

  return settings;
}

