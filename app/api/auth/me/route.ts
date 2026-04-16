import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET

  if (!token || !secret) {
    return NextResponse.json({ loggedIn: false })
  }

  try {
    const decoded: any = jwt.verify(token, secret)
    return NextResponse.json({ loggedIn: true, role: decoded.role, email: decoded.email })
  } catch (e) {
    return NextResponse.json({ loggedIn: false })
  }
}
