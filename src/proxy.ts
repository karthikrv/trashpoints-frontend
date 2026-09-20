import { auth } from "@/src/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (req.nextUrl.pathname.includes("/grid") && req.auth?.role == "admin" && req.auth?.isAuthorised) {
    return NextResponse.next()
  } else if (req.nextUrl.pathname.includes("/station") && req.auth?.role == "partner" && req.auth?.isAuthorised) {
    return NextResponse.next()
  } else if (req.nextUrl.pathname.includes("/wallet") && req.auth?.role == "consumer" && req.auth?.isAuthorised) {
    return NextResponse.next()
  } else {
    return NextResponse.redirect(new URL("/", req.url))
  }
})

export const config = {
  matcher: ["/grid/:path*", "/station/:path*", "/wallet/:path*"],
};
