import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Please correct the highlighted fields.", details: error.issues },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message.includes("MongoDB is not configured")) {
    return NextResponse.json(
      { error: "This feature is not configured yet. Contact the site administrator." },
      { status: 503 },
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return NextResponse.json(
      { error: "That URL slug is already in use. Choose a unique slug." },
      { status: 409 },
    );
  }

  console.error("Elliottask API request failed:", error);
  return NextResponse.json(
    { error: "The request could not be completed. Please try again later." },
    { status: 500 },
  );
}
