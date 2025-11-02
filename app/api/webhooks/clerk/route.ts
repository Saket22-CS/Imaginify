/* eslint-disable camelcase */
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { createUser, updateUser, deleteUser } from "@/lib/actions/user.actions";

// 🧠 POST handler for Clerk Webhooks
export async function POST(req: NextRequest) {
  try {
    // ✅ Verify the webhook using Clerk’s built-in function
    const evt = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`✅ Received webhook: ${eventType}`);
    console.log("🪶 Payload:", evt.data);

    // 🧩 Handle user.created
    if (eventType === "user.created") {
      const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

      const user: CreateUserParams = {
        clerkId: id ?? "",
        email: email_addresses?.[0]?.email_address ?? "",
        username:
          username ??
          email_addresses?.[0]?.email_address.split("@")[0] ??
          `user_${Math.random().toString(36).substring(2, 8)}`,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        photo: image_url ?? "",
      };

      const newUser = await createUser(user);

      return NextResponse.json({ message: "User created successfully", user: newUser }, { status: 200 });
    }

    // 🧩 Handle user.updated
    if (eventType === "user.updated") {
      const { id, image_url, first_name, last_name, username } = evt.data;

      const user: UpdateUserParams = {
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        username: username ?? "",
        photo: image_url ?? "",
      };

      const updatedUser = await updateUser(String(id), user);

      return NextResponse.json({ message: "User updated successfully", user: updatedUser }, { status: 200 });
    }

    // 🧩 Handle user.deleted
    if (eventType === "user.deleted") {
      const deletedUser = await deleteUser(String(evt.data.id));

      return NextResponse.json({ message: "User deleted successfully", user: deletedUser }, { status: 200 });
    }

    console.log(`Unhandled webhook event type: ${eventType}`);
    return NextResponse.json({ message: `Ignored event: ${eventType}` }, { status: 200 });
  } catch (err) {
    console.error("❌ Error verifying webhook:", err);
    return NextResponse.json({ error: "Error verifying webhook" }, { status: 400 });
  }
}
