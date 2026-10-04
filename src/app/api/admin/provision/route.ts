import { auth } from "@/src/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  try {
    const response = await fetch(
      `${process.env.TRASHPOINT_BACKEND_URL}users/provision`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.TRASHPOINT_INTERNAL_API_SECRET!,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to provision account." },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Provision route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}