import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyEmailToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token de vérification manquant" },
      { status: 400 }
    );
  }

  try {
    // Vérifier le token
    const payload = await verifyEmailToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Jeton de vérification invalide ou expiré" },
        { status: 400 }
      );
    }

    // Marquer l'utilisateur comme vérifié
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { emailVerified: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Email vérifié avec succès",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification de l'email" },
      { status: 500 }
    );
  }
}