import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    console.log("===> API: /api/send-lonespec kallad");

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    const email = formData.get("email") as string;
    const namn = formData.get("namn") as string;

    console.log("===> Mottagen e-post:", email);
    console.log("===> Mottagen namn:", namn);
    console.log("===> Mottagen pdfFile:", pdfFile ? pdfFile.name : "INGEN PDF");

    if (!pdfFile || !email) {
      console.error("===> Saknar PDF eller e-post");
      return NextResponse.json({ error: "Saknar PDF eller e-post." }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    console.log("===> PDF buffer size:", pdfBuffer.length);

    const { data, error } = await resend.emails.send({
      from: "info@xn--bokfr-mua.com",
      to: email,
      subject: "Din lönespecifikation",
      html: `<p>Hej ${namn},<br/>Här kommer din lönespecifikation som PDF.<br/><br/>Vänliga hälsningar,<br/>Lönesystemet</p>`,
      attachments: [
        {
          filename: "lonespec.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("===> Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("===> Mail skickat! Resend data:", data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("===> Fångat fel i API:", err);
    return NextResponse.json({ error: err.message || "Något gick fel i API." }, { status: 500 });
  }
}
